'use client';

import React from 'react';
import { 
  MagnifyingGlass, 
  Trash, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DeviceMobile, 
  Globe, 
  CaretLeft, 
  CaretRight 
} from '@phosphor-icons/react';
import { formatIDR, formatDate } from '../utils/formatters';
import CustomDropdown from './CustomDropdown';
import { Transaction, Category } from '../types';
import { useT } from '../lib/i18n';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  filters: {
    type?: string;
    category?: string;
    search?: string;
    page?: number;
  };
  onFilterChange: (filters: any) => void;
  categories: Category[];
  onDelete: (id: number) => void;
}

export default function TransactionTable({
  transactions = [],
  total = 0,
  page = 1,
  limit = 10,
  onPageChange,
  filters,
  onFilterChange,
  categories = [],
  onDelete
}: TransactionTableProps) {
  const t = useT();
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 relative">
      {/* Controls: Filters & Search */}
      <div className="p-3 sm:p-4 border-b border-zinc-800/80 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 relative z-20">
        {/* Type Toggle Pills */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-center">
          <button
            onClick={() => onFilterChange({ ...filters, type: '', page: 1 })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              !filters.type ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('Semua', 'All')} ({total})
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, type: 'income', page: 1 })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filters.type === 'income' ? 'bg-green-950/60 text-green-400 border border-green-800/40' : 'text-zinc-400 hover:text-green-400'
            }`}
          >
            {t('Pemasukan', 'Income')}
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, type: 'expense', page: 1 })}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filters.type === 'expense' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            {t('Pengeluaran', 'Expenses')}
          </button>
        </div>

        {/* Filter Category & Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CustomDropdown
            value={filters.category || ''}
            onChange={(val) => onFilterChange({ ...filters, category: val, page: 1 })}
            placeholder={t('Semua Kategori', 'All Categories')}
            className="w-36 sm:w-44 shrink-0"
            options={[
              { value: '', label: t('Semua Kategori', 'All Categories') },
              ...categories.map((c) => ({
                value: c.name,
                label: t.cat(c.name),
                color: c.color
              }))
            ]}
          />

          <div className="relative flex-1 sm:w-56">
            <MagnifyingGlass size={14} className="absolute left-3 top-2.5 sm:top-2 text-zinc-500" />
            <input
              type="text"
              placeholder={t('Cari transaksi...', 'Search transactions...')}
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-zinc-800/60">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            {t('Belum ada data transaksi yang sesuai.', 'No matching transactions.')}
          </div>
        ) : (
          transactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-3 sm:p-4 flex items-center justify-between hover:bg-zinc-800/20 transition gap-2"
              >
                {/* Left: Icon, Category, Description */}
                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft size={15} weight="bold" />
                    ) : (
                      <ArrowUpRight size={15} weight="bold" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-zinc-200 truncate">
                        {t.cat(tx.category)}
                      </span>
                      {tx.source === 'whatsapp' || tx.source === 'whatsapp_ai' ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[9px] sm:text-[10px]">
                          <DeviceMobile size={10} />
                          <span>WA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 text-[9px] sm:text-[10px]">
                          <Globe size={10} />
                          <span>Manual</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {tx.description || t('Tidak ada catatan', 'No note')} &bull; <span className="text-zinc-500">{formatDate(tx.date, t.lang)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Delete Button */}
                <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 pl-1">
                  <div className="text-right">
                    <div
                      className={`font-bold text-xs sm:text-sm sm:text-base whitespace-nowrap font-mono ${
                        isIncome ? 'text-green-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-500 hidden sm:block">
                      {isIncome ? t('Pemasukan', 'Income') : t('Pengeluaran', 'Expense')}
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    title={t('Hapus transaksi', 'Delete transaction')}
                  >
                    <Trash size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div>
            {t('Hal', 'Page')} {page} / {totalPages}
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
