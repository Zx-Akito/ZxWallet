import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import * as repo from '@/lib/financeRepo';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days')) || 14;

    const data = repo.getCashflowTrends(user?.id, days);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
