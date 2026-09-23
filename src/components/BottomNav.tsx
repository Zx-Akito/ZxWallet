'use client';

import React from 'react';
import { 
  Receipt, 
  ChartLineUp, 
  Plus, 
  Target, 
  ChatCircleDots 
} from '@phosphor-icons/react';
import { WhatsAppStatus } from '../types';
import { useT } from '../lib/i18n';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdd: () => void;
  waStatus: WhatsAppStatus | null;
}

export default function BottomNav({ activeTab, setActiveTab, onOpenAdd, waStatus }: BottomNavProps) {
  const t = useT();
  const isConnected = waStatus?.status === 'connected';
  const isQR = waStatus?.status === 'qr_ready';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950 border-t border-zinc-800/80 md:hidden touch-manipulation pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 px-3">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Transaksi */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            activeTab === 'overview' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt size={20} weight={activeTab === 'overview' ? 'fill' : 'regular'} />
          <span className="text-[10px] mt-1 font-medium">{t('Transaksi', 'Transactions')}</span>
        </button>

        {/* 2. Grafik & Analisis */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            activeTab === 'analytics' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ChartLineUp size={20} weight={activeTab === 'analytics' ? 'bold' : 'regular'} />
          <span className="text-[10px] mt-1 font-medium">{t('Grafik', 'Charts')}</span>
        </button>

        {/* 3. Center Raised (+) Catat Button */}
        <div className="flex items-center justify-center px-2">
          <button
            onClick={onOpenAdd}
            className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition cursor-pointer -mt-4 border-2 border-zinc-950"
            title={t('Catat Transaksi Cepat', 'Quick Add Transaction')}
          >
            <Plus size={22} weight="bold" />
          </button>
        </div>

        {/* 4. Anggaran */}
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            activeTab === 'budget' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Target size={20} weight={activeTab === 'budget' ? 'fill' : 'regular'} />
          <span className="text-[10px] mt-1 font-medium">{t('Anggaran', 'Budgets')}</span>
        </button>

        {/* 5. WhatsApp Bot */}
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
            activeTab === 'whatsapp' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <ChatCircleDots size={20} weight={activeTab === 'whatsapp' ? 'fill' : 'regular'} />
            {/* Status badge dot */}
            <span
              className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ring-2 ring-zinc-950 ${
                isConnected
                  ? 'bg-emerald-400'
                  : isQR
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-600'
              }`}
            />
          </div>
          <span className="text-[10px] mt-1 font-medium">Bot WA</span>
        </button>
      </div>
    </nav>
  );
}
