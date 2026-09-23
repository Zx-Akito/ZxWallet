'use client';

import React, { useState } from 'react';
import { 
  X, 
  DeviceMobile, 
  User, 
  CheckCircle, 
  WarningCircle, 
  ShieldCheck,
  PaperPlaneTilt,
  Lock
} from '@phosphor-icons/react';
import axios from 'axios';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: UserType) => void;
  dismissible?: boolean;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, dismissible = true }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setDebugOtp('');
    setStep(1);
    setOtp('');
    setPassword('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg('Nomor WhatsApp wajib diisi');
      return;
    }
    if (mode === 'register' && !name) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axios.post('/api/auth/send-otp', {
        phone,
        isRegister: mode === 'register'
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        if (res.data.debugOtp) {
          setDebugOtp(res.data.debugOtp);
        }
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Gagal mengirim kode OTP WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !password) {
      setErrorMsg('Kode OTP dan password wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/auth/register', {
        name,
        phone,
        otp,
        password
      });

      if (res.data?.success) {
        localStorage.setItem('zxwallet_token', res.data.token);
        localStorage.setItem('zxwallet_user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg('Nomor WhatsApp dan password wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/auth/login', {
        phone,
        password
      });

      if (res.data?.success) {
        localStorage.setItem('zxwallet_token', res.data.token);
        localStorage.setItem('zxwallet_user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        if (onAuthSuccess) onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Nomor WhatsApp atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)'
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-pop-in">
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck size={16} weight="fill" />
            <span>AKUN PERSONAL ZXWALLET</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
            {mode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login'
              ? 'Kelola buku kas pribadi Anda secara terisolasi dan aman.'
              : 'Verifikasi kepemilikan nomor WhatsApp aktif untuk membuat akun.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetForm();
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              resetForm();
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-3.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2">
            <WarningCircle size={16} weight="fill" className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle size={16} weight="fill" className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {debugOtp && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] font-mono">
            💡 Kode OTP Pengujian: <b className="text-white text-xs">{debugOtp}</b>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs text-zinc-300 mb-1 font-medium">Nomor WhatsApp</label>
              <div className="relative">
                <DeviceMobile size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1 font-medium">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Buku Kas'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <div>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">Nama Lengkap</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">
                    Nomor WhatsApp (Harus Aktif)
                  </label>
                  <div className="relative">
                    <DeviceMobile size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Sistem akan memverifikasi nomor ini aktif di WhatsApp dan mengirimkan kode OTP.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 flex items-center justify-center space-x-1.5"
                >
                  <PaperPlaneTilt size={14} weight="bold" />
                  <span>{loading ? 'Memeriksa WhatsApp...' : 'Kirim Kode OTP ke WhatsApp'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                  <span>Nomor WA: <b className="text-white font-mono">{phone}</b></span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-emerald-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Ubah
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">
                    Kode OTP WhatsApp (6 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Masukkan 6 angka OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono tracking-widest text-center text-emerald-400 placeholder:text-zinc-600 focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">Buat Password Akun</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40"
                >
                  {loading ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran Akun'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
