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
import { useT } from '../lib/i18n';
import LangToggle from './LangToggle';

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
  const t = useT();

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
      setErrorMsg(t('Nomor WhatsApp wajib diisi', 'WhatsApp number is required'));
      return;
    }
    if (mode === 'register' && !name) {
      setErrorMsg(t('Nama lengkap wajib diisi', 'Full name is required'));
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
      setErrorMsg(err.response?.data?.error || t('Gagal mengirim kode OTP WhatsApp', 'Failed to send WhatsApp OTP code'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !password) {
      setErrorMsg(t('Kode OTP dan password wajib diisi', 'OTP code and password are required'));
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
      setErrorMsg(err.response?.data?.error || t('Pendaftaran gagal', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg(t('Nomor WhatsApp dan password wajib diisi', 'WhatsApp number and password are required'));
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
      setErrorMsg(err.response?.data?.error || t('Nomor WhatsApp atau password salah', 'Wrong WhatsApp number or password'));
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck size={16} weight="fill" />
              <span>{t('AKUN PERSONAL ZXWALLET', 'ZXWALLET PERSONAL ACCOUNT')}</span>
            </div>
            {!dismissible && <LangToggle />}
          </div>
          <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
            {mode === 'login' ? t('Masuk ke Akun Anda', 'Sign in to Your Account') : t('Daftar Akun Baru', 'Create a New Account')}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login'
              ? t('Kelola buku kas pribadi Anda secara terisolasi dan aman.', 'Manage your personal cash book privately and securely.')
              : t('Verifikasi kepemilikan nomor WhatsApp aktif untuk membuat akun.', 'Verify an active WhatsApp number you own to create an account.')}
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
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('Masuk (Login)', 'Sign in')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              resetForm();
            }}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('Daftar Akun', 'Sign up')}
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
            💡 {t('Kode OTP Pengujian', 'Test OTP code')}: <b className="text-zinc-50 text-xs">{debugOtp}</b>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs text-zinc-300 mb-1 font-medium">{t('Nomor WhatsApp', 'WhatsApp Number')}</label>
              <div className="relative">
                <DeviceMobile size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder={t('Contoh: 08123456789 atau 628123456789', 'e.g. 08123456789 or 628123456789')}
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
                  placeholder={t('Masukkan password Anda', 'Enter your password')}
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
              {loading ? t('Memverifikasi...', 'Verifying...') : t('Masuk ke Buku Kas', 'Sign in')}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <div>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">{t('Nama Lengkap', 'Full Name')}</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder={t('Nama Anda', 'Your name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">
                    {t('Nomor WhatsApp (Harus Aktif)', 'WhatsApp Number (Must Be Active)')}
                  </label>
                  <div className="relative">
                    <DeviceMobile size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder={t('Contoh: 081234567890', 'e.g. 081234567890')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {t('Sistem akan memverifikasi nomor ini aktif di WhatsApp dan mengirimkan kode OTP.', 'We will check that this number is active on WhatsApp and send an OTP code.')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer shadow-sm shadow-emerald-900/40 flex items-center justify-center space-x-1.5"
                >
                  <PaperPlaneTilt size={14} weight="bold" />
                  <span>{loading ? t('Memeriksa WhatsApp...', 'Checking WhatsApp...') : t('Kirim Kode OTP ke WhatsApp', 'Send OTP Code to WhatsApp')}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                  <span>{t('Nomor WA', 'WA Number')}: <b className="text-zinc-50 font-mono">{phone}</b></span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-emerald-400 hover:underline text-[11px] cursor-pointer"
                  >
                    {t('Ubah', 'Change')}
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">
                    {t('Kode OTP WhatsApp (6 Digit)', 'WhatsApp OTP Code (6 Digits)')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder={t('Masukkan 6 angka OTP', 'Enter the 6-digit OTP')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono tracking-widest text-center text-emerald-400 placeholder:text-zinc-600 focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1 font-medium">{t('Buat Password Akun', 'Create Account Password')}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder={t('Minimal 6 karakter', 'At least 6 characters')}
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
                  {loading ? t('Mendaftarkan...', 'Registering...') : t('Selesaikan Pendaftaran Akun', 'Complete Registration')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
