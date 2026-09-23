'use client';

import React, { useState } from 'react';
import { X, Plus } from '@phosphor-icons/react';
import CustomDropdown from './CustomDropdown';
import { Category } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (data: any) => void;
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  categories = [], 
  onSave 
}: AddTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !type) return;

    onSave({
      type,
      amount: Number(amount),
      category: category || (type === 'income' ? 'Pemasukan Lain' : 'Lain-lain'),
      description,
      date
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3.5 sm:p-4 animate-fade-in"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)'
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative animate-pop-in">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center space-x-2.5 sm:space-x-3 mb-4 sm:mb-5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0">
            <Plus size={16} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Catat Transaksi Baru</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400">Pemasukan atau pengeluaran kas manual</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
          {/* Segmented Type Toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">Kategori</label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(val)}
              placeholder="Otomatis Deteksi Kategori"
              className="w-full"
              options={[
                { value: '', label: 'Otomatis Deteksi Kategori' },
                ...filteredCategories.map((c) => ({
                  value: c.name,
                  label: c.name,
                  color: c.color
                }))
              ]}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">Keterangan</label>
            <input
              type="text"
              placeholder="Contoh: Bensin motor pertamax"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:border-emerald-500/50"
            />
          </div>

          <div className="flex space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
