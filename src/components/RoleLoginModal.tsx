import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import type { CashierArea } from '../types.ts';

interface RoleLoginModalProps {
  isOpen: boolean;
  initialTab?: 'kasir' | 'admin';
  businessDate: string;
  dailyShiftCodes: {
    date: string;
    insideCode: string;
    outsideCode: string;
  };
  onClose: () => void;
  onLoginCashier: (area: CashierArea, cashierName: string, accessCode: string) => {
    success: boolean;
    error?: string;
  };
  onLoginAdmin: (adminName: string, password: string) => {
    success: boolean;
    error?: string;
  };
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  initialTab = 'kasir',
  businessDate,
  dailyShiftCodes,
  onClose,
  onLoginCashier,
  onLoginAdmin,
}) => {
  const [tab, setTab] = useState<'kasir' | 'admin'>(initialTab);
  const [selectedArea, setSelectedArea] = useState<CashierArea>('Kasir Area Dalam');
  const [cashierName, setCashierName] = useState('Nadia Putri');
  const [accessCode, setAccessCode] = useState('');
  const [adminName, setAdminName] = useState('Ibu Ratna (Admin Koperasi)');
  const [adminPass, setAdminPass] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedShiftCode =
    selectedArea === 'Kasir Area Dalam'
      ? dailyShiftCodes.insideCode
      : dailyShiftCodes.outsideCode;

  const handleCashierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = onLoginCashier(selectedArea, cashierName, accessCode);
    if (!res.success) {
      setErrorMsg(res.error ?? 'Kode akses shift tidak sesuai.');
    } else {
      onClose();
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = onLoginAdmin(adminName, adminPass);
    if (!res.success) {
      setErrorMsg(res.error ?? 'PIN/Password Admin salah.');
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-login-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 id="role-login-title" className="text-base font-bold text-slate-900">
              Verifikasi Akses Petugas Ecomart
            </h2>
            <p className="text-xs text-slate-500">
              Tanggal Buku Aktif: <span className="font-mono">{businessDate}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog login"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('kasir');
              setErrorMsg(null);
            }}
            className={`rounded-md py-2 text-xs font-semibold transition-colors ${
              tab === 'kasir'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Login Shift Kasir
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('admin');
              setErrorMsg(null);
            }}
            className={`rounded-md py-2 text-xs font-semibold transition-colors ${
              tab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Login Admin Koperasi
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          >
            {errorMsg}
          </div>
        )}

        {tab === 'kasir' ? (
          <form onSubmit={handleCashierSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Pilih Akun Terminal Kasir (2 Titik Terintegrasi)
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(['Kasir Area Dalam', 'Kasir Area Luar'] as const).map((area) => {
                  const active = selectedArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedArea(area);
                        setCashierName(
                          area === 'Kasir Area Dalam'
                            ? 'Nadia Putri (Shift Pagi)'
                            : 'Rizky Pratama (Shift Istirahat)'
                        );
                        setErrorMsg(null);
                      }}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                        active
                          ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block">{area}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                        Kode: {area === 'Kasir Area Dalam' ? dailyShiftCodes.insideCode : dailyShiftCodes.outsideCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="cashier-name-input"
                className="block text-xs font-medium text-slate-700"
              >
                Nama Petugas Kasir Bertugas (Wajib Tercantum di Struk & Audit)
              </label>
              <input
                id="cashier-name-input"
                type="text"
                required
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Contoh: Nadia Putri (Kelas XI AKL)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label
                  htmlFor="shift-code-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  Kode Akses Harian ({businessDate})
                </label>
                <button
                  type="button"
                  onClick={() => setAccessCode(expectedShiftCode)}
                  className="text-left sm:text-right text-xs font-medium text-emerald-700 hover:underline"
                >
                  Isi Kode Hari Ini ({expectedShiftCode})
                </button>
              </div>
              <input
                id="shift-code-input"
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder={`Masukkan kode: ${expectedShiftCode}`}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Kode akses kasir berubah otomatis setiap hari setelah Tutup Buku Harian.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <UserCheck className="h-4 w-4" />
                <span>Verifikasi & Buka Kasir</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="admin-name-input"
                className="block text-xs font-medium text-slate-700"
              >
                Nama Pengurus / Admin Koperasi
              </label>
              <input
                id="admin-name-input"
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-pass-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  Kode Otorisasi Admin
                </label>
                <button
                  type="button"
                  onClick={() => setAdminPass('ADMIN-ECO')}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Isi Kode Demo (ADMIN-ECO)
                </button>
              </div>
              <input
                id="admin-pass-input"
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Masukkan ADMIN-ECO"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Masuk Panel Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
