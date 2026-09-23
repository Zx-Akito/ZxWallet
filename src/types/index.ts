export interface User {
  id: number;
  name: string;
  phone: string;
  is_verified?: number;
  created_at?: string;
}

export interface Transaction {
  id: number;
  user_id?: number | null;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  source: string;
  sender_phone?: string | null;
  sender_name?: string | null;
  date: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  keywords?: string;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  color?: string;
  icon?: string;
}

export interface Summary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  savingsRate: number;
  transactionCount: number;
  todayIncome: number;
  todayExpense: number;
  month: string;
  year: number;
}

export interface CashflowTrend {
  date: string;
  displayDate: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  color?: string;
  icon?: string;
}

export interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qr: string | null;
  user: {
    id?: string;
    name?: string;
    phone?: string;
  } | null;
}
