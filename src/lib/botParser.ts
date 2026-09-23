import { buildReport } from './reportExport';
import * as repo from './financeRepo';
import { parseWithAI } from './aiService';

export function parseAmount(amountStr: string | number): number | null {
  if (!amountStr) return null;
  let str = amountStr.toString().trim().toLowerCase();

  str = str.replace(/^rp\.?\s*/i, '');

  let multiplier = 1;
  if (str.endsWith('rb') || str.endsWith('k')) {
    multiplier = 1000;
    str = str.replace(/(rb|k)$/, '');
  } else if (str.endsWith('jt') || str.endsWith('juta')) {
    multiplier = 1000000;
    str = str.replace(/(jt|juta)$/, '');
  } else if (str.endsWith('m') && !str.endsWith('rb')) {
    multiplier = 1000000;
    str = str.replace(/m$/, '');
  }

  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',') && multiplier > 1) {
    str = str.replace(',', '.');
  } else if (str.includes('.') && multiplier > 1) {
    // Keep decimal
  } else if (str.includes('.') && !str.includes(',')) {
    str = str.replace(/\./g, '');
  }

  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * multiplier);
}

export async function handleMessage(rawMessage: string, senderMeta: { senderPhone?: string | null; senderName?: string | null; userId?: number | null; lang?: 'id' | 'en' } = {}) {
  const message = (rawMessage || '').trim();
  if (!message) return null;

  const userId = senderMeta.userId || null;
  const today = new Date().toISOString().split('T')[0];
  const summary = repo.getSummary({ user_id: userId });
  const categories = repo.getCategories();
  const budgets = repo.getBudgetsWithUsage({ user_id: userId });
  const todayTransactions = repo.getTransactions({ user_id: userId, startDate: today, endDate: today, limit: 15 }).items;
  const categoryBreakdown = repo.getCategoryBreakdown({ user_id: userId, type: 'expense' });

  const financialContext = {
    summary,
    categories,
    budgets,
    todayTransactions,
    categoryBreakdown
  };

  try {
    const aiResult = await parseWithAI(message, financialContext, senderMeta.lang);

    if (aiResult) {
      if (
        aiResult.intent === 'transaction' && 
        aiResult.transaction && 
        Number(aiResult.transaction.amount) > 0
      ) {
        const tx = aiResult.transaction;
        const saved = repo.addTransaction({
          user_id: userId,
          type: tx.type === 'income' ? 'income' : 'expense',
          amount: Number(tx.amount),
          category: tx.category || (tx.type === 'income' ? 'Pemasukan Lain' : 'Lain-lain'),
          description: tx.description || message,
          source: 'whatsapp_ai',
          sender_phone: senderMeta.senderPhone || null,
          sender_name: senderMeta.senderName || 'WA User'
        });

        return {
          type: 'transaction',
          data: saved,
          text: aiResult.reply || `✅ Berhasil mencatat ${saved.type === 'income' ? 'pemasukan' : 'pengeluaran'} sebesar ${repo.formatRupiah(saved.amount)} untuk "${saved.description}".`
        };
      }

      if (aiResult.intent === 'export') {
        const format = aiResult.export?.format === 'pdf' ? 'pdf' : 'xlsx';
        const file = await buildReport(userId, {
          format,
          lang: aiResult.export?.language === 'en' ? 'en' : 'id',
          startDate: aiResult.export?.startDate,
          endDate: aiResult.export?.endDate
        });
        return {
          type: 'file',
          file,
          text: aiResult.reply || `📎 ${format.toUpperCase()}`
        };
      }

      if (aiResult.reply) {
        return {
          type: aiResult.intent === 'query' ? 'query' : 'general',
          text: aiResult.reply
        };
      }
    }
  } catch (err: any) {
    console.error('Error during AI chat handling:', err.message);
  }

  // Fallback
  return {
    type: 'fallback',
    text: senderMeta.lang === 'en'
      ? `Hi! I'm ZxWallet AI. Send me an expense, income, or ask for your balance anytime!`
      : `Halo! Saya ZxWallet AI. Ketik pesan pengeluaran, pemasukan, atau tanya saldo kapan saja ya!`
  };
}
