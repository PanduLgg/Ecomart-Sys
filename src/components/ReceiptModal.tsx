import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { TransactionRecord } from '../types.ts';
import { formatRupiah } from '../utils/billingLogic.ts';

interface ReceiptModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const formattedDate = new Date(transaction.createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 id="receipt-modal-title" className="text-base font-semibold text-slate-900">
              Struk Transaksi Ecomart
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Struk"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div
          id="printable-receipt"
          className="my-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-5 text-xs text-slate-800"
        >
          <div className="text-center">
            <p className="text-sm font-bold tracking-tight text-slate-900">
              KOPERASI SEKOLAH ECOMART
            </p>
            <p className="mt-0.5 text-slate-500">
              Unit Usaha Siswa & Guru · Sinkronisasi Real-Time
            </p>
          </div>

          <div className="my-3 border-t border-dashed border-slate-300 pt-3 space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">No. Struk</span>
              <span className="font-mono font-medium text-slate-900 text-right truncate">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Waktu</span>
              <span className="font-mono text-slate-900 text-right">{formattedDate}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Titik Kasir</span>
              <span className="font-medium text-slate-900 text-right">{transaction.cashierAccount}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Petugas Kasir</span>
              <span className="font-semibold text-slate-900 text-right break-words min-w-0">{transaction.cashierName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Kode Shift</span>
              <span className="font-mono text-slate-700 text-right">{transaction.shiftCodeUsed}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Verifikasi Kasir</span>
              <span className="text-[11px] font-semibold text-emerald-800 text-right">Sah & Bertanggung Jawab</span>
            </div>
            {transaction.buyerLabel && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Pembeli</span>
                <span className="text-slate-900 text-right break-words min-w-0">{transaction.buyerLabel}</span>
              </div>
            )}
          </div>

          <div className="my-3 border-t border-dashed border-slate-300 pt-3 space-y-2">
            {transaction.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`}>
                <div className="flex justify-between gap-2 font-medium text-slate-900">
                  <span className="min-w-0 flex-1 break-words">{item.name}</span>
                  <span className="font-mono tabular-nums shrink-0">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 text-slate-500">
                  <span className="font-mono tabular-nums shrink-0">
                    {item.quantity} {item.unit} x {formatRupiah(item.price)}
                  </span>
                  <span className="truncate text-right">{item.category}</span>
                </div>
                {item.notes && (
                  <p className="text-[11px] text-slate-500 italic break-words">Catatan: {item.notes}</p>
                )}
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-300 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>TOTAL BELANJA</span>
              <span className="font-mono tabular-nums">{formatRupiah(transaction.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Metode ({transaction.paymentMethod})</span>
              <span className="font-mono tabular-nums">{formatRupiah(transaction.cashReceived)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>KEMBALIAN</span>
              <span className="font-mono tabular-nums">{formatRupiah(transaction.changeAmount)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-dashed border-slate-300 pt-3 text-center text-[11px] text-slate-500">
            <p>Terima kasih telah berbelanja di Koperasi Ecomart.</p>
            <p className="mt-0.5">Dicetak oleh: {transaction.cashierName} · {transaction.cashierAccount}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Selesai
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
