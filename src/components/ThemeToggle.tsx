'use client';

import React, { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<Theme>('dark');

  // The pre-paint script in layout.tsx already set the class; just sync state.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.className = next;
    try {
      localStorage.setItem('zxwallet_theme', next);
    } catch {}
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold shrink-0"
    >
      {(['dark', 'light'] as const).map((m) => (
        <button
          key={m}
          onClick={() => apply(m)}
          aria-pressed={theme === m}
          className={`px-1.5 py-1 rounded-md transition cursor-pointer ${
            theme === m ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {m === 'dark' ? t('Gelap', 'Dark') : t('Terang', 'Light')}
        </button>
      ))}
    </div>
  );
}
