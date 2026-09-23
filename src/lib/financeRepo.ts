import db from './db';
import { Transaction, Category, Budget, Summary, CashflowTrend, CategoryBreakdown } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function predictCategory(text: string, type: 'income' | 'expense' = 'expense'): string {
  if (!text) {
    return type === 'income' ? 'Pemasukan Lain' : 'Lain-lain';
  }

  const cleanText = text.toLowerCase();
  const categories = db.prepare('SELECT name, keywords FROM categories WHERE type = ?').all(type) as any[];

  for (const cat of categories) {
    if (!cat.keywords) continue;
    const keywords = cat.keywords.split(',').map((k: string) => k.trim().toLowerCase());
    for (const kw of keywords) {
      if (kw && cleanText.includes(kw)) {
        return cat.name;
      }
    }
  }

  return type === 'income' ? 'Pemasukan Lain' : 'Lain-lain';
}

export function addTransaction({
  user_id = null,
  type,
  amount,
  category,
  description,
  source = 'whatsapp',
  sender_phone = null,
  sender_name = null,
  date = null
}: {
  user_id?: number | null;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  description?: string;
  source?: string;
  sender_phone?: string | null;
  sender_name?: string | null;
  date?: string | null;
}): Transaction {
  const finalDate = date || new Date().toISOString().split('T')[0];
  const finalCategory = category || predictCategory(description || '', type);

  let finalUserId = user_id;
  if (!finalUserId && sender_phone) {
    let clean = sender_phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (!clean.startsWith('62')) clean = '62' + clean;
    const user: any = db.prepare('SELECT id FROM users WHERE phone = ?').get(clean);
    if (user) finalUserId = user.id;
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (user_id, type, amount, category, description, source, sender_phone, sender_name, date)
    VALUES (@user_id, @type, @amount, @category, @description, @source, @sender_phone, @sender_name, @date)
  `);

  const info = stmt.run({
    user_id: finalUserId,
    type,
    amount: Number(amount),
    category: finalCategory,
    description: description || '',
    source,
    sender_phone,
    sender_name,
    date: finalDate
  });

  return getTransactionById(Number(info.lastInsertRowid))!;
}

export function getTransactionById(id: number): Transaction | null {
  return (db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction) || null;
}

export function updateTransaction(id: number, { user_id, type, amount, category, description, date }: any): Transaction | null {
  let query = `
    UPDATE transactions
    SET type = COALESCE(@type, type),
        amount = COALESCE(@amount, amount),
        category = COALESCE(@category, category),
        description = COALESCE(@description, description),
        date = COALESCE(@date, date)
    WHERE id = @id
  `;
  if (user_id) {
    query += ' AND user_id = @user_id';
  }
  const stmt = db.prepare(query);
  stmt.run({ id, user_id, type, amount, category, description, date });
  return getTransactionById(id);
}

export function deleteTransaction(id: number, user_id: number | null = null): boolean {
  let query = 'DELETE FROM transactions WHERE id = ?';
  if (user_id) {
    query += ` AND user_id = ${Number(user_id)}`;
  }
  const stmt = db.prepare(query);
  return stmt.run(id).changes > 0;
}

export function getTransactions({
  user_id = null,
  limit = 50,
  offset = 0,
  type,
  category,
  startDate,
  endDate,
  search
}: {
  user_id?: number | null;
  limit?: number;
  offset?: number;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
} = {}): { items: Transaction[]; total: number } {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any = {};

  if (user_id) {
    query += ' AND user_id = @user_id';
    params.user_id = Number(user_id);
  } else {
    query += ' AND user_id IS NULL';
  }

  if (type && (type === 'income' || type === 'expense')) {
    query += ' AND type = @type';
    params.type = type;
  }

  if (category) {
    query += ' AND category = @category';
    params.category = category;
  }

  if (startDate) {
    query += ' AND date >= @startDate';
    params.startDate = startDate;
  }

  if (endDate) {
    query += ' AND date <= @endDate';
    params.endDate = endDate;
  }

  if (search) {
    query += ' AND (description LIKE @search OR category LIKE @search)';
    params.search = `%${search}%`;
  }

  query += ' ORDER BY date DESC, id DESC LIMIT @limit OFFSET @offset';
  params.limit = Number(limit);
  params.offset = Number(offset);

  const items = db.prepare(query).all(params) as Transaction[];

  let countQuery = 'SELECT count(*) as total FROM transactions WHERE 1=1';
  if (user_id) {
    countQuery += ` AND user_id = ${Number(user_id)}`;
  } else {
    countQuery += ' AND user_id IS NULL';
  }
  if (type) countQuery += ` AND type = '${type}'`;
  if (category) countQuery += ` AND category = '${category.replace(/'/g, "''")}'`;
  if (startDate) countQuery += ` AND date >= '${startDate}'`;
  if (endDate) countQuery += ` AND date <= '${endDate}'`;
  if (search) countQuery += ` AND (description LIKE '%${search.replace(/'/g, "''")}%' OR category LIKE '%${search.replace(/'/g, "''")}%')`;

  const total = (db.prepare(countQuery).get() as any).total;

  return { items, total };
}

