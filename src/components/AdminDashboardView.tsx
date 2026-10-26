import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Package,
  History,
  Settings,
  Plus,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Upload,
  X,
  Search,
  BookOpen,
  LayoutGrid,
  TrendingUp,
  Clock,
  Check,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import type {
  ActiveShiftSession,
  ActivityLog,
  CashierArea,
  DailyClosingRecord,
  Product,
  ProductCategory,
  QrisPaymentConfig,
  TransactionRecord,
} from '../types.ts';
import {
  PRODUCT_CATEGORIES,
  computeBusinessAnalytics,
  formatRupiah,
} from '../utils/billingLogic.ts';
import { createProductSvgDataUri, createDefaultQrisSvgDataUri } from '../data/seedData.ts';
import { AdminSalesChart } from './AdminSalesChart.tsx';

interface AdminDashboardViewProps {
  adminName: string;
  businessDate: string;
  lastClosingTimestamp?: string;
  dailyShiftCodes: {
    date: string;
    insideCode: string;
    outsideCode: string;
  };
  activeShifts: {
    inside: ActiveShiftSession | null;
    outside: ActiveShiftSession | null;
  };
  products: Product[];
  transactions: TransactionRecord[];
  activityLogs: ActivityLog[];
  closingHistory: DailyClosingRecord[];
  qrisConfig: QrisPaymentConfig;
  onRestockProduct: (productId: string, addedQty: number) => void;
  onUpdateProduct: (updated: Product) => void;
  onCreateProduct: (newProduct: Omit<Product, 'id' | 'totalSoldAllTime' | 'lastSoldAt' | 'updatedAt'>) => void;
  onVoidOrCorrectTransaction: (txId: string, reason: string) => void;
  onRotateShiftCodes: () => void;
  onExecuteDailyClosing: (notes: string) => DailyClosingRecord;
  onInspectReceipt: (tx: TransactionRecord) => void;
  onUpdateQrisConfig: (newConfig: QrisPaymentConfig) => void;
  onLogoutAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  adminName,
  businessDate,
  lastClosingTimestamp,
  dailyShiftCodes,
  activeShifts,
  products,
  transactions,
  activityLogs,
  closingHistory,
  qrisConfig,
  onRestockProduct,
  onUpdateProduct,
  onCreateProduct,
  onVoidOrCorrectTransaction,
  onRotateShiftCodes,
  onExecuteDailyClosing,
  onInspectReceipt,
  onUpdateQrisConfig,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'transactions' | 'closing' | 'qris' | 'logs'
  >('overview');
  const [periodDays, setPeriodDays] = useState<1 | 7 | 30>(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [customRestockAmounts, setCustomRestockAmounts] = useState<Record<string, string>>({});
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<'Semua' | ProductCategory>('Semua');
  const [txFilterArea, setTxFilterArea] = useState<'Semua' | CashierArea>('Semua');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingBanner, setClosingBanner] = useState<string | null>(null);

  // Real-time clock for automatic 24-hour closing cycle monitor
  const [realTimeClock, setRealTimeClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setRealTimeClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cycleCountdown = useMemo(() => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const baseTime = lastClosingTimestamp
      ? new Date(lastClosingTimestamp).getTime()
      : new Date(`${businessDate}T00:00:00`).getTime();
    if (Number.isNaN(baseTime)) return { hours: 24, minutes: 0, seconds: 0, isPastDue: false };

    const elapsed = realTimeClock.getTime() - baseTime;
    const remaining = TWENTY_FOUR_HOURS - elapsed;
    if (remaining <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isPastDue: true };
    }
    const totalSecs = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return { hours, minutes, seconds, isPastDue: false };
  }, [lastClosingTimestamp, businessDate, realTimeClock]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // QRIS Configuration State
  const [qrisImage, setQrisImage] = useState(qrisConfig.imageUrl);
  const [qrisAccount, setQrisAccount] = useState(qrisConfig.accountName);
  const [qrisNmid, setQrisNmid] = useState(qrisConfig.merchantNmid ?? '');
  const [qrisInstructions, setQrisInstructions] = useState(qrisConfig.instructionText);
  const [qrisSuccessMsg, setQrisSuccessMsg] = useState<string | null>(null);

