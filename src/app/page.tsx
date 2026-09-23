'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PwaInstallPrompt from '../components/PwaInstallPrompt';
import FloatingChatSimulator from '../components/FloatingChatSimulator';
import AiFinancialInsights, { resetAdvice } from '../components/AiFinancialInsights';
import ConfirmDialog, { confirmDialog } from '../components/ConfirmDialog';
import StatCards from '../components/StatCard';
import Charts from '../components/Charts';
import BudgetCards from '../components/BudgetCards';
import TransactionTable from '../components/TransactionTable';
import WhatsAppSection from '../components/WhatsAppSection';
import AddTransactionModal from '../components/AddTransactionModal';
import AuthModal from '../components/AuthModal';
import { useT } from '../lib/i18n';
import { Check, ChatCircleDots } from '@phosphor-icons/react';
import { User, Transaction, Category, Budget, Summary, CashflowTrend, CategoryBreakdown, WhatsAppStatus } from '../types';

// Synchronously configure Authorization header before any API call fires
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('zxwallet_token');
  if (storedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }
}

export default function HomePage() {
  const t = useT();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // false until localStorage is read on the client; avoids SSR/client mismatch and a login-screen flash.
  const [authReady, setAuthReady] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics' | 'budget' | 'whatsapp'
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTx, setTotalTx] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ type?: string; category?: string; search?: string; page?: number }>({ type: '', category: '', search: '', page: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cashflow, setCashflow] = useState<CashflowTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>({ status: 'disconnected', qr: null, user: null });

  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const clearSession = () => {
    localStorage.removeItem('zxwallet_token');
    localStorage.removeItem('zxwallet_user');
    delete axios.defaults.headers.common['Authorization'];
    resetAdvice();
    setCurrentUser(null);
  };

  // Verify and sync user session
  useEffect(() => {
    // Any 401 (expired/invalid token) sends the user back to the login screen.
    const interceptor = axios.interceptors.response.use(undefined, (err) => {
      if (err.response?.status === 401) clearSession();
      return Promise.reject(err);
    });

    const token = localStorage.getItem('zxwallet_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const saved = localStorage.getItem('zxwallet_user');
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch {}
      axios.get('/api/auth/me').then(res => {
        if (res.data?.success && res.data.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('zxwallet_user', JSON.stringify(res.data.user));
        }
      }).catch(() => {});
    }
    setAuthReady(true);
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const handleAuthSuccess = (user: User) => {
    resetAdvice();
    setCurrentUser(user);
    showToast(t(`Selamat datang, ${user.name}!`, `Welcome, ${user.name}!`));
  };

  const handleLogout = () => {
    clearSession();
    showToast(t('Berhasil keluar akun.', 'Signed out.'));
  };

  useEffect(() => {
    const socket = io();

    socket.on('wa:status', (status: WhatsAppStatus) => {
      setWaStatus(status);
    });

    socket.on('transaction:added', (tx: Transaction) => {
      showToast(t(`Transaksi baru dicatat: ${tx.category} (Rp ${tx.amount.toLocaleString('id-ID')})`, `New transaction: ${t.cat(tx.category)} (Rp ${tx.amount.toLocaleString('id-ID')})`));
      fetchAllData();
    });

    socket.on('dashboard:refresh', (newSummary: Summary) => {
      if (newSummary) setSummary(newSummary);
      fetchAnalytics();
      fetchBudgets();
      fetchCategories();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/summary');
      if (res.data?.success) setSummary(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async (currFilters = filters) => {
    try {
      const params = {
        limit: 10,
        offset: ((currFilters.page || 1) - 1) * 10,
        type: currFilters.type || undefined,
        category: currFilters.category || undefined,
        search: currFilters.search || undefined
      };
      const res = await axios.get('/api/transactions', { params });
      if (res.data?.success) {
        setTransactions(res.data.items);
        setTotalTx(res.data.total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [cfRes, catRes] = await Promise.all([
        axios.get('/api/analytics/cashflow?days=14'),
        axios.get('/api/analytics/category?type=expense')
      ]);
      if (cfRes.data?.success) setCashflow(cfRes.data.data);
      if (catRes.data?.success) setCategoryBreakdown(catRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await axios.get('/api/budgets');
      if (res.data?.success) setBudgets(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data?.success) setCategories(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWAStatus = async () => {
    try {
      const res = await axios.get('/api/wa/status');
      if (res.data?.success) setWaStatus(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchTransactions(),
      fetchAnalytics(),
      fetchBudgets(),
      fetchCategories(),
      fetchWAStatus()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) fetchAllData();
  }, [currentUser]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(newFilters.page || 1);
    fetchTransactions(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    setPage(newPage);
    fetchTransactions(updated);
  };

  const handleSaveBudget = async (category: string, limit: number) => {
    try {
      await axios.post('/api/budgets', { category, monthly_limit: limit });
      fetchBudgets();
      fetchCategories();
      showToast(t('Batas anggaran disimpan.', 'Budget saved.'));
    } catch (e) {
      showToast(t('Gagal menyimpan anggaran.', 'Failed to save budget.'));
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!(await confirmDialog(t('Hapus batas anggaran ini?', 'Delete this budget?')))) return;
    try {
      await axios.delete(`/api/budgets/${id}`);
      fetchBudgets();
      showToast(t('Anggaran dihapus.', 'Budget deleted.'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTransaction = async (data: any) => {
    try {
      await axios.post('/api/transactions', data);
      fetchAllData();
      showToast(t('Transaksi baru berhasil dicatat.', 'Transaction recorded.'));
    } catch (e) {
      showToast(t('Gagal mencatat transaksi.', 'Failed to record transaction.'));
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!(await confirmDialog(t('Hapus transaksi ini?', 'Delete this transaction?')))) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      fetchAllData();
      showToast(t('Transaksi telah dihapus.', 'Transaction deleted.'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = t.lang;
  }, [t.lang]);

  if (!authReady) return <div className="min-h-[100dvh] bg-[#09090b]" />;

  if (!currentUser) {
    return (
      <AuthModal
        isOpen
        dismissible={false}
        onClose={() => {}}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  const botWhatsAppUrl = `https://wa.me/${waStatus?.user?.phone || '6281916633003'}?text=${encodeURIComponent(t('Halo ZxWallet, cek saldo', 'Hi ZxWallet, check my balance'))}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Toast Notification (Positioned Below Navbar) */}
      {toastMsg && (
        <div 
          className="fixed left-3 right-3 sm:left-auto sm:right-6 z-50 flex items-center space-x-2 bg-zinc-900/95 backdrop-blur border border-zinc-800 text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl animate-slide-down pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
        >
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdd={() => setIsAddOpen(true)}
        onRefresh={fetchAllData}
        loading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 1. Tab Overview (Dashboard & Transaksi) */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stat Cards */}
            <StatCards summary={summary} />

            {/* Quick Helper Banner */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-emerald-400 mr-1.5">ZxWallet AI:</span>
                {t.lang === 'en' ? (
                  <>Send any casual message like <em className="text-zinc-100">&quot;bought meatball soup 25k&quot;</em> or ask <em className="text-zinc-100">&quot;what's my balance?&quot;</em>, and the AI records it for you.</>
                ) : (
                  <>Kirim pesan dengan bahasa santai apa saja seperti <em className="text-zinc-100">&quot;tadi jajan bakso 25rb&quot;</em> atau tanya <em className="text-zinc-100">&quot;saldo saya berapa?&quot;</em>, AI akan mengelola dan mencatatnya otomatis.</>
                )}
              </div>
              <a
                href={botWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-auto shrink-0 flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                title={t('Buka Chat di Aplikasi WhatsApp', 'Open chat in the WhatsApp app')}
              >
                <ChatCircleDots size={15} weight="fill" />
                <span>{t('Buka Chat WhatsApp', 'Open WhatsApp Chat')} &rarr;</span>
              </a>
            </div>

            {/* Transactions List */}
            <TransactionTable
              transactions={transactions}
              total={totalTx}
              page={page}
              limit={10}
              onPageChange={handlePageChange}
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
              onDelete={handleDeleteTransaction}
            />
          </div>
        )}

        {/* 2. Tab Analytics (Grafik & Alokasi & AI Insights) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <StatCards summary={summary} />
            <AiFinancialInsights />
            <Charts cashflow={cashflow} categoryBreakdown={categoryBreakdown} />
          </div>
        )}

        {/* 3. Tab Budget (Batas Anggaran) */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <StatCards summary={summary} />
            <BudgetCards
              budgets={budgets}
              categories={categories}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          </div>
        )}

        {/* 4. Tab WhatsApp & Simulator */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <WhatsAppSection
              waStatus={waStatus}
              currentUser={currentUser}
              onRefreshStatus={fetchWAStatus}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Manual Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        categories={categories}
        onSave={handleSaveTransaction}
      />

      {/* User Login & Register with WhatsApp Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Floating Chat Simulator (Floating Action Button + Window) */}
      <FloatingChatSimulator
        isOpen={isSimulatorOpen}
        onToggle={() => setIsSimulatorOpen(!isSimulatorOpen)}
        onActionSuccess={fetchAllData}
      />

      <ConfirmDialog />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Mobile App Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdd={() => setIsAddOpen(true)}
        waStatus={waStatus}
      />

      {/* Footer */}
      <footer className="hidden md:block border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        ZxWallet &bull; {t('Bot WhatsApp Pengelola Keuangan Sederhana & Akurat', 'Simple & Accurate WhatsApp Finance Bot')} &copy; 2026.
      </footer>
    </div>
  );
}