export function getSummary({ user_id = null, month, year }: { user_id?: number | null; month?: string; year?: number } = {}): Summary {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${targetYear}-${targetMonth}`;

  const userClause = user_id ? ` AND user_id = ${Number(user_id)}` : ` AND user_id IS NULL`;

  const allTime: any = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
    FROM transactions
    WHERE 1=1 ${userClause}
  `).get();

  const totalBalance = (allTime.totalIncome || 0) - (allTime.totalExpense || 0);

  const monthFigures: any = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthlyIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthlyExpense,
      COUNT(*) as transactionCount
    FROM transactions
    WHERE date LIKE ? ${userClause}
  `).get(`${monthPrefix}%`);

  const monthlyIncome = monthFigures.monthlyIncome || 0;
  const monthlyExpense = monthFigures.monthlyExpense || 0;
  const monthlyNet = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

  const todayDate = now.toISOString().split('T')[0];
  const todayFigures: any = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as todayIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as todayExpense
    FROM transactions
    WHERE date = ? ${userClause}
  `).get(todayDate);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
    savingsRate,
    transactionCount: monthFigures.transactionCount || 0,
    todayIncome: todayFigures.todayIncome || 0,
    todayExpense: todayFigures.todayExpense || 0,
    month: targetMonth,
    year: targetYear
  };
}

export function getCategoryBreakdown({ user_id = null, type = 'expense', month, year }: { user_id?: number | null; type?: string; month?: string; year?: number } = {}): CategoryBreakdown[] {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${targetYear}-${targetMonth}`;

  const userClause = user_id ? ` AND t.user_id = ${Number(user_id)}` : ` AND t.user_id IS NULL`;

  const rows = db.prepare(`
    SELECT t.category, SUM(t.amount) as total, c.color, c.icon
    FROM transactions t
    LEFT JOIN categories c ON t.category = c.name
    WHERE t.type = ? AND t.date LIKE ? ${userClause}
    GROUP BY t.category
    ORDER BY total DESC
  `).all(type, `${monthPrefix}%`) as CategoryBreakdown[];

  return rows;
}

export function getCashflowTrends(user_id: number | null = null, days: number = 14): CashflowTrend[] {
  const result: CashflowTrend[] = [];
  const today = new Date();

  const userClause = user_id ? ` AND user_id = ${Number(user_id)}` : ` AND user_id IS NULL`;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const stats: any = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date = ? ${userClause}
    `).get(dateStr);

    result.push({
      date: dateStr,
      displayDate,
      income: stats.income || 0,
      expense: stats.expense || 0,
      net: (stats.income || 0) - (stats.expense || 0)
    });
  }

  return result;
}

