import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsappInstance';
import { getUserFromRequest } from '@/lib/serverAuth';
import { ADMIN_PHONE } from '@/lib/authRepo';

export async function GET(req: Request) {
  try {
    const waService = getWhatsAppService();
    const status = waService.getStatus();
    // Anonymous callers (e.g. server/botRunner.js) only get the status string, never the QR.
    return NextResponse.json({
      success: true,
      data: getUserFromRequest(req) ? status : { status: status.status },
      allowedPhone: ADMIN_PHONE
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
