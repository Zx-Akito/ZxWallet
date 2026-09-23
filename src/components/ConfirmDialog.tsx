'use client';

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { useT } from '../lib/i18n';

const useConfirmStore = create<{
  message: string | null;
  resolve: ((ok: boolean) => void) | null;
}>(() => ({ message: null, resolve: null }));

// Drop-in replacement for window.confirm: `if (!(await confirmDialog('...'))) return;`
export const confirmDialog = (message: string) =>
  new Promise<boolean>((resolve) => useConfirmStore.setState({ message, resolve }));

export default function ConfirmDialog() {
  const { message, resolve } = useConfirmStore();
  const t = useT();

  const close = (ok: boolean) => {
    resolve?.(ok);
    useConfirmStore.setState({ message: null, resolve: null });
  };

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      onClick={() => close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-msg"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-zinc-100 mb-1">{t('Konfirmasi', 'Confirm')}</h3>
        <p id="confirm-dialog-msg" className="text-sm text-zinc-400 mb-5">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 rounded-xl text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition duration-200 active:scale-95 cursor-pointer"
          >
            {t('Batal', 'Cancel')}
          </button>
          <button
            autoFocus
            onClick={() => close(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition duration-200 active:scale-95 cursor-pointer"
          >
            {t('Ya, lanjutkan', 'Yes, continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
