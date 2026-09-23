'use client';

import React, { useEffect } from 'react';
import { 
  ArrowsClockwise, 
  Brain
} from '@phosphor-icons/react';
import axios from 'axios';
import { create } from 'zustand';

interface Recommendation {
  title: string;
  advice: string;
  priority: 'high' | 'medium' | 'low';
}

interface FinancialAdvice {
  healthScore: number;
  healthStatus: string;
  summary: string;
  recommendations: Recommendation[];
}

// Cache advice across tab switches; cleared on login/logout via resetAdvice().
export const useAdviceStore = create<{
  advice: FinancialAdvice | null;
  loading: boolean;
  fetchAdvice: () => Promise<void>;
}>((set, get) => ({
  advice: null,
  loading: false,
  fetchAdvice: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await axios.get('/api/ai/advice');
      if (res.data?.success) {
        set({ advice: res.data.data });
      }
    } catch (e) {
      console.error('Failed to load AI advice:', e);
    } finally {
      set({ loading: false });
    }
  }
}));

export const resetAdvice = () => useAdviceStore.setState({ advice: null });

export default function AiFinancialInsights() {
  const { advice, loading, fetchAdvice } = useAdviceStore();

  useEffect(() => {
    if (!useAdviceStore.getState().advice) fetchAdvice();
  }, [fetchAdvice]);

  if (!advice && !loading) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-900/60 p-4 sm:p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Brain size={18} weight="fill" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-100">
                Analisis Finansial Cerdas AI
              </h3>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase">
                Gemini
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Evaluasi kesehatan kas dan rekomendasi otomatis</p>
          </div>
        </div>

        <button
          onClick={fetchAdvice}
          disabled={loading}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition cursor-pointer shrink-0"
          title="Analisis ulang dengan AI"
        >
          <ArrowsClockwise size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
        </button>
      </div>

      {loading && !advice ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400">Gemini sedang menganalisis transaksi kas Anda...</p>
        </div>
      ) : advice ? (
        <div className="space-y-3">
          {/* Health Score Banner */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-400">Skor Kesehatan Kas:</span>
                <span className="font-bold text-sm text-emerald-400 font-mono">
                  {advice.healthScore} / 100
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-medium border border-emerald-800/50">
                  {advice.healthStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{advice.summary}</p>
            </div>
          </div>

          {/* Recommendations List */}
          {advice.recommendations && advice.recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {advice.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-zinc-200 truncate">{rec.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase shrink-0 ${
                        rec.priority === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          : rec.priority === 'medium'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {rec.priority === 'high' ? 'Penting' : 'Saran'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{rec.advice}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
