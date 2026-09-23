'use client';

import React from 'react';
import { useLangStore } from '../lib/i18n';

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLangStore();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold shrink-0 ${className}`}
    >
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-1.5 py-1 rounded-md uppercase transition cursor-pointer ${
            lang === l ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
