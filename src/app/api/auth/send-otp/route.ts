import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsappInstance';
import * as authRepo from '@/lib/authRepo';

export async function POST(req: Request) {
  try {
    const { phone, isRegister = true } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const cleanPhone = authRepo.normalizePhone(phone);
    const existing = authRepo.findUserByPhone(cleanPhone);
    if (isRegister && existing) {
      return NextResponse.json({
        success: false,
        error: 'Nomor WhatsApp ini sudah terdaftar. Silakan login langsung.'
      }, { status: 400 });
    }

    const waService = getWhatsAppService();
    const waCheck = await waService.checkWhatsAppNumber(cleanPhone);
    if (!waCheck.exists) {
      return NextResponse.json({
        success: false,
        error: 'Nomor ini tidak terdaftar di WhatsApp. Pastikan nomor aktif di WhatsApp.'
      }, { status: 400 });
    }

    const code = authRepo.createOtp(cleanPhone);
    const waMsg = `🔐 *KODE VERIFIKASI ZXWALLET*\n\nKode OTP pendaftaran Anda: *${code}*\n\nKode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun untuk keamanan akun Anda.`;
    const sendResult = await waService.sendMessageToPhone(cleanPhone, waMsg);

    return NextResponse.json({
      success: true,
      message: sendResult.sent 
        ? 'Kode OTP telah dikirimkan ke WhatsApp Anda.' 
        : 'Kode OTP dibuat (gateway WhatsApp sedang offline).',
      phone: cleanPhone,
      sentViaWa: sendResult.sent,
      debugOtp: !sendResult.sent ? code : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
