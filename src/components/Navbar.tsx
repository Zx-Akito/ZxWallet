'use client';

import React from 'react';
import { 
  Wallet, 
  ChatCircleDots, 
  Plus, 
  ArrowsClockwise, 
  User,
  Receipt,
  ChartLineUp,
  Target
} from '@phosphor-icons/react';
import { User as UserType } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdd: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAdd, 
  onRefresh, 
  loading 
}: NavbarProps) {
  return (
    <header 
      className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800/80"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet size={18} weight="duotone" className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight">ZxWallet</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-400 font-medium border border-emerald-800/40">
                  WA Bot
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Pengatur Keuangan Otomatis</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Icons */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Receipt size={14} weight={activeTab === 'overview' ? 'fill' : 'regular'} />
              <span>Transaksi</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ChartLineUp size={14} weight={activeTab === 'analytics' ? 'bold' : 'regular'} />
              <span>Grafik & Analisis</span>
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Target size={14} weight={activeTab === 'budget' ? 'fill' : 'regular'} />
              <span>Batas Anggaran</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ChatCircleDots size={14} weight={activeTab === 'whatsapp' ? 'fill' : 'regular'} />
              <span>WhatsApp & Bot</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition cursor-pointer shrink-0"
              title="Segarkan data"
            >
              <ArrowsClockwise
                size={15}
                className={loading ? 'animate-spin text-emerald-400' : ''}
              />
            </button>

            {/* User Account Button: 1 kotak [ 👤 ZxAkito ] langsung logout saat diklik */}
            {currentUser ? (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-200 transition cursor-pointer"
                title={currentUser.name}
              >
                <User size={14} className="text-emerald-400 shrink-0" />
                <span className="font-medium truncate max-w-[120px]">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              >
                <User size={14} />
                <span>Masuk / Daftar</span>
              </button>
            )}

            {/* Desktop Quick Add Button (Mobile uses BottomNav center button) */}
            <button
              onClick={onOpenAdd}
              className="hidden sm:flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span>Catat Uang</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
