'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Wallet, 
  ChatCircleDots, 
  Plus, 
  ArrowsClockwise, 
  User,
  Receipt,
  ChartLineUp,
  Target,
  CaretDown,
  SignOut,
  Translate
} from '@phosphor-icons/react';
import { User as UserType } from '../types';
import { useT } from '../lib/i18n';
import LangToggle from './LangToggle';

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
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside tap or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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
              <p className="text-[11px] text-zinc-400 hidden sm:block">{t('Pengatur Keuangan Otomatis', 'Automated Finance Manager')}</p>
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
              <span>{t('Transaksi', 'Transactions')}</span>
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
              <span>{t('Grafik & Analisis', 'Charts & Insights')}</span>
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
              <span>{t('Batas Anggaran', 'Budgets')}</span>
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
              title={t('Segarkan data', 'Refresh data')}
            >
              <ArrowsClockwise
                size={15}
                className={loading ? 'animate-spin text-emerald-400' : ''}
              />
            </button>

            {/* Account menu: language setting + sign out */}
            {currentUser ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-200 transition cursor-pointer"
                >
                  <User size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <CaretDown size={11} className={`text-zinc-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-zinc-800 bg-[#0c0d11] shadow-2xl p-1 z-50 text-xs animate-pop-in origin-top-right"
                  >
                    <div className="px-2.5 py-2 border-b border-zinc-800/80 mb-1">
                      <div className="font-semibold text-zinc-100 truncate">{currentUser.name}</div>
                      {currentUser.phone && (
                        <div className="text-[11px] text-zinc-500 font-mono truncate">+{currentUser.phone}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between px-2.5 py-2 text-zinc-300">
                      <span className="flex items-center space-x-2">
                        <Translate size={14} className="text-zinc-400" />
                        <span>{t('Bahasa', 'Language')}</span>
                      </span>
                      <LangToggle />
                    </div>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <SignOut size={14} />
                      <span>{t('Keluar', 'Sign out')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              >
                <User size={14} />
                <span>{t('Masuk / Daftar', 'Sign in / Sign up')}</span>
              </button>
            )}

            {/* Desktop Quick Add Button (Mobile uses BottomNav center button) */}
            <button
              onClick={onOpenAdd}
              className="hidden sm:flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span>{t('Catat Uang', 'Add Entry')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
