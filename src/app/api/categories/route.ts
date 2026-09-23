import { NextResponse } from 'next/server';
import * as repo from '@/lib/financeRepo';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';

export async function GET(req: Request) {
  try {
    if (!getUserFromRequest(req)) return unauthorized();
    const categories = repo.getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
