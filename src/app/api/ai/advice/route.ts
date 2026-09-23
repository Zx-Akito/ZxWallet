import { NextResponse } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/serverAuth';
import * as repo from '@/lib/financeRepo';
import { generateFinancialAdvice } from '@/lib/aiService';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return unauthorized();
    const summary = repo.getSummary({ user_id: user?.id });
    const categoryBreakdown = repo.getCategoryBreakdown({ user_id: user?.id, type: 'expense' });
    const budgets = repo.getBudgetsWithUsage({ user_id: user?.id });

    const advice = await generateFinancialAdvice(summary, categoryBreakdown, budgets);
    if (!advice) {
      return NextResponse.json({ success: false, error: 'Gagal menghasilkan analisis AI' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: advice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
