'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatTeardropDots, 
  X, 
  PaperPlaneTilt, 
  Sparkle, 
  Robot,
  Minus,
  FileArrowDown
} from '@phosphor-icons/react';
import axios from 'axios';

const EXAMPLE_PROMPTS = [
  'keluar 25rb makan bakso',
  'beli kopi susu 18k',
  'bayar token pln 150rb',
  'bensin 40k pertamax',
  'masuk 5jt gaji bulanan',
  'saldo',
  'rekap',
  'budget',
  'kirim excel semua transaksi',
  'rekap bulan ini pdf'
];

interface FloatingChatSimulatorProps {
  isOpen: boolean;
  onToggle: () => void;
  onActionSuccess: () => void;
}

export default function FloatingChatSimulator({ 
  isOpen, 
  onToggle, 
  onActionSuccess 
}: FloatingChatSimulatorProps) {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; file?: { fileName: string; url: string } }[]>([
    {
      sender: 'bot',
      text: 'Halo! Saya bot ZxWallet.\n\nKamu bisa mengetik pengeluaran atau pemasukan langsung di sini, atau klik salah satu contoh di bawah.'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await axios.post('/api/wa/simulate', {
        message: text,
        senderName: 'Pengguna'
      });

      if (res.data?.result?.text) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: res.data.result.text, file: res.data.result.file }
        ]);
        if (onActionSuccess) onActionSuccess();
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Gagal memproses simulasi chat.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Action Button (FAB) - Icon Only */}
      <div 
        className="fixed md:bottom-6 right-3 sm:right-6 z-50 flex items-center"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={onToggle}
          className={`group flex items-center justify-center w-12 h-12 rounded-full shadow-2xl transition-all duration-300 ease-(--ease-fluid) hover:scale-105 active:scale-90 cursor-pointer ${
            isOpen
              ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 hover:shadow-emerald-900/70 border border-emerald-400/30'
          }`}
          title={isOpen ? 'Tutup Simulator Chat' : 'Simulator Chat Bot WhatsApp'}
          aria-label={isOpen ? 'Tutup Simulator Chat' : 'Simulator Chat Bot WhatsApp'}
        >
          {isOpen ? (
            <X size={20} weight="bold" className="animate-pop-in" />
          ) : (
            <div className="relative flex items-center justify-center animate-pop-in">
              <ChatTeardropDots size={24} weight="fill" />
              {/* Online ping dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. Floating Chat Window */}
      {isOpen && (
        <div 
          className="fixed md:bottom-20 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[520px] max-h-[calc(100dvh-10rem)] z-50 flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden font-sans animate-slide-up origin-bottom-right"
          style={{ bottom: 'calc(8.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Robot size={18} weight="fill" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center space-x-1.5">
                  <span>ZxWallet</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">AI Pencatat Keuangan</p>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              title="Tutup"
            >
              <Minus size={16} weight="bold" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-[#0a0c10] text-xs">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex animate-bubble-in ${isUser ? 'justify-end origin-bottom-right' : 'justify-start origin-bottom-left'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed shadow-xs text-xs ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                    {m.file && (
                      <a
                        href={m.file.url}
                        download={m.file.fileName}
                        className="mt-2 flex items-center space-x-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-emerald-400 transition"
                      >
                        <FileArrowDown size={16} weight="fill" className="shrink-0" />
                        <span className="truncate font-medium">{m.file.fileName}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start animate-bubble-in origin-bottom-left">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 animate-pulse">
                  Bot sedang mencatat...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-zinc-950/60 border-t border-zinc-800/60 flex items-center space-x-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-zinc-500 text-[10px] shrink-0 flex items-center mr-0.5">
              <Sparkle size={11} className="mr-1 text-amber-400" /> Coba:
            </span>
            {EXAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 shrink-0 border border-zinc-800 hover:border-zinc-700 transition duration-200 active:scale-95 disabled:opacity-50 cursor-pointer text-[11px] whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-zinc-800/80 bg-zinc-950 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ketik pesan... misal: keluar 35rb soto"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition duration-200 active:scale-90 cursor-pointer shrink-0"
              title="Kirim pesan"
            >
              <PaperPlaneTilt size={15} weight="bold" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
