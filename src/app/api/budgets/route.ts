import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import * as repo from '@/lib/financeRepo';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    const data = repo.getBudgetsWithUsage({ user_id: user?.id, month, year });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const body = await req.json();
    const { category, monthly_limit } = body;

    if (!category || monthly_limit === undefined) {
      return NextResponse.json({ success: false, error: 'Kategori dan limit wajib diisi' }, { status: 400 });
    }

    const updated = repo.setBudget(category, monthly_limit, user?.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
