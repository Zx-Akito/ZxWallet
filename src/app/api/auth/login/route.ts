import { NextResponse } from 'next/server';
import * as authRepo from '@/lib/authRepo';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Nomor WhatsApp dan password wajib diisi.'
      }, { status: 400 });
    }

    const cleanPhone = authRepo.normalizePhone(phone);
    const user = authRepo.findUserByPhone(cleanPhone);

    if (!user || !authRepo.verifyPassword(user, password)) {
      return NextResponse.json({
        success: false,
        error: 'Nomor WhatsApp atau password salah.'
      }, { status: 401 });
    }

    const token = authRepo.generateToken(user);
    const userProfile = authRepo.findUserById(user.id);

    return NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user: userProfile,
      token
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
