'use client';

import React, { useState } from 'react';
import { Target, Plus, Trash, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { formatIDR } from '../utils/formatters';
import CustomDropdown from './CustomDropdown';
import { Budget, Category } from '../types';
import { useT } from '../lib/i18n';

interface BudgetCardsProps {
  budgets: Budget[];
  categories: Category[];
  onSaveBudget: (category: string, limit: number) => void;
  onDeleteBudget?: (id: number) => void;
}

export default function BudgetCards({ 
  budgets = [], 
  categories = [], 
  onSaveBudget, 
  onDeleteBudget 
}: BudgetCardsProps) {
  const t = useT();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !limitInput) return;
    onSaveBudget(selectedCat, Number(limitInput));
    setSelectedCat('');
    setLimitInput('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3.5 sm:p-4.5 rounded-2xl">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Target size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-100">{t('Batas Anggaran Bulanan', 'Monthly Budgets')}</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400">{t('Atur kuota belanja per kategori agar tidak boros', 'Set a spending limit per category to avoid overspending')}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer self-start sm:self-auto shadow-sm shadow-emerald-900/30"
        >
          <Plus size={14} weight="bold" />
          <span>{t('Tambah Anggaran', 'Add Budget')}</span>
        </button>
      </div>

      {/* Cards */}
      {budgets.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          {t('Belum ada batas anggaran. Klik tombol "Tambah Anggaran" di atas untuk membatasi pengeluaran bulanan.', 'No budgets yet. Click "Add Budget" above to limit your monthly spending.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {budgets.map((b) => {
            const isDanger = b.percentage >= 100;
            const isWarning = b.percentage >= 80 && !isDanger;

            return (
              <div
                key={b.id || b.category}
                className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                  isDanger
                    ? 'border-rose-800/60 bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-800/60 bg-amber-950/20'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-zinc-200 truncate">{t.cat(b.category)}</span>
                  <div className="flex items-center space-x-2">
                    {isDanger ? (
                      <span className="text-[11px] text-rose-400 font-semibold bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <WarningCircle size={13} weight="fill" />
                        <span>{t('Melebihi', 'Over')}</span>
                      </span>
                    ) : isWarning ? (
                      <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                        {t('Hampir Habis', 'Almost Used')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle size={13} weight="fill" />
                        <span>{t('Aman', 'On Track')}</span>
                      </span>
                    )}

                    {onDeleteBudget && (
                      <button
                        onClick={() => onDeleteBudget(b.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer transition"
                        title={t('Hapus Anggaran', 'Delete Budget')}
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden my-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span>{t('Terpakai', 'Spent')}: <b className="text-zinc-200">{formatIDR(b.spent)}</b></span>
                  <span>{t('Batas', 'Limit')}: <b className="text-zinc-200">{formatIDR(b.monthly_limit)}</b></span>
                </div>

                <div className="text-xs text-zinc-400 mt-1.5 text-right font-mono">
                  {t('Sisa Kuota', 'Remaining')}: <span className={`font-semibold ${b.remaining === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatIDR(b.remaining)}</span> ({b.percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Budget */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-pop-in">
            <h3 className="text-base font-semibold text-zinc-100 mb-1">{t('Tambah Batas Anggaran', 'Add Budget Limit')}</h3>
            <p className="text-xs text-zinc-400 mb-4">{t('Pilih kategori pos belanja dan kuota bulanan maksimal.', 'Choose a spending category and its maximum monthly amount.')}</p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">{t('Kategori Pengeluaran / Pos Belanja', 'Spending Category')}</label>
                <CustomDropdown
                  value={selectedCat}
                  onChange={(val) => setSelectedCat(val)}
                  placeholder={t('Pilih Kategori', 'Choose Category')}
                  className="w-full"
                  options={categories.map((c) => ({
                    value: c.name,
                    label: `${t.cat(c.name)} (${c.type === 'income' ? t('Pemasukan', 'Income') : t('Pengeluaran', 'Expense')})`,
                    color: c.color
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">{t('Batas Maksimal Bulanan', 'Maximum Monthly Limit')} (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder={t('Contoh: 1500000', 'e.g. 1500000')}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                >
                  {t('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm shadow-emerald-900/40"
                >
                  {t('Simpan Anggaran', 'Save Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
