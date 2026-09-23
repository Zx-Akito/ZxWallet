import { NextResponse } from 'next/server';
import * as authRepo from './authRepo';

export function getUserFromRequest(req: Request): { id: number; phone: string; name: string } | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = authRepo.verifyToken(token);
    if (decoded) {
      return decoded;
    }
  }
  return null;
}

export const unauthorized = () =>
  NextResponse.json({ success: false, error: 'Belum login' }, { status: 401 });
