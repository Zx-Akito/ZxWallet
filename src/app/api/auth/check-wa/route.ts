import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/lib/whatsappInstance';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const waService = getWhatsAppService();
    const checkResult = await waService.checkWhatsAppNumber(phone);
    return NextResponse.json({ success: true, ...checkResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