export function getBudgetsWithUsage({ user_id = null, month, year }: { user_id?: number | null; month?: string; year?: number } = {}): Budget[] {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${targetYear}-${targetMonth}`;

  const bUserClause = user_id ? ` AND b.user_id = ${Number(user_id)}` : ` AND b.user_id IS NULL`;
  const tUserClause = user_id ? ` AND t.user_id = ${Number(user_id)}` : ` AND t.user_id IS NULL`;

  const budgets: any[] = db.prepare(`
    SELECT b.id, b.category, b.monthly_limit, c.color, c.icon,
      COALESCE(SUM(t.amount), 0) as spent
    FROM budgets b
    LEFT JOIN categories c ON b.category = c.name
    LEFT JOIN transactions t ON t.category = b.category AND t.type = 'expense' AND t.date LIKE ? ${tUserClause}
    WHERE 1=1 ${bUserClause}
    GROUP BY b.category
    ORDER BY spent DESC
  `).all(`${monthPrefix}%`);

  return budgets.map(b => ({
    ...b,
    percentage: b.monthly_limit > 0 ? Math.min(100, Math.round((b.spent / b.monthly_limit) * 100)) : 0,
    remaining: Math.max(0, b.monthly_limit - b.spent),
    isOverBudget: b.spent > b.monthly_limit
  }));
}

export function setBudget(category: string, monthly_limit: number, user_id: number | null = null): Budget[] {
  let existing: any = null;
  if (user_id) {
    existing = db.prepare('SELECT id FROM budgets WHERE category = ? AND user_id = ?').get(category, user_id);
  } else {
    existing = db.prepare('SELECT id FROM budgets WHERE category = ? AND user_id IS NULL').get(category);
  }

  if (existing) {
    db.prepare('UPDATE budgets SET monthly_limit = ? WHERE id = ?').run(Number(monthly_limit), existing.id);
  } else {
    db.prepare(`
      INSERT INTO budgets (user_id, category, monthly_limit)
      VALUES (?, ?, ?)
    `).run(user_id, category, Number(monthly_limit));
  }

  return getBudgetsWithUsage({ user_id });
}

export function deleteBudget(id: number, user_id: number | null = null): boolean {
  let query = 'DELETE FROM budgets WHERE id = ?';
  if (user_id) {
    query += ` AND user_id = ${Number(user_id)}`;
  }
  return db.prepare(query).run(id).changes > 0;
}

export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY type, name').all() as Category[];
}

export function logChat({ sender, message, response, status = 'success' }: { sender: string; message: string; response: string; status?: string }) {
  const stmt = db.prepare(`
    INSERT INTO chat_logs (sender, message, response, status)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(sender, message, response, status);
}

export function getRecentChats(limit: number = 30): any[] {
  return db.prepare('SELECT * FROM chat_logs ORDER BY id DESC LIMIT ?').all(limit);
}

// Conversation memory for the AI, keyed by user id (or phone when there is no user).
export function getAiHistory(key: string, limit: number): { role: 'user' | 'assistant'; content: string }[] {
  const rows = db.prepare('SELECT role, content FROM ai_history WHERE history_key = ? ORDER BY id DESC LIMIT ?').all(key, limit) as any[];
  return rows.reverse();
}

export function clearAiHistory(key: string) {
  return db.prepare('DELETE FROM ai_history WHERE history_key = ?').run(key);
}

export const addAiTurn = db.transaction((key: string, userMsg: string, assistantMsg: string, keep: number) => {
  const insert = db.prepare('INSERT INTO ai_history (history_key, role, content) VALUES (?, ?, ?)');
  insert.run(key, 'user', userMsg);
  insert.run(key, 'assistant', assistantMsg);
  db.prepare(`
    DELETE FROM ai_history WHERE history_key = ? AND id NOT IN (
      SELECT id FROM ai_history WHERE history_key = ? ORDER BY id DESC LIMIT ?
    )
  `).run(key, key, keep);
});
