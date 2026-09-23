import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/serverAuth';
import * as authRepo from '@/lib/authRepo';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Belum login' }, { status: 401 });
    }
    const userProfile = authRepo.findUserById(user.id);
    return NextResponse.json({ success: true, user: userProfile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
