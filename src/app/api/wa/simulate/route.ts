import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import { handleMessage } from '@/lib/botParser';
import * as repo from '@/lib/financeRepo';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const body = await req.json();
    const { message, senderName = 'Simulated User' } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const senderPhone = user?.phone || '628123456789';
    const sName = user?.name || senderName;

    const response = await handleMessage(message, {
      senderPhone,
      senderName: sName,
      userId: user?.id
    });

    repo.logChat({
      sender: `${sName} (Simulator)`,
      message,
      response: response?.text || '',
      status: 'simulated'
    });

    // Simulator can't receive a WA document; hand the file back as a data URL for download.
    if (response && 'file' in response && response.file) {
      const { buffer, fileName, mimetype } = response.file;
      return NextResponse.json({
        success: true,
        result: {
          ...response,
          file: { fileName, url: `data:${mimetype};base64,${buffer.toString('base64')}` }
        }
      });
    }

    return NextResponse.json({ success: true, result: response });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
