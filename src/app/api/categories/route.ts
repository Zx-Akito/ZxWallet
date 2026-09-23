import { NextResponse } from 'next/server';
import * as repo from '@/lib/financeRepo';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const categories = repo.getCategories(user.id);
    return NextResponse.json({ success: true, data: categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
