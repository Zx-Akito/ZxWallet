'use client';

import React, { useState, useEffect } from 'react';
import { DownloadSimple, X } from '@phosphor-icons/react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('zxwallet_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('zxwallet_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 max-w-sm z-50 bg-zinc-900 border border-zinc-750 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center space-x-3 min-w-0">
        <img
          src="/pwa-192x192.png"
          alt="ZxWallet"
          className="w-10 h-10 rounded-xl shrink-0 border border-zinc-800"
        />
        <div className="min-w-0">
          <div className="font-semibold text-xs text-zinc-100 truncate">Pasang ZxWallet</div>
          <p className="text-[11px] text-zinc-400 truncate">Tambahkan ke Layar Utama HP</p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm shadow-emerald-900/40"
        >
          <DownloadSimple size={13} weight="bold" />
          <span>Pasang</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          title="Tutup"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
