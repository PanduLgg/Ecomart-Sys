import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Lock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { CashierArea, ActiveShiftSession } from '../types.ts';

interface StaffPortalLoginViewProps {
  businessDate: string;
  dailyShiftCodes: {
    date: string;
    insideCode: string;
    outsideCode: string;
  };
  activeShifts: {
    inside: ActiveShiftSession | null;
    outside: ActiveShiftSession | null;
  };
  initialTab?: 'kasir' | 'admin';
  onBackToCatalog: () => void;
  onLoginCashier: (
    area: CashierArea,
    cashierName: string,
    accessCode: string
  ) => { success: boolean; error?: string };
  onLoginAdmin: (
    adminName: string,
    password: string
  ) => { success: boolean; error?: string };
}

export const StaffPortalLoginView: React.FC<StaffPortalLoginViewProps> = ({
  businessDate,
  dailyShiftCodes,
  activeShifts,
  onBackToCatalog,
  onLoginCashier,
  onLoginAdmin,
}) => {
  const [userName, setUserName] = useState('Nadia Putri');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Real-time detection of intended access role based on code entered
  const normalizedCode = accessCode.trim().toUpperCase();
  const detectedRole =
    normalizedCode === 'ADMIN-ECO' ||
    normalizedCode === 'ADMIN123' ||
    normalizedCode.includes('ADMIN')
      ? { type: 'admin', label: 'Admin Koperasi', color: 'text-slate-800 bg-slate-100 border-slate-300' }
      : normalizedCode === dailyShiftCodes.insideCode.toUpperCase() || normalizedCode.startsWith('DLM-')
      ? { type: 'kasir-dalam', label: 'Kasir Area Dalam (Utama)', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' }
      : normalizedCode === dailyShiftCodes.outsideCode.toUpperCase() || normalizedCode.startsWith('LUR-')
      ? { type: 'kasir-luar', label: 'Kasir Area Luar (Bazar)', color: 'text-blue-800 bg-blue-50 border-blue-200' }
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = accessCode.trim();
    const cleanName = userName.trim();

    if (!cleanName) {
      setErrorMsg('Nama petugas wajib diisi untuk verifikasi pertanggungjawaban.');
      return;
    }

    if (!cleanCode) {
      setErrorMsg('Masukkan kode akses shift harian kasir atau sandi admin.');
      return;
    }

    const upperCode = cleanCode.toUpperCase();

    // 1. Admin Authentication
    if (upperCode === 'ADMIN-ECO' || upperCode === 'ADMIN123' || upperCode === 'ADMIN') {
      const res = onLoginAdmin(cleanName, cleanCode);
      if (!res.success) {
        setErrorMsg(res.error ?? 'Kode otorisasi admin tidak sesuai.');
      }
      return;
    }

    // 2. Kasir Area Dalam Authentication
    if (upperCode === dailyShiftCodes.insideCode.toUpperCase() || upperCode.startsWith('DLM-')) {
      const res = onLoginCashier('Kasir Area Dalam', cleanName, cleanCode);
      if (!res.success) {
        setErrorMsg(res.error ?? 'Kode shift Kasir Area Dalam tidak sesuai.');
      }
      return;
    }

    // 3. Kasir Area Luar Authentication
    if (upperCode === dailyShiftCodes.outsideCode.toUpperCase() || upperCode.startsWith('LUR-')) {
      const res = onLoginCashier('Kasir Area Luar', cleanName, cleanCode);
      if (!res.success) {
        setErrorMsg(res.error ?? 'Kode shift Kasir Area Luar tidak sesuai.');
      }
      return;
    }

    // Unrecognized code fallback
    setErrorMsg(
      `Kode '${cleanCode}' tidak cocok. Gunakan kode shift kasir hari ini (${dailyShiftCodes.insideCode} / ${dailyShiftCodes.outsideCode}) atau kode admin (ADMIN-ECO).`
    );
  };

  const handleQuickFill = (name: string, code: string) => {
    setErrorMsg(null);
    setUserName(name);
    setAccessCode(code);
  };

  return (
    <div className="min-h-[82vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        {/* Navigation Return */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Toko</span>
          </button>

          <span className="font-mono text-xs text-slate-500">
            Buku: <strong className="text-slate-800">{businessDate}</strong>
          </span>
        </div>

        {/* Centralized Clean Login Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-3 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Portal Staf EcoMart
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              Satu pintu masuk untuk Petugas Kasir (Area Dalam / Luar) dan Pengurus Admin Koperasi.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Input 1: Nama Lengkap */}
            <div>
              <label
                htmlFor="staff-name-input"
                className="block text-xs font-semibold text-slate-800 mb-1"
              >
                Nama Lengkap Petugas / Admin *
              </label>
              <input
                id="staff-name-input"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Contoh: Nadia Putri / Budi Santoso / Ibu Ratna"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* Input 2: Kode Akses */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="access-code-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Kode Akses Shift / Sandi Admin *
                </label>
                {detectedRole && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${detectedRole.color}`}
                  >
                    Terdeteksi: {detectedRole.label}
                  </span>
                )}
              </div>
              <input
                id="access-code-input"
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Masukkan DLM-..., LUR-..., atau ADMIN-ECO"
                className="w-full font-mono rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 uppercase tracking-wide focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            {/* Quick Demo Assist Pills */}
            <div className="pt-1">
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                Bantuan Cepat Kode Akses Hari Ini:
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 text-left">
                <button
                  type="button"
                  data-testid="btn-login-kasir-dalam"
                  onClick={() => handleQuickFill('Nadia Putri', dailyShiftCodes.insideCode)}
                  className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-[11px] text-slate-700 transition-colors text-left"
                >
                  <span className="font-semibold block text-slate-900">Kasir Dalam</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">
                    {dailyShiftCodes.insideCode}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="btn-login-kasir-luar"
                  onClick={() => handleQuickFill('Budi Santoso', dailyShiftCodes.outsideCode)}
                  className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-[11px] text-slate-700 transition-colors text-left"
                >
                  <span className="font-semibold block text-slate-900">Kasir Luar</span>
                  <span className="font-mono text-[10px] text-blue-700 font-bold">
                    {dailyShiftCodes.outsideCode}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="btn-login-admin"
                  onClick={() => handleQuickFill('Ibu Ratna (Admin Koperasi)', 'ADMIN-ECO')}
                  className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-[11px] text-slate-700 transition-colors text-left"
                >
                  <span className="font-semibold block text-slate-900">Admin</span>
                  <span className="font-mono text-[10px] text-purple-700 font-bold">
                    ADMIN-ECO
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              data-testid="btn-submit-login"
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              Masuk ke Sistem
            </button>
          </form>

          {/* Connected Shift Status Mini Summary */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span>Status Shift Kasir Dalam:</span>
              {activeShifts.inside ? (
                <span className="font-semibold text-emerald-700 truncate max-w-[150px]">
                  ● {activeShifts.inside.cashierName}
                </span>
              ) : (
                <span className="text-slate-400">Belum Ada Shift</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Status Shift Kasir Luar:</span>
              {activeShifts.outside ? (
                <span className="font-semibold text-blue-700 truncate max-w-[150px]">
                  ● {activeShifts.outside.cashierName}
                </span>
              ) : (
                <span className="text-slate-400">Belum Ada Shift</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
