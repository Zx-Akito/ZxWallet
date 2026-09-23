import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import * as repo from '@/lib/financeRepo';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const { searchParams } = new URL(req.url);

    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = repo.getTransactions({
      user_id: user?.id,
      limit,
      offset,
      type,
      category,
      startDate,
      endDate,
      search
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const body = await req.json();
    const { type, amount, category, description, date } = body;

    if (!type || !amount) {
      return NextResponse.json({ success: false, error: 'Type dan amount wajib diisi' }, { status: 400 });
    }

    const tx = repo.addTransaction({
      user_id: user?.id,
      type,
      amount,
      category,
      description,
      date,
      source: 'web_dashboard',
      sender_name: user?.name || 'User Dashboard'
    });

    return NextResponse.json({ success: true, data: tx }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
