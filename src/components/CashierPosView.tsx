import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Package,
  ShoppingCart,
  QrCode,
  X,
  AlertCircle,
  FileText,
  Check,
  RotateCcw,
  Users,
  LogOut,
  ShieldCheck,
  Clock,
  UserCheck,
  Lock,
  Coffee,
  Sun,
  Store,
  Edit3,
} from 'lucide-react';
import type {
  ActiveShiftSession,
  CartItem,
  CashierArea,
  Product,
  ProductCategory,
  QrisPaymentConfig,
  StoreOperationalStatus,
  StoreStatusInfo,
  TransactionRecord,
} from '../types.ts';
import {
  PRODUCT_CATEGORIES,
  calculateCheckoutSummary,
  formatRupiah,
} from '../utils/billingLogic.ts';

interface CashierPosViewProps {
  products: Product[];
  transactions: TransactionRecord[];
  businessDate: string;
  currentShift: ActiveShiftSession;
  otherTerminalShift: ActiveShiftSession | null;
  qrisConfig: QrisPaymentConfig;
  storeStatus?: StoreStatusInfo;
  onUpdateStoreStatus?: (status: StoreOperationalStatus, note?: string) => void;
  onProcessTransaction: (payload: {
    items: CartItem[];
    cashReceived: number;
    paymentMethod: 'Tunai' | 'QRIS Koperasi';
    buyerLabel: string;
  }) => { success: boolean; error?: string; transaction?: TransactionRecord };
  onAddCorrectionNote: (transactionId: string, note: string) => void;
  onSwitchShiftOrTerminal?: () => void;
  onHandoverShift?: (payload: {
    newCashierName: string;
    accessCode: string;
    handoverNotes: string;
  }) => { success: boolean; error?: string };
  onLogoutShift?: () => void;
  onInspectReceipt: (tx: TransactionRecord) => void;
}

