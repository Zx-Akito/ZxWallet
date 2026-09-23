import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsappInstance';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    if (user.phone !== '62895400233001') {
      return NextResponse.json({
        success: false,
        error: 'Akses ditolak: Gateway WhatsApp hanya untuk akun 0895400233001'
      }, { status: 403 });
    }

    const waService = getWhatsAppService();
    await waService.restart();
    return NextResponse.json({ success: true, message: 'WhatsApp service restarted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
