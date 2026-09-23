'use client';

import React, { useState } from 'react';
import { 
  DeviceMobile, 
  ArrowsClockwise, 
  CheckCircle, 
  Power, 
  ChatCircleDots,
  ShieldCheck,
  Brain,
  ChatCircleText,
  Calculator,
  TrendUp,
  Sparkle
} from '@phosphor-icons/react';
import { confirmDialog } from './ConfirmDialog';
import { useT } from '../lib/i18n';
import axios from 'axios';
import { WhatsAppStatus, User } from '../types';

interface WhatsAppSectionProps {
  waStatus: WhatsAppStatus | null;
  onRefreshStatus: () => void;
  onOpenSimulator: () => void;
  currentUser: User | null;
}

export default function WhatsAppSection({ 
  waStatus, 
  onRefreshStatus, 
  onOpenSimulator, 
  currentUser 
}: WhatsAppSectionProps) {
  const t = useT();
  const [loadingQR, setLoadingQR] = useState(false);

  const isOwner = currentUser?.phone === '62895400233001';
  const isConnected = waStatus?.status === 'connected';
  const isQR = waStatus?.status === 'qr_ready';

  const handleRestart = async () => {
    setLoadingQR(true);
    try {
      await axios.post('/api/wa/restart');
      if (onRefreshStatus) onRefreshStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleLogout = async () => {
    if (!(await confirmDialog(t('Apakah kamu ingin memutuskan sambungan WhatsApp?', 'Disconnect WhatsApp?')))) return;
    try {
      await axios.post('/api/wa/logout');
      if (onRefreshStatus) onRefreshStatus();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
      {/* 1. WhatsApp Connection Card (5 cols) */}
      <div className="md:col-span-5 space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <DeviceMobile size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{t('Koneksi WhatsApp HP', 'WhatsApp Connection')}</h3>
              <p className="text-[11px] sm:text-xs text-zinc-400">{t('Hubungkan bot ke nomor WhatsApp pribadi Anda', 'Link the bot to your personal WhatsApp number')}</p>
            </div>
          </div>

          {!isOwner ? (
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                <DeviceMobile size={20} />
              </div>
              <div>
                <div className="font-semibold text-xs text-zinc-200">{t('Koneksi WhatsApp Eksklusif', 'Exclusive WhatsApp Connection')}</div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {t.lang === 'en' ? (
<>This bot's WhatsApp connection is dedicated to the number <b>0895400233001</b>.</>
) : (
<>Koneksi WhatsApp bot ini didedikasikan untuk nomor pengguna <b>0895400233001</b>.</>
)}
                </p>
              </div>
              <p className="text-[11px] text-zinc-500">
                {t.lang === 'en' ? (
<>You can still record transactions and chat with the AI using the <b>Chat Simulator</b>.</>
) : (
<>Akun Anda tetap dapat mencatat transaksi kas dan berkonsultasi dengan AI melalui <b>Simulator Chat</b> di samping.</>
)}
              </p>
            </div>
          ) : isConnected ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle size={24} weight="fill" />
              </div>
              <div>
                <div className="font-semibold text-sm text-emerald-300">{t('WhatsApp Aktif Terhubung', 'WhatsApp Connected')}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {t('Nomor', 'Number')}: <span className="font-mono text-zinc-200">{waStatus?.user?.phone || t('Aktif', 'Active')}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('Bot aktif! Kirim pesan apa saja dengan bahasa sehari-hari untuk mengelola keuangan Anda.', 'The bot is live! Send any message in everyday language to manage your finances.')}
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href={`https://wa.me/${waStatus?.user?.phone || '6281916633003'}?text=Halo%20ZxWallet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40"
                >
                  <ChatCircleDots size={14} weight="fill" />
                  <span>{t('Chat di WhatsApp', 'Chat on WhatsApp')}</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/40 transition cursor-pointer"
                >
                  <Power size={13} weight="bold" />
                  <span>{t('Putuskan', 'Disconnect')}</span>
                </button>
              </div>
            </div>
          ) : isQR && waStatus?.qr ? (
            <div className="text-center space-y-3">
              <div className="p-2.5 sm:p-3 bg-zinc-200 rounded-xl inline-block shadow-md mx-auto max-w-[230px] sm:max-w-none">
                <img src={waStatus.qr} alt={t('Scan QR WhatsApp', 'Scan WhatsApp QR')} className="w-48 h-48 sm:w-52 sm:h-52 rounded" />
              </div>
              <div className="text-xs text-left bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-1 text-zinc-400">
                <p className="font-semibold text-zinc-200">{t('Cara menyambungkan:', 'How to connect:')}</p>
                <p>{t('1. Buka WhatsApp di smartphone Anda.', '1. Open WhatsApp on your phone.')}</p>
                <p>{t.lang === 'en' ? (
<>2. Tap the three-dot menu or <b>Settings</b>.</>
) : (
<>2. Tekan menu titik tiga atau <b>Pengaturan</b>.</>
)}</p>
                <p>{t.lang === 'en' ? (
<>3. Choose <b>Linked devices</b> &gt; <b>Link a device</b>.</>
) : (
<>3. Pilih <b>Perangkat Tertaut</b> &gt; <b>Tautkan Perangkat</b>.</>
)}</p>
                <p>{t('4. Arahkan kamera ke barcode di atas.', '4. Point your camera at the QR code above.')}</p>
              </div>
              <button
                onClick={handleRestart}
                disabled={loadingQR}
                className="w-full py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ArrowsClockwise size={13} className={loadingQR ? 'animate-spin' : ''} />
                <span>{t('Segarkan Barcode QR', 'Refresh QR Code')}</span>
              </button>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-zinc-400">{t('Menyiapkan koneksi WhatsApp...', 'Preparing WhatsApp connection...')}</p>
              <button
                onClick={handleRestart}
                className="px-3 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                {t('Coba Lagi', 'Try Again')}
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Multi-Device Protocol</span>
            </span>
            <span className="font-mono">Baileys Engine</span>
          </div>
        </div>
      </div>

      {/* 2. AI Intelligence Overview (7 cols) */}
      <div className="md:col-span-7 space-y-4">
        {/* Simulator Launcher Banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-zinc-900/60 to-zinc-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <Sparkle size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">{t('Simulator Chat Melayang', 'Floating Chat Simulator')}</span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-100">{t('Coba Obrolan Langsung dengan AI', 'Chat with the AI Right Now')}</h4>
            <p className="text-xs text-zinc-400">
              {t('Gunakan tombol melayang di sudut kanan bawah layar untuk mencoba percakapan bebas tanpa perlu scan QR terlebih dahulu.', 'Use the floating button in the bottom-right corner to try a conversation without scanning a QR code first.')}
            </p>
          </div>

          <button
            onClick={onOpenSimulator}
            className="self-start sm:self-auto shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40"
          >
            <ChatCircleDots size={16} weight="fill" />
            <span>{t('Buka Simulator', 'Open Simulator')}</span>
          </button>
        </div>

        {/* AI Capabilities Card (No rigid formats required) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
            <Brain size={17} weight="fill" className="text-emerald-400" />
            <span>{t('Didukung AI Natural Language (Bebas Format)', 'Natural Language AI (Any Format)')}</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('Bot ZxWallet ditenagai oleh kecerdasan buatan Gemini via OmniRoute. Anda tidak perlu mengingat format perintah kaku atau sintaks tertentu. Cukup ketik seperti sedang mengirim pesan biasa ke teman:', 'The ZxWallet bot is powered by Gemini AI via OmniRoute. No fixed commands or syntax to remember. Just type like you are messaging a friend:')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-emerald-400">
                <ChatCircleText size={15} />
                <span>{t('Bahasa Sehari-hari', 'Everyday Language')}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t.lang === 'en' ? (
<>Type casually, for example: <em>&quot;bought snacks 10k and orange juice 5k&quot;</em> or <em>&quot;got 1.5m from a freelance job&quot;</em>.</>
) : (
<>Ketik secara bebas dan santai, misalnya: <em>&quot;tadi jajan cilok 10rb sama es jeruk 5k&quot;</em> atau <em>&quot;dapet honor freelance 1.5jt&quot;</em>.</>
)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-sky-400">
                <Calculator size={15} />
                <span>{t('Kalkulasi Otomatis', 'Automatic Math')}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t('AI dapat menjumlahkan beberapa pengeluaran sekaligus dan otomatis mengelompokkannya ke kategori pos belanja yang paling sesuai.', 'The AI adds up several expenses at once and files them under the best-fitting category.')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-amber-400">
                <TrendUp size={15} />
                <span>{t('Tanya Saldo & Laporan', 'Balance & Reports')}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t.lang === 'en' ? (
<>Just ask things like <em>&quot;what's my balance?&quot;</em>, <em>&quot;recap this month's spending&quot;</em>, or <em>&quot;what did I buy today?&quot;</em>.</>
) : (
<>Cukup tanyakan apa pun seperti <em>&quot;saldo saya berapa?&quot;</em>, <em>&quot;rekap pengeluaran bulan ini&quot;</em>, atau <em>&quot;tadi belanja apa aja?&quot;</em>.</>
)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-violet-400">
                <Brain size={15} />
                <span>{t('Konsultasi Finansial', 'Financial Advice')}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t.lang === 'en' ? (
<>Ask for advice anytime, for example: <em>&quot;am I overspending on food?&quot;</em> or <em>&quot;give me saving tips for this month&quot;</em>.</>
) : (
<>Minta saran keuangan kapan saja, misalnya: <em>&quot;apakah pengeluaran makanan saya boros?&quot;</em> atau <em>&quot;kasih tips nabung bulan ini&quot;</em>.</>
)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
