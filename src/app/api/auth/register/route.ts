import { NextResponse } from 'next/server';
import * as authRepo from '@/lib/authRepo';

export async function POST(req: Request) {
  try {
    const { name, phone, otp, password } = await req.json();
    if (!name || !phone || !otp || !password) {
      return NextResponse.json({
        success: false,
        error: 'Nama, nomor WhatsApp, kode OTP, dan password wajib diisi.'
      }, { status: 400 });
    }

    const cleanPhone = authRepo.normalizePhone(phone);
    const isValidOtp = authRepo.verifyOtp(cleanPhone, otp);
    if (!isValidOtp) {
      return NextResponse.json({
        success: false,
        error: 'Kode OTP salah atau telah kadaluarsa.'
      }, { status: 400 });
    }

    const existing = authRepo.findUserByPhone(cleanPhone);
    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Nomor WhatsApp sudah terdaftar. Silakan login.'
      }, { status: 400 });
    }

    const user = authRepo.createUser({ name, phone: cleanPhone, password });
    const token = authRepo.generateToken(user);

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil!',
      user,
      token
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
