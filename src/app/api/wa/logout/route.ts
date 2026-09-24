import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsappInstance';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import { ADMIN_PHONE } from '@/lib/authRepo';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!ADMIN_PHONE || user.phone !== ADMIN_PHONE) {
      return NextResponse.json({
        success: false,
        error: 'Akses ditolak: Gateway WhatsApp hanya untuk akun admin'
      }, { status: 403 });
    }

    const waService = getWhatsAppService();
    await waService.logout();
    return NextResponse.json({ success: true, message: 'WhatsApp session logged out' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