export const CashierPosView: React.FC<CashierPosViewProps> = ({
  products,
  transactions,
  businessDate,
  currentShift,
  otherTerminalShift,
  qrisConfig,
  storeStatus = {
    status: 'BUKA',
    note: '06.45 – 15.30 WIB (Senin – Jumat)',
    updatedAt: '',
    updatedBy: 'Sistem',
  },
  onUpdateStoreStatus,
  onProcessTransaction,
  onAddCorrectionNote,
  onSwitchShiftOrTerminal,
  onHandoverShift,
  onLogoutShift,
  onInspectReceipt,
}) => {
  const [subTab, setSubTab] = useState<'pos' | 'history' | 'stock'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | ProductCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashInput, setCashInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS Koperasi'>('Tunai');
  const [buyerLabel, setBuyerLabel] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [inlinePaymentError, setInlinePaymentError] = useState<string | null>(null);
  const [isVerifyingTransaction, setIsVerifyingTransaction] = useState(false);
  const [historyFilterArea, setHistoryFilterArea] = useState<'Semua' | CashierArea>('Semua');
  const [historyCashierFilter, setHistoryCashierFilter] = useState<'Semua' | string>('Semua');
  const [editingNoteTxId, setEditingNoteTxId] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');

  // Shift Handover Modal State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [handoverCodeInput, setHandoverCodeInput] = useState('');
  const [handoverNotesInput, setHandoverNotesInput] = useState('');
  const [handoverError, setHandoverError] = useState<string | null>(null);

  // Status Operasional Toko (Otoritas Kasir Area Dalam)
  const isInsideCashier = currentShift.area === 'Kasir Area Dalam';
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [customNoteInput, setCustomNoteInput] = useState(storeStatus.note || '');

  useEffect(() => {
    setCustomNoteInput(storeStatus.note || '');
  }, [storeStatus.note]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const numericCash = useMemo(() => {
    const parsed = Number(cashInput.replace(/[^0-9]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [cashInput]);

  const summary = useMemo(() => {
    const effectiveCash =
      paymentMethod === 'QRIS Koperasi'
        ? cart.reduce((s, i) => s + i.price * i.quantity, 0)
        : numericCash;
    return calculateCheckoutSummary(cart, effectiveCash);
  }, [cart, numericCash, paymentMethod]);

  const currentShiftTx = useMemo(() => {
    return transactions.filter(
      (tx) =>
        tx.businessDate === businessDate &&
        tx.cashierAccount === currentShift.area &&
        tx.cashierName === currentShift.cashierName &&
        tx.status === 'Selesai'
    );
  }, [transactions, businessDate, currentShift]);

  const currentShiftTxCount = currentShiftTx.length;
  const currentShiftRevenue = currentShiftTx.reduce((sum, tx) => sum + tx.totalAmount, 0);

  const shiftStartTimeFormatted = useMemo(() => {
    try {
      return new Date(currentShift.loginAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  }, [currentShift.loginAt]);

  const uniqueCashiersToday = useMemo(() => {
    const names = new Set<string>();
    names.add(currentShift.cashierName);
    transactions
      .filter((t) => t.businessDate === businessDate)
      .forEach((t) => names.add(t.cashierName));
    return Array.from(names);
  }, [currentShift.cashierName, transactions, businessDate]);

  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchDate = tx.businessDate === businessDate;
      const matchArea =
        historyFilterArea === 'Semua' || tx.cashierAccount === historyFilterArea;
      const matchCashier =
        historyCashierFilter === 'Semua' || tx.cashierName === historyCashierFilter;
      return matchDate && matchArea && matchCashier;
    });
  }, [transactions, businessDate, historyFilterArea, historyCashierFilter]);

  const handleSubmitHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setHandoverError(null);

    const cleanName = newCashierName.trim();
    if (!cleanName) {
      setHandoverError('Nama petugas kasir pengganti wajib diisi.');
      return;
    }

    if (cleanName.toLowerCase() === currentShift.cashierName.toLowerCase()) {
      setHandoverError('Nama kasir pengganti tidak boleh sama dengan kasir yang sedang bertugas saat ini.');
      return;
    }

    if (handoverCodeInput.trim().toUpperCase() !== currentShift.shiftCode.toUpperCase()) {
      setHandoverError(
        `Kode akses shift tidak sesuai. Masukkan kode harian resmi untuk terminal ${currentShift.area} (${currentShift.shiftCode}).`
      );
      return;
    }

    if (onHandoverShift) {
      const res = onHandoverShift({
        newCashierName: cleanName,
        accessCode: handoverCodeInput.trim().toUpperCase(),
        handoverNotes: handoverNotesInput.trim(),
      });

      if (!res.success) {
        setHandoverError(res.error ?? 'Gagal melakukan serah terima shift.');
        return;
      }
    }

    setIsHandoverModalOpen(false);
    setFeedbackSuccess(
      `Serah terima tugas kasir berhasil. Kasir aktif sekarang: ${cleanName} (Penanggung jawab shift).`
    );
  };

  const addToCart = (product: Product) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    if (product.stock <= 0) {
      setFeedbackError(`Stok ${product.name} habis.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setFeedbackError(`Stok maksimal ${product.name} adalah ${product.stock} ${product.unit}.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: 1,
          unit: product.unit,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, nextQty: number) => {
    setFeedbackError(null);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    if (nextQty > product.stock) {
      setFeedbackError(`Stok ${product.name} tersisa ${product.stock} ${product.unit}.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQty } : item
      )
    );
  };

  const updateCartNote = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, notes } : item
      )
    );
  };

  // STEP 1: Validasi dan Buka Modal Verifikasi sebelum memproses transaksi
  const handleOpenVerification = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setInlinePaymentError(null);

    if (cart.length === 0) {
      setInlinePaymentError(
        'Keranjang belanja kasir masih kosong. Silakan klik salah satu produk dari katalog di sebelah kiri untuk menambah ke transaksi.'
      );
      return;
    }

    // Jika metode Tunai dan kasir belum mengetik nominal, otomatis gunakan Uang Pas (exact payment)
    let effectiveCash =
      paymentMethod === 'QRIS Koperasi' ? summary.totalAmount : numericCash;

    if (paymentMethod === 'Tunai' && (!cashInput.trim() || numericCash === 0)) {
      effectiveCash = summary.totalAmount;
      setCashInput(String(summary.totalAmount));
    }

    if (paymentMethod === 'Tunai' && effectiveCash < summary.totalAmount) {
      const shortage = summary.totalAmount - effectiveCash;
      setInlinePaymentError(
        `Uang tunai kurang ${formatRupiah(shortage)}. Masukkan nominal uang yang cukup atau klik tombol 'Gunakan Uang Pas'.`
      );
      return;
    }

    setInlinePaymentError(null);
    setIsVerifyingTransaction(true);
  };

  // STEP 2: Konfirmasi Final & Simpan Transaksi (Simpan ke DB, reset form, dan cetak struk)
  const handleConfirmAndSaveTransaction = () => {
    let effectiveCash =
      paymentMethod === 'QRIS Koperasi' ? summary.totalAmount : numericCash;

    // Safety fallback: pastikan minimal uang pas
    if (paymentMethod === 'Tunai' && effectiveCash < summary.totalAmount) {
      effectiveCash = summary.totalAmount;
      setCashInput(String(summary.totalAmount));
    }

    const result = onProcessTransaction({
      items: cart,
      cashReceived: effectiveCash,
      paymentMethod,
      buyerLabel: buyerLabel.trim(),
    });

    if (!result.success) {
      const errMsg = result.error ?? 'Gagal memproses transaksi.';
      setFeedbackError(errMsg);
      setInlinePaymentError(errMsg);
      setIsVerifyingTransaction(false);
      return;
    }

    setCart([]);
    setCashInput('');
    setBuyerLabel('');
    setInlinePaymentError(null);
    setIsVerifyingTransaction(false);
    setFeedbackSuccess(
      `Transaksi ${result.transaction?.invoiceNumber} berhasil diverifikasi & disimpan.`
    );
    if (result.transaction) {
      onInspectReceipt(result.transaction);
    }
  };

  // Keyboard shortcut listener for the verification modal
  useEffect(() => {
    if (!isVerifyingTransaction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVerifyingTransaction(false);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirmAndSaveTransaction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerifyingTransaction, cart, numericCash, paymentMethod, buyerLabel, summary]);

  const quickDenominations = [10000, 20000, 50000, 100000];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-4">
      {/* Cashier Session Header Container */}
      <section className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-neutral-500 font-medium">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Shift Aktif Terverifikasi
              </span>
              <span className="font-semibold text-neutral-900">{currentShift.area}</span>
              <span aria-hidden="true">·</span>
              <span>Kode Shift: <strong className="font-mono text-neutral-900">{currentShift.shiftCode}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Buku: <strong className="font-mono text-neutral-900">{businessDate}</strong></span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900">
                Kasir Penanggung Jawab: {currentShift.cashierName}
              </h1>
              {currentShift.previousCashierName && (
                <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600 font-medium">
                  Operan dari: {currentShift.previousCashierName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Mulai jaga: {shiftStartTimeFormatted} WIB · Telah memproses <strong>{currentShiftTxCount}</strong> transaksi ({formatRupiah(currentShiftRevenue)})
              {otherTerminalShift ? ` · ${otherTerminalShift.area} aktif (${otherTerminalShift.cashierName})` : ''}
            </p>
          </div>

          {/* Action buttons: Oper Shift / Ganti Kasir & Keluar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onHandoverShift && (
              <button
                type="button"
                onClick={() => {
                  setHandoverError(null);
                  setNewCashierName('');
                  setHandoverCodeInput('');
                  setHandoverNotesInput('');
                  setIsHandoverModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Users className="h-3.5 w-3.5 text-neutral-600" />
                <span>Oper Shift / Ganti Kasir</span>
              </button>
            )}

            {onSwitchShiftOrTerminal && (
              <button
                type="button"
                onClick={onSwitchShiftOrTerminal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
                <span>Ganti Terminal</span>
              </button>
            )}

            {onLogoutShift && (
              <button
                type="button"
                onClick={onLogoutShift}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-red-600" />
                <span>Keluar Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Kontrol Status Operasional Toko (Otoritas Eksklusif Kasir Area Dalam) */}
        {isInsideCashier ? (
          <div className="mt-3.5 pt-3 border-t border-neutral-100 bg-neutral-50/70 -mx-4 -mb-3 p-3.5 sm:-mx-5 sm:p-4 rounded-b-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-emerald-700" />
                  Status Operasional Toko:
                </span>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 border border-emerald-200">
                  Otoritas Kasir Area Dalam
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-neutral-500 hidden md:inline">Sinkronisasi Real-Time Pembeli:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Operator Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="status-btn-buka"
                onClick={() => onUpdateStoreStatus?.('BUKA', storeStatus.status === 'BUKA' ? storeStatus.note : '06.45 – 15.30 WIB (Senin – Jumat)')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  storeStatus.status === 'BUKA'
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-600/30 font-bold'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                <Sun className={`h-3.5 w-3.5 ${storeStatus.status === 'BUKA' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                <span>Buka Toko</span>
                {storeStatus.status === 'BUKA' && <Check className="h-3.5 w-3.5 text-emerald-200 ml-0.5" />}
              </button>

              <button
                type="button"
                data-testid="status-btn-istirahat"
                onClick={() => onUpdateStoreStatus?.('ISTIRAHAT', 'Sedang istirahat sejenak. Buka kembali jam 13.00 WIB.')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  storeStatus.status === 'ISTIRAHAT'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-500/30 font-bold'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <Coffee className={`h-3.5 w-3.5 ${storeStatus.status === 'ISTIRAHAT' ? 'text-amber-200' : 'text-amber-600'}`} />
                <span>Sedang Istirahat</span>
                {storeStatus.status === 'ISTIRAHAT' && <Check className="h-3.5 w-3.5 text-amber-200 ml-0.5" />}
              </button>

              <button
                type="button"
                data-testid="status-btn-tutup"
                onClick={() => onUpdateStoreStatus?.('TUTUP', 'Toko koperasi tutup. Buka kembali besok pagi jam 06.45 WIB.')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  storeStatus.status === 'TUTUP'
                    ? 'bg-rose-700 text-white ring-2 ring-rose-600/30 font-bold'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-rose-50 hover:border-rose-300'
                }`}
              >
                <Lock className={`h-3.5 w-3.5 ${storeStatus.status === 'TUTUP' ? 'text-rose-200' : 'text-rose-600'}`} />
                <span>Tutup Toko</span>
                {storeStatus.status === 'TUTUP' && <Check className="h-3.5 w-3.5 text-rose-200 ml-0.5" />}
              </button>
            </div>

            {/* Note Display and Inline Editor */}
            <div className="rounded-lg bg-white border border-neutral-200 p-2.5 text-xs">
              {!isEditingNote ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-neutral-500 text-[11px] shrink-0">Pesan ke Pembeli:</span>
                    <span className="text-neutral-800 font-medium truncate text-xs">
                      &quot;{storeStatus.note || '-'}&quot;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium shrink-0 self-end sm:self-auto cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Ubah Pesan Keterangan</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="custom-store-note" className="text-[11px] font-semibold text-neutral-700">
                      Kustomisasi Pesan Informasi untuk Pembeli:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="text-[11px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                  <input
                    id="custom-store-note"
                    type="text"
                    value={customNoteInput}
                    onChange={(e) => setCustomNoteInput(e.target.value)}
                    placeholder="Ketik keterangan jam buka, istirahat, atau tutup..."
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-neutral-400">Pilihan Cepat:</span>
                      {[
                        '06.45 – 15.30 WIB (Senin – Jumat)',
                        'Sedang istirahat sejenak. Buka kembali jam 13.00 WIB.',
                        'Istirahat Sholat & Makan (12.00 – 13.00 WIB)',
                        'Toko koperasi tutup. Buka kembali besok pagi jam 06.45 WIB.',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCustomNoteInput(preset)}
                          className="rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-0.5 transition-colors cursor-pointer"
                        >
                          {preset.length > 28 ? `${preset.slice(0, 26)}...` : preset}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateStoreStatus?.(storeStatus.status, customNoteInput);
                        setIsEditingNote(false);
                      }}
                      className="rounded bg-neutral-900 text-white px-3 py-1 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Simpan Pesan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Kontrol Status Operasional Toko (Read-Only untuk Kasir Area Luar) */
          <div className="mt-3.5 pt-3 border-t border-neutral-100 bg-neutral-50/70 -mx-4 -mb-3 p-3.5 sm:-mx-5 sm:p-4 rounded-b-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-800">Status Operasional Toko:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    storeStatus.status === 'BUKA'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : storeStatus.status === 'ISTIRAHAT'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      storeStatus.status === 'BUKA'
                        ? 'bg-emerald-600'
                        : storeStatus.status === 'ISTIRAHAT'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-rose-600'
                    }`}
                  />
                  <span>
                    {storeStatus.status === 'BUKA'
                      ? 'Toko Buka'
                      : storeStatus.status === 'ISTIRAHAT'
                      ? 'Sedang Istirahat'
                      : 'Toko Tutup'}
                  </span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 bg-white border border-neutral-200 px-2.5 py-1 rounded-md">
                <Lock className="h-3 w-3 text-neutral-400 shrink-0" />
                <span>Otoritas Pengaturan: <strong>Khusus Kasir Area Dalam</strong></span>
              </div>
            </div>

            <div className="text-xs text-neutral-600 bg-white border border-neutral-200 rounded-lg p-2.5">
              <span className="font-semibold text-neutral-500 text-[11px]">Keterangan Aktif ke Pembeli: </span>
              <span className="text-neutral-800 font-medium">&quot;{storeStatus.note || '-'}&quot;</span>
            </div>
          </div>
        )}

        {/* Segmented Subtabs Navigation */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto border-t border-neutral-200 pt-3 no-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('pos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'pos'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Terminal Kasir (POS)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'history'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Riwayat Hari Ini ({todayTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('stock')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'stock'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Cek Stok Produk ({products.length})
          </button>
        </div>
      </section>

      {/* Inline Feedback Alerts */}
      {feedbackError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* POS SubTab: Clean Split Layout */}
      {subTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7 cols): Product Selection */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search & Category Filter */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk / barcode SKU..."
                  className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(['Semua', ...PRODUCT_CATEGORIES] as const).map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid: Clean, Compact, Fast to Click */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.productId === product.id);
                const isOut = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOut}
                    onClick={() => addToCart(product)}
                    className={`text-left rounded-xl border p-2.5 sm:p-3 transition-all flex flex-col justify-between ${
                      isOut
                        ? 'border-neutral-200 bg-neutral-50/70 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/30'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center relative shadow-2xs">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-neutral-300" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-neutral-900/75 text-white text-[8px] text-center font-mono py-0.5 truncate uppercase">
                          {product.category.slice(0, 8)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                          <span className="font-semibold text-neutral-500">{product.sku}</span>
                          {inCart && (
                            <span className="font-bold text-white bg-emerald-700 px-1.5 py-0.5 rounded text-[10px]">
                              {inCart.quantity}x
                            </span>
                          )}
                        </div>
                        <h3 className="mt-0.5 text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{product.unit}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between border-t border-neutral-100 pt-1.5 text-xs">
                      <span className="font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                        {formatRupiah(product.price)}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          isOut
                            ? 'text-red-600 font-bold'
                            : product.stock <= product.minStock
                            ? 'text-amber-700 font-bold'
                            : 'text-neutral-500'
                        }`}
                      >
                        {isOut ? 'Habis' : `Stok: ${product.stock}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (5 cols): Cart & Payment Panel */}
          <div className="lg:col-span-5 rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-neutral-700" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Keranjang Kasir ({summary.totalQuantity} item)
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  <p>Keranjang masih kosong.</p>
                  <p className="mt-0.5 text-[11px]">Klik barang di sisi kiri untuk menambahkan.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.productId} className="py-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="h-9 w-9 shrink-0 rounded border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                            {prod?.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-neutral-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-neutral-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] font-mono text-neutral-500">
                              {formatRupiah(item.price)} / {item.unit}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-neutral-900 tabular-nums shrink-0">
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                      </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded border border-neutral-300 bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 rounded-l"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs font-bold text-neutral-900 px-2 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 rounded-r"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, 0)}
                        className="text-xs text-neutral-400 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    </div>

                    {item.category === 'Jasa Print' && (
                      <input
                        type="text"
                        value={item.notes ?? ''}
                        onChange={(e) => updateCartNote(item.productId, e.target.value)}
                        placeholder="Catatan print (misal: Tugas Biologi A4)"
                        className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 mt-1"
                      />
                    )}
                  </div>
                  );
                })
              )}
            </div>

            {/* Payment Controls Form */}
            <form onSubmit={handleOpenVerification} noValidate className="border-t border-neutral-200 pt-3 space-y-3">
              {/* Payment Method Toggle */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Tunai', 'QRIS Koperasi'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method === 'QRIS Koperasi') {
                          setCashInput(String(summary.totalAmount));
                        }
                        if (inlinePaymentError) setInlinePaymentError(null);
                      }}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                        paymentMethod === method
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Input */}
              {paymentMethod === 'Tunai' && (
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700">Uang Diterima (Rp)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCashInput(String(summary.totalAmount));
                        if (inlinePaymentError) setInlinePaymentError(null);
                      }}
                      className="text-emerald-700 font-medium hover:underline cursor-pointer"
                    >
                      Uang Pas ({formatRupiah(summary.totalAmount)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={cashInput}
                    onChange={(e) => {
                      setCashInput(e.target.value);
                      if (inlinePaymentError) setInlinePaymentError(null);
                    }}
                    placeholder="Nominal uang dari pembeli"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {quickDenominations.map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => {
                          setCashInput(String(nom));
                          if (inlinePaymentError) setInlinePaymentError(null);
                        }}
                        className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        {formatRupiah(nom)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QRIS Instruction Snippet */}
              {paymentMethod === 'QRIS Koperasi' && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-xs space-y-1">
                  <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-emerald-800" />
                    {qrisConfig.accountName}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    NMID: {qrisConfig.merchantNmid ?? 'ID1020039281729'} · Nominal: {formatRupiah(summary.totalAmount)}
                  </p>
                </div>
              )}

              {/* Buyer Label */}
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  Keterangan Pembeli (Opsional)
                </label>
                <input
                  type="text"
                  value={buyerLabel}
                  onChange={(e) => setBuyerLabel(e.target.value)}
                  placeholder="Misal: Siswa X-2 / Guru Piket"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              {/* Totals Summary */}
              <div className="rounded-lg bg-neutral-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-neutral-900">
                  <span>Total Belanja:</span>
                  <span className="font-mono tabular-nums">{formatRupiah(summary.totalAmount)}</span>
                </div>
                {paymentMethod === 'Tunai' && (
                  <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium">
                    <span>Kembalian:</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        summary.isCashSufficient ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {summary.isCashSufficient
                        ? formatRupiah(summary.changeAmount)
                        : `Kurang ${formatRupiah(summary.shortfallAmount)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Payment Error Notice */}
              {inlinePaymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <span className="font-medium leading-relaxed">{inlinePaymentError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInlinePaymentError(null)}
                      className="text-red-400 hover:text-red-700 p-0.5 shrink-0 cursor-pointer"
                      aria-label="Tutup pesan error"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {paymentMethod === 'Tunai' && cart.length > 0 && numericCash < summary.totalAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        setCashInput(String(summary.totalAmount));
                        setInlinePaymentError(null);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-red-100 hover:bg-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-800 transition-colors cursor-pointer"
                    >
                      Gunakan Uang Pas ({formatRupiah(summary.totalAmount)})
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button (Opens Verification Modal) */}
              <button
                type="button"
                onClick={handleOpenVerification}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Selesaikan Transaksi</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History SubTab */}
      {subTab === 'history' && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Riwayat Transaksi Hari Ini ({businessDate})
              </h2>
              <p className="text-xs text-neutral-500">
                Audit struk dan catatan koreksi per terminal kasir.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500">Terminal:</span>
                <select
                  value={historyFilterArea}
                  onChange={(e) => setHistoryFilterArea(e.target.value as 'Semua' | CashierArea)}
                  className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 outline-none"
                >
                  <option value="Semua">Semua Terminal</option>
                  <option value="Kasir Area Dalam">Kasir Area Dalam</option>
                  <option value="Kasir Area Luar">Kasir Area Luar</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500">Petugas:</span>
                <select
                  value={historyCashierFilter}
                  onChange={(e) => setHistoryCashierFilter(e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 outline-none"
                >
                  <option value="Semua">Semua Petugas Kasir</option>
                  {uniqueCashiersToday.map((name) => (
                    <option key={name} value={name}>
                      {name} {name === currentShift.cashierName ? '(Sedang Jaga)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {todayTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Belum ada transaksi yang tercatat pada sesi kasir hari ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Struk</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Kasir / Area</th>
                    <th className="py-2.5 px-3">Item Belanja</th>
                    <th className="py-2.5 px-3 font-mono text-right">Total</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {todayTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-neutral-900">{tx.cashierName}</p>
                        <p className="text-[10px] text-neutral-400">{tx.cashierAccount}</p>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 max-w-[200px] truncate">
                        {tx.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 text-right">
                        {formatRupiah(tx.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectReceipt(tx)}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            Lihat Struk
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteTxId(tx.id);
                              setCorrectionText(tx.correctionNote ?? '');
                            }}
                            className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            Catatan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Stock SubTab */}
      {subTab === 'stock' && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Pengecekan Stok Barang Real-Time ({products.length} item)
              </h2>
              <p className="text-xs text-neutral-500">
                Data sinkron otomatis dengan meja kasir dan katalog pembeli.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 font-mono text-right">Harga Jual</th>
                  <th className="py-2.5 px-3 font-mono text-right">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 shrink-0 rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-neutral-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900">{p.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{p.category}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 text-right">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-neutral-900">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Tersedia'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Note Edit Modal */}
      {editingNoteTxId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900">Catatan Koreksi Transaksi</h3>
            <textarea
              rows={3}
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="Tulis catatan (misal: Uang pas diterima, nota manual)..."
              className="w-full rounded-lg border border-neutral-300 p-2 text-xs text-neutral-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNoteTxId(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddCorrectionNote(editingNoteTxId, correctionText.trim());
                  setEditingNoteTxId(null);
                }}
                className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VERIFIKASI PADA KASIR SEBELUM MENYELESAIKAN & SIMPAN TRANSAKSI */}
      {/* ======================================================== */}
      {isVerifyingTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-modal-title"
        >
          <div className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h2 id="verify-modal-title" className="text-base font-bold text-neutral-900">
                  Verifikasi & Konfirmasi Transaksi
                </h2>
                <p className="text-xs text-neutral-500">
                  Periksa rincian pesanan dan pembayaran bersama pembeli.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyingTransaction(false)}
                className="rounded p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Transaction Items Checklist */}
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 max-h-36 overflow-y-auto divide-y divide-neutral-200 text-xs">
                {cart.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.productId} className="py-2 flex justify-between items-center gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-9 w-9 shrink-0 rounded-md border border-neutral-200 bg-white overflow-hidden flex items-center justify-center">
                          {prod?.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-neutral-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-neutral-900 font-semibold truncate leading-tight">
                            {item.quantity}x {item.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            {formatRupiah(item.price)} / {item.unit}
                            {item.notes ? ` · Catatan: ${item.notes}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-neutral-900 font-bold shrink-0">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Payment Summary Box */}
              <div className="rounded-lg border border-neutral-200 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-baseline text-sm font-bold text-neutral-900">
                  <span>Total Belanja:</span>
                  <span className="font-mono text-base text-neutral-900">
                    {formatRupiah(summary.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-100 pt-1.5 text-neutral-600">
                  <span>Metode Pembayaran:</span>
                  <span className="font-semibold text-neutral-900">{paymentMethod}</span>
                </div>

                {paymentMethod === 'Tunai' && (
                  <>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Uang Tunai Diterima:</span>
                      <span className="font-mono font-semibold text-neutral-900">
                        {formatRupiah(summary.cashReceived)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-emerald-800 border-t border-neutral-100 pt-1">
                      <span>Kembalian:</span>
                      <span className="font-mono text-sm">
                        {formatRupiah(summary.changeAmount)}
                      </span>
                    </div>
                  </>
                )}

                {buyerLabel && (
                  <div className="flex justify-between items-center text-neutral-500 border-t border-neutral-100 pt-1 text-[11px]">
                    <span>Keterangan Pembeli:</span>
                    <span className="text-neutral-800 font-medium">{buyerLabel}</span>
                  </div>
                )}

                {/* Explicit Cashier Accountability Box */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between items-center text-neutral-700">
                    <span className="font-medium">Kasir Penanggung Jawab:</span>
                    <strong className="text-neutral-900">{currentShift.cashierName}</strong>
                  </div>
                  <div className="flex justify-between items-center text-neutral-500 text-[11px]">
                    <span>Terminal / Kode Otorisasi:</span>
                    <span className="font-mono text-neutral-800">{currentShift.area} ({currentShift.shiftCode})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-0.5 border-t border-neutral-200/80">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                    <span>Diverifikasi resmi & tercetak di struk belanja pembeli.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Tekan <strong>Enter</strong> untuk konfirmasi dan simpan, atau klik tombol di bawah.</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsVerifyingTransaction(false)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Batal / Edit Keranjang
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSaveTransaction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Selesaikan & Simpan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL SERAH TERIMA TUGAS KASIR (OPER SHIFT BERKALA) */}
      {/* ======================================================== */}
      {isHandoverModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="handover-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h2 id="handover-modal-title" className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-neutral-700" />
                  <span>Serah Terima Tugas Kasir (Oper Shift)</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  Verifikasi pergantian petugas kasir jaga untuk terminal {currentShift.area}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {handoverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{handoverError}</span>
              </div>
            )}

            {/* Current Shift Summary & Accountability */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-neutral-800">Petugas yang Menyerahkan Tugas:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-neutral-500">Kasir Bertugas:</span>
                  <p className="font-semibold text-neutral-900">{currentShift.cashierName}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Waktu Mulai Jaga:</span>
                  <p className="font-mono text-neutral-900">{shiftStartTimeFormatted} WIB</p>
                </div>
                <div>
                  <span className="text-neutral-500">Transaksi Diproses:</span>
                  <p className="font-semibold text-neutral-900">{currentShiftTxCount} struk</p>
                </div>
                <div>
                  <span className="text-neutral-500">Total Omzet Kasir:</span>
                  <p className="font-mono font-bold text-emerald-800">{formatRupiah(currentShiftRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Form Input for New Incoming Cashier */}
            <form onSubmit={handleSubmitHandover} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Nama Petugas Kasir Pengganti <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  placeholder="Contoh: Rian Pratama (Shift Siang)"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Nama petugas yang akan mengambil alih tanggung jawab transaksi berikutnya di terminal ini.
                </p>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Verifikasi Kode Akses Harian Terminal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={handoverCodeInput}
                  onChange={(e) => setHandoverCodeInput(e.target.value.toUpperCase())}
                  placeholder={`Masukkan kode shift ${currentShift.area} (misal: ${currentShift.shiftCode})`}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-900 uppercase focus:border-neutral-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Pastikan petugas pengganti memegang kode akses resmi hari ini ({businessDate}).
                </p>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Catatan Serah Terima / Kas Modal (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={handoverNotesInput}
                  onChange={(e) => setHandoverNotesInput(e.target.value)}
                  placeholder="Contoh: Saldo kas laci Rp 200.000 cocok, stok minuman dan cemilan terhitung rapi."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer shadow-xs"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Verifikasi & Operkan Tugas Kasir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
