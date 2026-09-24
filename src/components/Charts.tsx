'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartLineUp, ChartPieSlice } from '@phosphor-icons/react';
import { formatIDR } from '../utils/formatters';
import { CashflowTrend, CategoryBreakdown } from '../types';
import { useT } from '../lib/i18n';

const PALETTE = [
  '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#64748b', '#ec4899', '#f97316'
];

interface ChartsProps {
  cashflow: CashflowTrend[];
  categoryBreakdown: CategoryBreakdown[];
}

export default function Charts({ cashflow = [], categoryBreakdown: rawBreakdown = [] }: ChartsProps) {
  const t = useT();
  const shortDate = (d: string) =>
    new Date(d).toLocaleDateString(t.lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
  const categoryBreakdown = rawBreakdown.map((c) => ({ ...c, category: t.cat(c.category) }));
  const CustomCashflowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload[0]?.value || 0;
      const exp = payload[1]?.value || 0;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-2.5 sm:p-3 rounded-xl shadow-xl text-xs font-mono">
          <p className="font-semibold text-zinc-200 mb-1.5">{shortDate(label)}</p>
          <div className="space-y-1">
            <p className="text-green-400">{t('Masuk', 'In')}: {formatIDR(inc)}</p>
            <p className="text-rose-400">{t('Keluar', 'Out')}: {formatIDR(exp)}</p>
            <p className="text-zinc-300 pt-1 border-t border-zinc-800">
              {t('Sisa Kas', 'Net')}: {formatIDR(inc - exp)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Cashflow Trend */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ChartLineUp size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-100">{t('Grafik Arus Kas Harian', 'Daily Cash Flow')}</h3>
              <p className="text-[11px] text-zinc-400">{t('Pemasukan vs Pengeluaran 14 hari terakhir', 'Income vs expenses, last 14 days')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs self-start sm:self-auto">
            <span className="flex items-center text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> {t('Pemasukan', 'Income')}
            </span>
            <span className="flex items-center text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span> {t('Pengeluaran', 'Expenses')}
            </span>
          </div>
        </div>

        <div className="h-52 sm:h-64 w-full">
          {cashflow.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
              {t('Belum ada data arus kas', 'No cash flow data yet')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow} margin={{ top: 8, right: 4, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date"
                  tickFormatter={shortDate} 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => (v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<CustomCashflowTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeFill)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Donut Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ChartPieSlice size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-100">{t('Porsi Pengeluaran', 'Spending Share')}</h3>
              <p className="text-[11px] text-zinc-400">{t('Pembagian belanja bulan ini', 'How you spent this month')}</p>
            </div>
          </div>

          <div className="h-48 sm:h-56 w-full relative my-auto">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                {t('Belum ada data belanja bulan ini', 'No spending data this month')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || PALETTE[index % PALETTE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatIDR(value), 'Total']}
                    contentStyle={{
                      backgroundColor: 'var(--color-zinc-900)',
                      borderColor: 'var(--color-zinc-700)',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 mb-2.5">{t('Rincian Pos Belanja', 'Spending Breakdown')}</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">{t('Belum ada catatan', 'No records yet')}</p>
            ) : (
              categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate mr-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.color || PALETTE[idx % PALETTE.length] }} 
                    />
                    <span className="font-medium text-zinc-200 truncate">{cat.category}</span>
                  </div>
                  <span className="font-semibold text-zinc-100 shrink-0 font-mono">{formatIDR(cat.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
