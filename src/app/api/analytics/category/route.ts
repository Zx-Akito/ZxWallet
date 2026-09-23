import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import * as repo from '@/lib/financeRepo';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'expense';
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    const data = repo.getCategoryBreakdown({ user_id: user?.id, type, month, year });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
