import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { handleMessage } from './botParser';
import * as repo from './financeRepo';
import * as authRepo from './authRepo';
import { WhatsAppStatus } from '../types';

export default class WhatsAppService {
  io: any;
  sock: any;
  qrCode: string | null;
  connectionStatus: WhatsAppStatus['status'];
  userInfo: any;
  authFolder: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  botSentMessageIds: Set<string>;

  constructor(io: any = null) {
    this.io = io;
    this.sock = null;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
    this.userInfo = null;
    this.authFolder = path.resolve(process.cwd(), 'auth_info_baileys');
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.botSentMessageIds = new Set();
  }

  async start() {
    try {
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version } = await fetchLatestBaileysVersion();

      this.connectionStatus = 'connecting';
      this.emitStatus();

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['ZxWallet Dashboard', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCode = await QRCode.toDataURL(qr);
            this.connectionStatus = 'qr_ready';
            this.emitStatus();
          } catch (err) {
            console.error('Failed to generate QR DataURL:', err);
          }
        }

        if (connection === 'close') {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          this.connectionStatus = 'disconnected';
          this.qrCode = null;
          this.userInfo = null;
          this.emitStatus();

          console.log('WhatsApp connection closed. Should reconnect:', shouldReconnect);

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
            console.log(`Reconnecting WhatsApp in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.start(), delay);
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp bot successfully connected!');
          this.reconnectAttempts = 0;
          this.connectionStatus = 'connected';
          this.qrCode = null;

          const user = this.sock.user;
          this.userInfo = {
            id: user?.id,
            name: user?.name || 'Bot Keuangan',
            phone: user?.id ? user.id.split(':')[0].split('@')[0] : ''
          };
          this.emitStatus();
        }
      });

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async (m: any) => {
        try {
          if (!m.messages || m.messages.length === 0) return;

          for (const msg of m.messages) {
            if (!msg.message) continue;

            const remoteJid = msg.key.remoteJid || '';

            const isGroup = remoteJid.endsWith('@g.us');
            const isStatus = remoteJid.includes('broadcast');
            const isNewsletter = remoteJid.endsWith('@newsletter');

            if (isGroup || isStatus || isNewsletter) {
              continue;
            }

            if (this.botSentMessageIds.has(msg.key.id)) {
              continue;
            }

            const myJid = this.sock?.user?.id || '';
            const myLid = this.sock?.user?.lid || '';
            const myPhone = myJid.split(':')[0].split('@')[0];
            const myLidClean = myLid.split(':')[0].split('@')[0];

            const remoteClean = remoteJid.split('@')[0].split(':')[0];

            const isSelfChat = 
              (myPhone && remoteClean === myPhone) || 
              (myLidClean && remoteClean === myLidClean) ||
              (myPhone && remoteJid.includes(myPhone));

            if (msg.key.fromMe && !isSelfChat) {
              continue;
            }

            let msgObj = msg.message;
            if (msgObj.ephemeralMessage?.message) msgObj = msgObj.ephemeralMessage.message;
            if (msgObj.viewOnceMessage?.message) msgObj = msgObj.viewOnceMessage.message;
            if (msgObj.viewOnceMessageV2?.message) msgObj = msgObj.viewOnceMessageV2.message;
            if (msgObj.documentWithCaptionMessage?.message) msgObj = msgObj.documentWithCaptionMessage.message;

            const messageContent = (
              msgObj.conversation ||
              msgObj.extendedTextMessage?.text ||
              msgObj.imageMessage?.caption ||
              msgObj.videoMessage?.caption ||
              ''
            ).trim();

            if (!messageContent) continue;

            const pushName = msg.pushName || (isSelfChat ? (this.sock.user?.name || 'Saya') : 'Pengguna WA');
            const resolvedPhone = this.resolveRealPhone(remoteJid) || remoteClean || myPhone;
            const senderPhone = (resolvedPhone || '').replace(/\D/g, '');

            // Only the admin (ADMIN_PHONE) and registered users get replies
            const isAdmin = !!authRepo.ADMIN_PHONE && senderPhone === authRepo.ADMIN_PHONE;
            if (!isAdmin && !authRepo.findUserByPhone(senderPhone)) {
              console.log(`[WA Abaikan] Pesan dari ${senderPhone} diabaikan (belum terdaftar)`);
              continue;
            }

            console.log(`[WA Pesan Masuk] Dari: ${pushName} (${senderPhone}): "${messageContent}"`);

            const user = authRepo.createOrGetWaUser({
              name: pushName || 'ZxAkito',
              phone: senderPhone
            });

            // Show "mengetik..." while the AI works; presence failures must not block the reply.
            await this.sock.sendPresenceUpdate('composing', remoteJid).catch(() => {});

            const responseResult = await handleMessage(messageContent, {
              senderPhone,
              senderName: pushName,
              userId: user?.id
            }).finally(() => this.sock.sendPresenceUpdate('paused', remoteJid).catch(() => {}));

            if (responseResult && responseResult.text) {
              const targetJid = remoteJid.endsWith('@s.whatsapp.net') 
                ? remoteJid 
                : (senderPhone ? `${senderPhone}@s.whatsapp.net` : remoteJid);

              console.log(`[WA Balasan AI] Mengirim ke ${targetJid}: "${responseResult.text.slice(0, 70)}..."`);

              repo.logChat({
                sender: `${pushName} (${senderPhone})`,
                message: messageContent,
                response: responseResult.text,
                status: 'success'
              });

              const content = 'file' in responseResult && responseResult.file
                ? {
                    document: responseResult.file.buffer,
                    mimetype: responseResult.file.mimetype,
                    fileName: responseResult.file.fileName,
                    caption: responseResult.text
                  }
                : { text: responseResult.text };

              let sent: any = null;
              try {
                sent = await this.sock.sendMessage(targetJid, content);
              } catch (sendErr: any) {
                console.warn(`[WA Retry] Gagal mengirim ke ${targetJid}, mencoba ke ${remoteJid}:`, sendErr.message);
                sent = await this.sock.sendMessage(remoteJid, content);
              }

              if (sent?.key?.id) {
                this.botSentMessageIds.add(sent.key.id);
                if (this.botSentMessageIds.size > 500) {
                  const firstKey = this.botSentMessageIds.values().next().value;
                  if (firstKey) this.botSentMessageIds.delete(firstKey);
                }
              }

              if (this.io) {
                this.io.emit('chat:received', {
                  sender: pushName,
                  senderPhone,
                  message: messageContent,
                  reply: responseResult.text,
                  type: responseResult.type,
                  timestamp: new Date().toISOString()
                });

                if (responseResult.type === 'transaction') {
                  this.io.emit('transaction:added', responseResult.data);
                  this.io.emit('dashboard:refresh', repo.getSummary({ user_id: user?.id }));
                } else if (responseResult.type === 'budget') {
                  this.io.emit('dashboard:refresh', repo.getSummary({ user_id: user?.id }));
                }
              }
            }
          }
        } catch (err) {
          console.error('[WA Error Handler]:', err);
        }
      });
    } catch (error) {
      console.error('Failed to initialize Baileys:', error);
      this.connectionStatus = 'disconnected';
      this.emitStatus();
    }
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      if (fs.existsSync(this.authFolder)) {
        fs.rmSync(this.authFolder, { recursive: true, force: true });
      }
      this.connectionStatus = 'disconnected';
      this.qrCode = null;
      this.userInfo = null;
      this.emitStatus();
      console.log('WhatsApp successfully logged out & session cleared.');
    } catch (err) {
      console.error('Error logging out WhatsApp:', err);
    }
  }

  async restart() {
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (e) {}
    }
    this.reconnectAttempts = 0;
    await this.start();
  }

  resolveRealPhone(jid: string): string {
    if (!jid) return '';
    const cleanId = jid.split('@')[0].split(':')[0];

    if (jid.endsWith('@s.whatsapp.net')) {
      return cleanId;
    }

    try {
      const reverseFile = path.resolve(this.authFolder, `lid-mapping-${cleanId}_reverse.json`);
      if (fs.existsSync(reverseFile)) {
        const phone = JSON.parse(fs.readFileSync(reverseFile, 'utf8'));
        if (phone) return phone.toString().replace(/\D/g, '');
      }
    } catch (e) {}

    return cleanId;
  }

  async checkWhatsAppNumber(phone: string) {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }

    const isValidFormat = /^628\d{8,12}$/.test(clean);
    if (!isValidFormat) {
      return {
        exists: false,
        phone: clean,
        isLiveCheck: false,
        reason: 'Format nomor tidak valid. Gunakan nomor Indonesia (contoh: 08123456789 atau 628123456789).'
      };
    }

    if (this.sock && this.connectionStatus === 'connected') {
      try {
        const jid = clean + '@s.whatsapp.net';
        const results = await this.sock.onWhatsApp(jid);
        const match = results?.[0];
        const exists = !!(match && match.exists);
        return {
          exists,
          jid: match?.jid || jid,
          phone: clean,
          isLiveCheck: true,
          reason: exists ? 'Nomor aktif dan terdaftar di WhatsApp' : 'Nomor ini TIDAK terdaftar di WhatsApp'
        };
      } catch (err) {
        console.error('Error onWhatsApp check:', err);
      }
    }

    return {
      exists: true,
      phone: clean,
      isLiveCheck: false,
      reason: 'Format nomor valid.'
    };
  }

  async sendMessageToPhone(phone: string, text: string) {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }

    const jid = clean + '@s.whatsapp.net';
    if (this.sock && this.connectionStatus === 'connected') {
      try {
        await this.sock.sendMessage(jid, { text });
        return { sent: true };
      } catch (err: any) {
        console.error('Failed to send WA message:', err);
        return { sent: false, error: err.message };
      }
    }
    return { sent: false, reason: 'WhatsApp bot offline' };
  }

  emitStatus() {
    if (this.io) {
      this.io.emit('wa:status', {
        status: this.connectionStatus,
        qr: this.qrCode,
        user: this.userInfo
      });
    }
  }

  getStatus(): WhatsAppStatus {
    return {
      status: this.connectionStatus,
      qr: this.qrCode,
      user: this.userInfo
    };
  }
}
