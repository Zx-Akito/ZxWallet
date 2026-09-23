'use client';

import React from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank 
} from '@phosphor-icons/react';
import { formatIDR } from '../utils/formatters';
import { Summary } from '../types';
import { useT } from '../lib/i18n';

interface StatCardsProps {
  summary: Summary | null;
}

export default function StatCards({ summary }: StatCardsProps) {
  const t = useT();
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* 1. Total Saldo */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4.5 hover:border-zinc-700/70 transition flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
          <span className="truncate pr-1">{t('Total Saldo', 'Total Balance')}</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet size={14} className="sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-2.5">
          <div className="text-base sm:text-2xl font-bold text-zinc-100 tracking-tight truncate font-mono">
            {formatIDR(summary.totalBalance)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-zinc-400 truncate">
            {summary.totalBalance >= 0 ? t('Surplus kas aman', 'Healthy surplus') : t('Defisit kas', 'Cash deficit')}
          </p>
        </div>
      </div>

      {/* 2. Pemasukan */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4.5 hover:border-zinc-700/70 transition flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
          <span className="truncate pr-1">{t('Pemasukan', 'Income')}</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={14} className="sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-2.5">
          <div className="text-base sm:text-2xl font-bold text-green-400 tracking-tight truncate font-mono">
            +{formatIDR(summary.monthlyIncome)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-zinc-400 truncate">
            {t('Hari ini', 'Today')}: +{formatIDR(summary.todayIncome)}
          </p>
        </div>
      </div>

      {/* 3. Pengeluaran */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4.5 hover:border-zinc-700/70 transition flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
          <span className="truncate pr-1">{t('Pengeluaran', 'Expenses')}</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-2.5">
          <div className="text-base sm:text-2xl font-bold text-rose-400 tracking-tight truncate font-mono">
            -{formatIDR(summary.monthlyExpense)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-zinc-400 truncate">
            {t('Hari ini', 'Today')}: -{formatIDR(summary.todayExpense)}
          </p>
        </div>
      </div>

      {/* 4. Sisa Bersih / Tabungan */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4.5 hover:border-zinc-700/70 transition flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
          <span className="truncate pr-1">{t('Sisa Uang', 'Net Left')}</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
            <PiggyBank size={14} className="sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-2.5">
          <div className="text-base sm:text-2xl font-bold text-zinc-100 tracking-tight truncate font-mono">
            {formatIDR(summary.monthlyNet)}
          </div>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-zinc-400 truncate">
            {t('Tabungan', 'Savings')}: <span className="text-emerald-400 font-semibold">{summary.savingsRate}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