  // Correction Modal State
  const [correctingTxId, setCorrectingTxId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('Koreksi salah input oleh Admin (Stok dikembalikan)');

  useEffect(() => {
    setQrisImage(qrisConfig.imageUrl);
    setQrisAccount(qrisConfig.accountName);
    setQrisNmid(qrisConfig.merchantNmid ?? '');
    setQrisInstructions(qrisConfig.instructionText);
  }, [qrisConfig]);

  // New Product form state
  const [newSku, setNewSku] = useState('MIN-009');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Minuman');
  const [newPrice, setNewPrice] = useState('5000');
  const [newCost, setNewCost] = useState('3500');
  const [newStock, setNewStock] = useState('30');
  const [newMinStock, setNewMinStock] = useState('10');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const analytics = useMemo(() => {
    const refIso = `${businessDate}T23:59:59.000Z`;
    return computeBusinessAnalytics(products, transactions, refIso, periodDays);
  }, [products, transactions, businessDate, periodDays]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = inventoryCategory === 'Semua' || p.category === inventoryCategory;
      const q = inventorySearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, inventoryCategory, inventorySearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      return txFilterArea === 'Semua' || tx.cashierAccount === txFilterArea;
    });
  }, [transactions, txFilterArea]);

  // Total inventory metrics
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= 0).length;
  }, [products]);

  const handleEditProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingProduct({ ...editingProduct, imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const skuClean = newSku.trim().toUpperCase() || `ECO-${Date.now().toString().slice(-3)}`;
    const finalImage =
      newImageUrl.trim() ||
      createProductSvgDataUri(newName.trim(), newCategory, skuClean);

    onCreateProduct({
      sku: skuClean,
      name: newName.trim(),
      category: newCategory,
      price: Math.max(0, Number(newPrice) || 0),
      costPrice: Math.max(0, Number(newCost) || 0),
      stock: Math.max(0, Number(newStock) || 0),
      minStock: Math.max(0, Number(newMinStock) || 5),
      unit: newUnit.trim() || 'pcs',
      imageUrl: finalImage,
      description: newDesc.trim(),
    });

    setNewName('');
    setNewImageUrl('');
    setNewDesc('');
    setIsAddingProduct(false);
  };

  const handleTriggerDailyClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const record = onExecuteDailyClosing(closingNotes);
    setClosingNotes('');
    setClosingBanner(
      `Tutup Buku Tanggal ${record.businessDate} berhasil disimpan. Total omzet ${formatRupiah(
        record.totalRevenue
      )} (${record.totalTransactions} transaksi) diarsipkan.`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setQrisImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultQris = () => {
    const defaultUri = createDefaultQrisSvgDataUri(
      qrisAccount || 'KOPERASI SEKOLAH ECOMART',
      qrisNmid || 'ID1020039281729'
    );
    setQrisImage(defaultUri);
  };

  const handleSaveQrisConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = qrisImage.trim() || createDefaultQrisSvgDataUri(qrisAccount, qrisNmid);
    onUpdateQrisConfig({
      imageUrl: finalImage,
      accountName: qrisAccount.trim() || 'KOPERASI SEKOLAH ECOMART',
      merchantNmid: qrisNmid.trim() || undefined,
      instructionText: qrisInstructions.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    });
    setQrisSuccessMsg('Pengaturan QRIS berhasil disimpan & aktif secara langsung.');
    setTimeout(() => setQrisSuccessMsg(null), 4000);
  };

  const handleConfirmCorrection = () => {
    if (!correctingTxId) return;
    onVoidOrCorrectTransaction(correctingTxId, correctionReason.trim());
    setCorrectingTxId(null);
  };

  /* ========================================================================= */
  /* SUB-VIEW RENDERS FOR CLEAN CARDS                                          */
  /* ========================================================================= */

  // CARD 1: KPI Metrics & Period
  const renderKpiSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs">
        <h2 className="text-sm font-bold text-neutral-900">
          Ringkasan Metrik Bisnis Koperasi
        </h2>
        <div className="inline-flex rounded-lg border border-neutral-300 bg-white p-0.5 text-xs">
          {[
            { days: 1, label: 'Hari Ini' },
            { days: 7, label: '7 Hari' },
            { days: 30, label: '30 Hari' },
          ].map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => setPeriodDays(item.days as 1 | 7 | 30)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                periodDays === item.days
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-neutral-500">Total Omzet</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-neutral-900">
            {formatRupiah(analytics.totalRevenue)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Laba Kotor: <strong className="text-emerald-700 font-mono">{formatRupiah(analytics.totalProfit)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-neutral-500">Jumlah Transaksi</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-neutral-900">
            {analytics.totalTransactions} Struk
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Barang terjual: {analytics.totalUnitsSold} unit
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-neutral-500">Kasir Area Dalam</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-neutral-900">
            {formatRupiah(analytics.insideRevenue)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
            {activeShifts.inside ? activeShifts.inside.cashierName : 'Shift belum dibuka'}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-neutral-500">Kasir Area Luar</p>
          <p className="mt-1 text-lg sm:text-xl font-bold font-mono text-neutral-900">
            {formatRupiah(analytics.outsideRevenue)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
            {activeShifts.outside ? activeShifts.outside.cashierName : 'Shift belum dibuka'}
          </p>
        </div>
      </div>
    </div>
  );

  // CARD 2: Best Sellers & Deadstock Warning (TANPA DISKON)
  const renderBestSellersAndDeadstock = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Best Sellers */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Produk Terlaris (Best Seller)
            </h3>
            <p className="text-[11px] text-neutral-500">
              Barang paling sering dibeli siswa & guru periode ini.
            </p>
          </div>
          <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
            Top 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-2 px-3">Produk</th>
                <th className="py-2 px-3 text-right">Terjual</th>
                <th className="py-2 px-3 text-right">Sisa Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {analytics.bestSellers.slice(0, 5).map((item, idx) => (
                <tr key={item.product.id}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">{idx + 1}. {item.product.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{item.product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                    {item.periodUnitsSold} {item.product.unit}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-neutral-700">
                    {item.product.stock} {item.product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deadstock / Peringatan Stok Mengendap — TANPA DISKON */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Peringatan Stok Mengendap / Kurang Laku
            </h3>
            <p className="text-[11px] text-neutral-500">
              Barang dengan pergerakan lambat atau minim transaksi periode ini.
            </p>
          </div>
          <span className="rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-0.5">
            {analytics.deadstockProducts.length} Produk
          </span>
        </div>

        {analytics.deadstockProducts.length === 0 ? (
          <p className="py-8 text-center text-xs text-neutral-400">
            Semua barang bergerak normal dan aktif terjual.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 text-xs">
            {analytics.deadstockProducts.slice(0, 5).map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-10 w-10 shrink-0 rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-neutral-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-neutral-500">{item.deadstockReason}</p>
                  </div>
                </div>

                {/* Status Tanpa Tombol Diskon */}
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-900">
                    Stok: {item.product.stock} {item.product.unit}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Perlu Evaluasi</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  // CARD 3: SEPARATE CARD — KONTROL INVENTARIS
  const renderInventoryControlCard = () => (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Card Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">
              Kontrol Inventaris & Stok Barang
            </h2>
            <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-800">
              {products.length} Produk
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kelola stok fisik, sesuaikan harga jual, restock cepat, dan tambah item baru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingProduct((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors self-start shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{isAddingProduct ? 'Tutup Form' : 'Tambah Produk Baru'}</span>
        </button>
      </div>

      {/* Add Product Form Inline */}
      {isAddingProduct && (
        <form onSubmit={handleCreateNewProduct} className="rounded-lg border border-neutral-300 bg-neutral-50 p-4 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900">Form Tambah Produk Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-600 mb-1">SKU</label>
              <input
                type="text"
                required
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-neutral-600 mb-1">Nama Produk</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama barang..."
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                required
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Harga Modal (Rp)</label>
              <input
                type="number"
                required
                min={0}
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Stok Awal</label>
              <input
                type="number"
                required
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1">Satuan</label>
              <input
                type="text"
                required
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="pcs / botol / lembar"
                className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Simpan Produk
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.target.value)}
            placeholder="Cari nama produk / kode SKU..."
            className="w-full rounded-lg border border-neutral-300 bg-white py-1.5 pl-9 pr-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['Semua', ...PRODUCT_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setInventoryCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                inventoryCategory === cat
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table with Product Thumbnails */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3">Produk</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3 font-mono text-right">Harga Jual</th>
              <th className="py-2.5 px-3 font-mono text-right">Sisa Stok</th>
              <th className="py-2.5 px-3">Restock Cepat</th>
              <th className="py-2.5 px-3 text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredProducts.map((p) => {
              const customRestock = customRestockAmounts[p.id] ?? '';
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock <= p.minStock;

              return (
                <tr key={p.id} className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center shadow-2xs">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-neutral-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 text-xs sm:text-sm">{p.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600">{p.category}</td>
                  <td className="py-2.5 px-3 font-mono text-right text-neutral-900 font-bold">
                    {formatRupiah(p.price)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isOut
                          ? 'bg-red-100 text-red-700'
                          : isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'text-neutral-900'
                      }`}
                    >
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRestockProduct(p.id, 10)}
                        className="rounded border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[11px] text-neutral-700 hover:bg-neutral-100"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => onRestockProduct(p.id, 25)}
                        className="rounded border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[11px] text-neutral-700 hover:bg-neutral-100"
                      >
                        +25
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={customRestock}
                        onChange={(e) => setCustomRestockAmounts({ ...customRestockAmounts, [p.id]: e.target.value })}
                        placeholder="Jml"
                        className="w-12 rounded border border-neutral-300 px-1 py-0.5 text-center font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(customRestock);
                          if (val > 0) {
                            onRestockProduct(p.id, val);
                            setCustomRestockAmounts({ ...customRestockAmounts, [p.id]: '' });
                          }
                        }}
                        className="rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-neutral-800"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Card Footer Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
        <div className="flex items-center gap-3">
          <span>Menampilkan <strong>{filteredProducts.length}</strong> dari {products.length} produk</span>
          <span>·</span>
          <span>Total fisik: <strong className="font-mono text-neutral-800">{totalStockUnits}</strong> unit</span>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <span className="rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-0.5">
              {lowStockCount} Stok Menipis
            </span>
          )}
          {outOfStockCount > 0 && (
            <span className="rounded bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold px-2 py-0.5">
              {outOfStockCount} Stok Habis
            </span>
          )}
        </div>
      </div>
    </section>
  );

  // CARD 4: SEPARATE CARD — LAPORAN & AUDIT TRANSAKSI
  const renderTransactionsReportCard = () => (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Card Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900">
              Laporan & Rekap Transaksi Kasir
            </h2>
            <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-800">
              {transactions.length} Transaksi
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Data transaksi real-time dari seluruh terminal kasir koperasi yang tersimpan di sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Filter Terminal:</span>
          <select
            value={txFilterArea}
            onChange={(e) => setTxFilterArea(e.target.value as 'Semua' | CashierArea)}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 outline-none"
          >
            <option value="Semua">Semua Terminal</option>
            <option value="Kasir Area Dalam">Kasir Area Dalam</option>
            <option value="Kasir Area Luar">Kasir Area Luar</option>
          </select>
        </div>
      </div>

      {/* Transactions Table with Product Image Badges */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3">No. Struk</th>
              <th className="py-2.5 px-3">Tanggal / Waktu</th>
              <th className="py-2.5 px-3">Kasir & Lokasi</th>
              <th className="py-2.5 px-3">Item Belanja</th>
              <th className="py-2.5 px-3 font-mono text-right">Total Belanja</th>
              <th className="py-2.5 px-3">Metode</th>
              <th className="py-2.5 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-neutral-50/50">
                <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">
                  {tx.invoiceNumber}
                </td>
                <td className="py-2.5 px-3 text-neutral-500 font-mono">
                  {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold text-neutral-900">{tx.cashierName}</p>
                  <p className="text-[10px] text-neutral-400">{tx.cashierAccount}</p>
                </td>
                <td className="py-2.5 px-3 text-neutral-700 max-w-[260px]">
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                    {tx.items.map((i) => {
                      const prod = products.find((p) => p.id === i.productId);
                      return (
                        <span
                          key={i.productId}
                          className="inline-flex items-center gap-1 rounded bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-800"
                          title={`${i.name} (${formatRupiah(i.price)})`}
                        >
                          {prod?.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt=""
                              className="h-3.5 w-3.5 rounded-xs object-cover"
                            />
                          ) : null}
                          <span>{i.quantity}x {i.name}</span>
                        </span>
                      );
                    })}
                  </div>
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
                      Struk
                    </button>
                    <button
                      type="button"
                      onClick={() => setCorrectingTxId(tx.id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                    >
                      Koreksi
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card Footer Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
        <div>
          <span>Menampilkan <strong>{filteredTransactions.length}</strong> struk</span>
          <span> · </span>
          <span>Total transaksi terfilter: <strong className="font-mono text-neutral-900">{formatRupiah(filteredTransactions.reduce((s, t) => s + t.totalAmount, 0))}</strong></span>
        </div>
        <p className="text-[11px] text-neutral-400">Sinkronisasi transaksi otomatis terpusat</p>
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Admin Top Header Card */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-medium">
              <span>Admin: <strong className="text-neutral-900">{adminName}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Tanggal Buku: <strong className="font-mono text-neutral-900">{businessDate}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Kode Shift: Kasir Dalam (<strong className="font-mono text-neutral-900">{dailyShiftCodes.insideCode}</strong>), Kasir Luar (<strong className="font-mono text-neutral-900">{dailyShiftCodes.outsideCode}</strong>)</span>
            </div>
            <h1 className="mt-1 text-lg sm:text-xl font-bold text-neutral-900">
              Panel Pengelola Koperasi Ecomart
            </h1>
            <p className="text-xs text-neutral-500">
              Kelola stok, pantau transaksi, konfigurasi pembayaran, dan tutup buku harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRotateShiftCodes}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-neutral-600" />
              <span>Rotasi Kode Shift</span>
            </button>

            {onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-red-600" />
                <span>Keluar Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation: Dedicated Single-Page Menus */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-neutral-200 pt-3 no-scrollbar">
          {[
            { id: 'overview', label: 'Ringkasan & Grafik' },
            { id: 'inventory', label: `Inventori Produk (${products.length})` },
            { id: 'transactions', label: `Laporan Transaksi (${transactions.length})` },
            { id: 'closing', label: 'Tutup Buku Harian (24 Jam)' },
            { id: 'qris', label: 'Pengaturan QRIS' },
            { id: 'logs', label: `Log Audit Kasir (${activityLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Banner Notifikasi */}
      {closingBanner && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{closingBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setClosingBanner(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MENU 1: RINGKASAN & GRAFIK PENJUALAN PAGE */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {renderKpiSection()}
          <AdminSalesChart
            transactions={transactions}
            closingHistory={closingHistory}
            businessDate={businessDate}
          />
          {renderBestSellersAndDeadstock()}
        </div>
      )}

      {/* MENU 2: KONTROL INVENTARIS PRODUK PAGE */}
      {activeTab === 'inventory' && renderInventoryControlCard()}

      {/* MENU 3: LAPORAN TRANSAKSI & STRUK PAGE */}
      {activeTab === 'transactions' && renderTransactionsReportCard()}

      {/* MENU 4: TUTUP BUKU HARIAN & ARSIP RIWAYAT (24 JAM REALTIME) PAGE */}
      {activeTab === 'closing' && (
        <div className="space-y-4">
          {/* Status Siklus Tutup Buku Otomatis 24 Jam */}
          <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-800">
                  <Clock className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900">
                    Sistem Tutup Buku Otomatis Real-Time (Siklus 24 Jam)
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Memantau batas waktu 24 jam real-time dan tanggal kalender untuk otomatis mengarsipkan pembukuan.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Otomatisasi 24 Jam Aktif</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <span className="text-neutral-500 text-[11px]">Waktu Real-Time Sekarang</span>
                <p className="font-mono text-base font-bold text-neutral-900 mt-1">
                  {realTimeClock.toLocaleTimeString('id-ID')} WIB
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {realTimeClock.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <span className="text-neutral-500 text-[11px]">Tanggal Buku Aktif</span>
                <p className="font-mono text-base font-bold text-neutral-900 mt-1">
                  {businessDate}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {analytics.totalTransactions} struk aktif belum ditutup
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <span className="text-neutral-500 text-[11px]">Sisa Batas Waktu 24 Jam</span>
                <p className="font-mono text-base font-bold text-emerald-800 mt-1">
                  {cycleCountdown.isPastDue
                    ? '00:00:00 (Jadwal Tutup)'
                    : `${String(cycleCountdown.hours).padStart(2, '0')}:${String(cycleCountdown.minutes).padStart(2, '0')}:${String(cycleCountdown.seconds).padStart(2, '0')}`}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {cycleCountdown.isPastDue ? 'Siap dieksekusi sistem' : 'Menuju tutup otomatis'}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <span className="text-neutral-500 text-[11px]">Penutupan Terakhir</span>
                <p className="font-mono text-xs font-semibold text-neutral-800 mt-1 truncate">
                  {lastClosingTimestamp
                    ? new Date(lastClosingTimestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' WIB'
                    : 'Awal Operasional'}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {closingHistory.length} arsip tersimpan di riwayat
                </p>
              </div>
            </div>

            <div className="mt-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-600 leading-relaxed">
              <strong className="text-neutral-800 font-semibold">Mekanisme Otomatis 24 Jam: </strong>
              Sistem terus memantau jam real-time. Saat batas waktu 24 jam tercapai atau tanggal kalender berganti, sistem otomatis: (1) Menutup dan menjumlahkan omzet kasir hari ini, (2) Menyimpan seluruh catatan transaksi ke Riwayat Tutup Buku, (3) Memajukan tanggal buku operasional ke hari berikutnya, dan (4) Merotasi kode akses shift kasir baru.
            </div>
          </section>

          {/* Form Tutup Buku Harian Manual Override */}
          <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Tutup Buku Manual (Tutup Lebih Awal / Override)
                </h3>
                <p className="text-xs text-neutral-500">
                  Pengurus dapat melakukan tutup buku manual sewaktu-waktu tanpa harus menunggu batas 24 jam.
                </p>
              </div>
            </div>

            <form onSubmit={handleTriggerDailyClosing} className="space-y-3 text-xs">
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Total Omzet Hari Ini:</span>
                  <strong className="text-neutral-900 text-xs">{formatRupiah(analytics.totalRevenue)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Jumlah Transaksi Selesai:</span>
                  <span className="text-neutral-900">{analytics.totalTransactions} Struk ({analytics.totalUnitsSold} unit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Kasir Area Dalam / Area Luar:</span>
                  <span className="text-neutral-900">{formatRupiah(analytics.insideRevenue)} / {formatRupiah(analytics.outsideRevenue)}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Catatan Tutup Buku (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Misal: Selisih kas fisik klop, QRIS terverifikasi bank, barang retur 1 pcs..."
                  className="w-full rounded-lg border border-neutral-300 p-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Tutup Buku Sekarang & Simpan ke Riwayat</span>
                </button>
              </div>
            </form>
          </section>

          {/* Riwayat Tutup Buku Terarsip (Tabel Lengkap) */}
          <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Riwayat Tutup Buku Terarsip ({closingHistory.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Daftar seluruh catatan buku harian yang telah ditutup dan disimpan ke riwayat.
                </p>
              </div>
              <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                Arsip Permanen
              </span>
            </div>

            {closingHistory.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                Belum ada arsip tutup buku harian. Tutup buku otomatis akan mengisi tabel ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal Buku</th>
                      <th className="py-2.5 px-3">Waktu Tutup</th>
                      <th className="py-2.5 px-3 font-mono text-right">Total Omzet</th>
                      <th className="py-2.5 px-3 text-right">Struk / Unit</th>
                      <th className="py-2.5 px-3">Area Dalam / Luar</th>
                      <th className="py-2.5 px-3">Petugas Kasir</th>
                      <th className="py-2.5 px-3">Eksekutor</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {closingHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                          {rec.businessDate}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 font-mono">
                          {new Date(rec.closedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-right">
                          {formatRupiah(rec.totalRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-700 font-mono">
                          {rec.totalTransactions} struk ({rec.totalItemsSold} unit)
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600">
                          {formatRupiah(rec.insideAreaRevenue)} / {formatRupiah(rec.outsideAreaRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 max-w-[150px] truncate" title={rec.cashierNamesInvolved.join(', ')}>
                          {rec.cashierNamesInvolved.length > 0 ? rec.cashierNamesInvolved.join(', ') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 font-medium">
                          {rec.closedByAdmin}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 max-w-[180px] truncate" title={rec.notes}>
                          {rec.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* MENU 5: PENGATURAN QRIS KOPERASI PAGE */}
      {activeTab === 'qris' && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs max-w-3xl">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              Pengaturan QRIS Koperasi Sekolah
            </h2>
            <p className="text-xs text-neutral-500">
              Kelola barcode QRIS resmi sekolah untuk pembayaran digital di meja kasir dan katalog pembeli.
            </p>
          </div>

          {qrisSuccessMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{qrisSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveQrisConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Nama Merchant QRIS <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={qrisAccount}
                onChange={(e) => setQrisAccount(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">NMID Merchant (National Merchant ID)</label>
              <input
                type="text"
                value={qrisNmid}
                onChange={(e) => setQrisNmid(e.target.value)}
                placeholder="ID1020039281729"
                className="w-full rounded-lg border border-neutral-300 p-2.5 font-mono text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>

            {/* QRIS Preview & Upload */}
            <div>
              <span className="block font-medium text-neutral-700 mb-1">Gambar Barcode QRIS</span>
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                  {qrisImage ? (
                    <img src={qrisImage} alt="Preview QRIS" className="h-full w-full object-contain" />
                  ) : (
                    <QrCode className="h-10 w-10 text-neutral-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-2xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File Gambar</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToDefaultQris}
                    className="block text-[11px] text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                  >
                    Kembalikan ke Template QRIS Default
                  </button>
                  <p className="text-[10px] text-neutral-400">
                    Mendukung PNG, JPEG, SVG. Perubahan langsung terupdate di seluruh terminal.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Panduan Pembayaran untuk Pembeli</label>
              <textarea
                rows={2}
                value={qrisInstructions}
                onChange={(e) => setQrisInstructions(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Pengaturan QRIS</span>
            </button>
          </form>
        </section>
      )}

      {/* MENU 6: LOG AUDIT KASIR PAGE */}
      {activeTab === 'logs' && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-bold text-neutral-900">
              Log Audit Aktivitas Sistem ({activityLogs.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Rekam jejak setiap aksi kasir dan pengelola secara kronologis.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3">Tindakan</th>
                  <th className="py-2.5 px-3">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activityLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50">
                    <td className="py-2.5 px-3 text-neutral-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 whitespace-nowrap">
                      {log.actorName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-800">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEditedProduct}
            className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Edit Produk: {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-neutral-600 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Harga Modal (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.costPrice}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Stok Fisik</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stock: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Batas Minimum</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.minStock}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-neutral-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-neutral-600 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingProduct.description ?? ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 p-2 text-neutral-900"
                />
              </div>

              {/* Product Photo / Image Editor */}
              <div className="sm:col-span-2 border-t border-neutral-100 pt-3">
                <label className="block text-neutral-700 font-semibold mb-1.5">Foto / Gambar Produk</label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center p-0.5">
                    {editingProduct.imageUrl ? (
                      <img
                        src={editingProduct.imageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-neutral-300" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                        <Upload className="h-3.5 w-3.5 text-neutral-500" />
                        <span>Ganti Gambar (Upload)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditProductImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultSvg = createProductSvgDataUri(
                            editingProduct.name,
                            editingProduct.category,
                            editingProduct.sku
                          );
                          setEditingProduct({ ...editingProduct, imageUrl: defaultSvg });
                        }}
                        className="text-[11px] text-neutral-500 hover:text-neutral-800 underline"
                      >
                        Reset ke Ikon Default
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingProduct.imageUrl}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                      }
                      placeholder="Atau masukkan tautan URL gambar (https://...)"
                      className="w-full rounded border border-neutral-300 px-2 py-1 text-[11px] text-neutral-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction Correction Modal */}
      {correctingTxId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900">Konfirmasi Koreksi Transaksi</h3>
            <p className="text-xs text-neutral-500">
              Koreksi ini akan mengembalikan stok barang ke inventaris dan menandai struk sebagai telah dikoreksi.
            </p>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Alasan Koreksi</label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2 text-xs text-neutral-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectingTxId(null)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCorrection}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Terapkan Koreksi & Kembalikan Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
