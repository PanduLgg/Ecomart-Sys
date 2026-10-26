import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Calculator,
  Plus,
  Minus,
  X,
  ArrowUpDown,
  Copy,
  Receipt,
  Check,
  Package,
  Info,
  Store,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type { Product, ProductCategory, ActiveShiftSession, StoreStatusInfo } from '../types.ts';
import { PRODUCT_CATEGORIES, formatRupiah } from '../utils/billingLogic.ts';
import { ProductDetailModal } from './ProductDetailModal.tsx';

interface BuyerCatalogViewProps {
  products: Product[];
  businessDate: string;
  activeShifts?: {
    inside: ActiveShiftSession | null;
    outside: ActiveShiftSession | null;
  };
  storeStatus?: StoreStatusInfo;
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';

export const BuyerCatalogView: React.FC<BuyerCatalogViewProps> = ({
  products,
  businessDate,
  storeStatus,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | ProductCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [simCart, setSimCart] = useState<Record<string, number>>({});
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [showOrderSummaryMode, setShowOrderSummaryMode] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const [addedToastProduct, setAddedToastProduct] = useState<string | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchesCat =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.description && product.description.toLowerCase().includes(q));
      const matchesStock = !onlyAvailable || product.stock > 0;
      return matchesCat && matchesQuery && matchesStock;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'id');
        case 'stock-desc':
          return b.stock - a.stock;
        case 'popular':
        default:
          return b.totalSoldAllTime - a.totalSoldAllTime;
      }
    });
  }, [products, selectedCategory, searchQuery, onlyAvailable, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: products.length };
    for (const cat of PRODUCT_CATEGORIES) {
      counts[cat] = products.filter((p) => p.category === cat).length;
    }
    return counts;
  }, [products]);

  const simItems = useMemo(() => {
    return Object.entries(simCart)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        if (!product || qty <= 0) return null;
        return { product, qty };
      })
      .filter((entry): entry is { product: Product; qty: number } => entry !== null);
  }, [simCart, products]);

  const simTotalItems = useMemo(() => {
    return simItems.reduce((sum, item) => sum + item.qty, 0);
  }, [simItems]);

  const simTotalAmount = useMemo(() => {
    return simItems.reduce((sum, entry) => sum + entry.product.price * entry.qty, 0);
  }, [simItems]);

  const handleAddSim = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.stock <= 0) return;
    setSimCart((prev) => {
      const current = prev[product.id] ?? 0;
      if (current >= product.stock) return prev;
      return { ...prev, [product.id]: current + 1 };
    });
    // Trigger clean CSS micro-transitions
    setLastAddedProductId(product.id);
    setIsCartBumping(true);
    setAddedToastProduct(product.name);
    setTimeout(() => setLastAddedProductId(null), 450);
    setTimeout(() => setIsCartBumping(false), 220);
    setTimeout(() => setAddedToastProduct(null), 1800);
  };

  const handleDecrementSim = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSimCart((prev) => {
      const current = prev[productId] ?? 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const handleUpdateFromModal = (product: Product, newQty: number) => {
    setSimCart((prev) => {
      const copy = { ...prev };
      if (newQty <= 0) {
        delete copy[product.id];
      } else {
        copy[product.id] = Math.min(product.stock, newQty);
      }
      return copy;
    });
    if (newQty > 0) {
      setLastAddedProductId(product.id);
      setIsCartBumping(true);
      setAddedToastProduct(product.name);
      setTimeout(() => setLastAddedProductId(null), 450);
      setTimeout(() => setIsCartBumping(false), 220);
      setTimeout(() => setAddedToastProduct(null), 1800);
    }
  };

  const handleCopyChecklist = () => {
    if (simItems.length === 0) return;
    const lines = [
      `RINCIAN KALKULASI BELANJA — ECOMART STORE`,
      `Tanggal: ${businessDate} · Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      `=========================================`,
      ...simItems.map(
        ({ product, qty }, i) =>
          `${i + 1}. ${product.name} [${qty} ${product.unit} x ${formatRupiah(product.price)}] = ${formatRupiah(product.price * qty)}`
      ),
      `=========================================`,
      `TOTAL UANG YANG HARUS DISIAPKAN: ${formatRupiah(simTotalAmount)} (${simTotalItems} item)`,
      `Catatan: Siapkan uang pas atau saldo QRIS sebelum datang ke kasir toko EcoMart.`,
      `Lokasi Pengambilan: Toko Fisik EcoMart (Gedung Koperasi Sekolah)`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
      {/* E-Commerce Official Store Hero Banner */}
      <section className="mb-6 rounded-xl border border-emerald-900 bg-emerald-800 p-5 sm:p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-700/80 border border-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Official Store
            </span>
            <p className="text-xs font-semibold text-emerald-200">
              EcoMart E-Commerce Platform
            </p>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pusat Belanja Online Kebutuhan Sekolah & Harian
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Dapatkan seragam resmi sekolah, buku pelajaran kurikulum merdeka, alat tulis kantor & sekolah, makanan ringan sehat, serta layanan print dokumen dengan ketersediaan stok fisik real-time.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/60 border border-emerald-700/60 px-2.5 py-1 text-[11px] text-emerald-100 font-medium">
              <Check className="h-3 w-3 text-emerald-300 shrink-0" />
              100% Produk Resmi Terjamin
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/60 border border-emerald-700/60 px-2.5 py-1 text-[11px] text-emerald-100 font-medium">
              <Check className="h-3 w-3 text-emerald-300 shrink-0" />
              Stok Terverifikasi Real-Time
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/60 border border-emerald-700/60 px-2.5 py-1 text-[11px] text-emerald-100 font-medium">
              <Check className="h-3 w-3 text-emerald-300 shrink-0" />
              Pembayaran QRIS & Tunai
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900/60 border border-emerald-700/60 px-2.5 py-1 text-[11px] text-emerald-100 font-medium">
              <Check className="h-3 w-3 text-emerald-300 shrink-0" />
              Pesan Online, Ambil di Toko
            </span>
          </div>
        </div>
      </section>

      {/* Jika Status Toko TUTUP: Pembeli TIDAK BISA melihat produk, hanya pemberitahuan bahwa toko tutup */}
      {storeStatus?.status === 'TUTUP' ? (
        <section
          data-testid="store-closed-notice-section"
          className="my-8 rounded-2xl border border-rose-200 bg-white p-6 sm:p-10 shadow-xs max-w-2xl mx-auto text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
            <Store className="h-8 w-8" />
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            <span>STATUS: TOKO KOPERASI SEDANG TUTUP</span>
          </div>

          <h2 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Toko Koperasi Sedang Tutup
          </h2>

          {/* Keterangan Kasir / Toko */}
          <div className="mt-3.5 rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-xs text-neutral-800 font-medium max-w-lg mx-auto text-left flex items-start gap-2.5">
            <Info className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                Pemberitahuan Petugas Kasir:
              </span>
              <p className="text-neutral-900 leading-relaxed font-semibold">
                &quot;{storeStatus.note || 'Toko koperasi telah tutup hari ini. Buka kembali besok pagi jam 06.45 WIB.'}&quot;
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-neutral-600 leading-relaxed max-w-lg mx-auto">
            Etalase jenis produk, rincian harga, serta ketersediaan stok fisik disembunyikan sementara selama toko berstatus tutup. Setelah status toko diubah menjadi <strong>Buka</strong> oleh petugas Kasir Area Dalam, etalase produk dan stok akan otomatis aktif kembali secara real-time.
          </p>

          {/* Operational Hours Information Box */}
          <div className="mt-6 border-t border-neutral-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 mb-1.5">
                <Clock className="h-4 w-4 text-neutral-600" />
                <span>Jadwal Operasional Koperasi:</span>
              </div>
              <ul className="text-[11px] text-neutral-600 space-y-1">
                <li>• Senin – Jumat: <strong>06.45 – 15.30 WIB</strong></li>
                <li>• Istirahat 1: <strong>09.30 – 10.00 WIB</strong></li>
                <li>• Istirahat 2 (Dhuhur): <strong>12.00 – 13.00 WIB</strong></li>
                <li>• Sabtu & Minggu: <strong>Libur Sekolah</strong></li>
              </ul>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 mb-1.5">
                <ShieldAlert className="h-4 w-4 text-neutral-600" />
                <span>Sinkronisasi Otomatis:</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Pembaruan status berjalan otomatis secara real-time. Begitu kasir mengaktifkan status <strong>Buka Toko</strong>, seluruh produk dan jumlah stok akan seketika ditampilkan di sini.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Banner Peringatan saat ISTIRAHAT */}
          {storeStatus?.status === 'ISTIRAHAT' && (
            <div
              data-testid="store-break-notice-banner"
              className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-2xs flex items-start gap-3"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800 shrink-0 mt-0.5 font-bold text-xs">
                !
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900 uppercase tracking-wide">
                    Toko Koperasi Sedang Istirahat
                  </span>
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    Layanan Ditunda Sementara
                  </span>
                </div>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  {storeStatus.note || 'Petugas kasir sedang istirahat sejenak. Anda tetap dapat meninjau jenis produk dan mengecek ketersediaan stok fisik.'}
                </p>
              </div>
            </div>
          )}

      {/* Toolbar: Search, Sort, Filter, and Shopping Cart Button */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-[61px] z-20 bg-slate-50/95 backdrop-blur-xs py-2 border-b border-neutral-200/80 pb-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari buku, seragam, minuman, ATK..."
            aria-label="Cari produk di katalog"
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: Sort, Stock Toggle & Shopping Cart Button */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-700 bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Urutkan produk"
              className="bg-transparent text-xs font-medium text-neutral-800 outline-none cursor-pointer"
            >
              <option value="popular">Terpopuler</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="name-asc">Nama A - Z</option>
              <option value="stock-desc">Stok Terbanyak</option>
            </select>
          </div>

          {/* In-Stock Toggle */}
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer select-none bg-white border border-neutral-300 rounded-lg px-3 py-1.5">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span>Stok Tersedia</span>
          </label>

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95 transition-all duration-150 shrink-0 cursor-pointer shadow-xs"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
            <span>Keranjang Belanja</span>
            {simTotalItems > 0 && (
              <span
                className={`rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold tabular-nums transition-transform duration-200 ${
                  isCartBumping ? 'animate-badge-pop' : ''
                }`}
              >
                {simTotalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Tabs: Clean Segmented / Button Navigation */}
      <div
        className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        role="tablist"
        aria-label="Filter Kategori"
      >
        {(['Semua', ...PRODUCT_CATEGORIES] as const).map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`ml-1.5 text-[11px] ${
                  active ? 'text-neutral-300' : 'text-neutral-400'
                }`}
              >
                ({categoryCounts[cat] ?? 0})
              </span>
            </button>
          );
        })}
      </div>

      {/* Responsive E-Commerce Product Grid */}
      <div>
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
            <h3 className="text-sm font-bold text-neutral-900">
              Produk Tidak Ditemukan
            </h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
              Tidak ada produk yang cocok dengan pencarian &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Semua');
                setSearchQuery('');
                setOnlyAvailable(false);
              }}
              className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          /* High-density grid: 2 cols on mobile, 3 on sm, 4 on md, 5 on lg, 6 on xl */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= product.minStock;
              const inSimQty = simCart[product.id] ?? 0;

              return (
                <div
                  key={product.id}
                  onClick={() => setDetailProduct(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailProduct(product);
                    }
                  }}
                  className={`group flex flex-col justify-between rounded-lg border bg-white overflow-hidden transition-all cursor-pointer ${
                    isOut
                      ? 'border-neutral-200 opacity-60 bg-neutral-50/50'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div>
                    {/* Product Image Header with Clean Tags */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />

                      {/* Non-overlapping Responsive Header Badges */}
                      <div className="absolute top-2 inset-x-2 flex items-start justify-between gap-1 pointer-events-none">
                        <span
                          className="rounded bg-white/95 backdrop-blur-xs border border-neutral-200/90 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-700 uppercase truncate max-w-[100px] sm:max-w-[120px] shadow-2xs"
                          title={product.category}
                        >
                          {product.category === 'Makanan Stok Terbatas' ? 'Makanan Terbatas' : product.category}
                        </span>

                        <div className="shrink-0">
                          {isOut ? (
                            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                              Sisa {product.stock}
                            </span>
                          ) : (
                            <span className="rounded bg-white/95 backdrop-blur-xs border border-neutral-200/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 shadow-2xs">
                              Stok {product.stock}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3">
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {product.sku}
                      </div>

                      <h3 className="mt-0.5 text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>

                      <div className="mt-1.5 text-xs sm:text-sm font-bold text-neutral-900 font-mono">
                        {formatRupiah(product.price)}
                        <span className="text-[10px] font-normal text-neutral-500 ml-0.5 font-sans">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Quick Add to Cart Stepper / Button */}
                  <div
                    className="p-3 pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {inSimQty > 0 ? (
                      <div
                        className={`flex w-full items-center justify-between rounded-lg border bg-neutral-50 p-1 transition-all duration-200 ease-out ${
                          lastAddedProductId === product.id
                            ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-300'
                            : 'border-neutral-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDecrementSim(product.id, e)}
                          aria-label={`Kurangi ${product.name}`}
                          className="rounded p-1 text-neutral-700 hover:bg-neutral-200 active:scale-90 transition-all duration-150 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className={`font-mono text-xs font-bold px-1 tabular-nums transition-transform duration-200 ${
                            lastAddedProductId === product.id
                              ? 'scale-110 text-emerald-800'
                              : 'text-neutral-900'
                          }`}
                        >
                          {inSimQty} {product.unit}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAddSim(product, e)}
                          disabled={inSimQty >= product.stock}
                          aria-label={`Tambah ${product.name}`}
                          className="rounded p-1 text-neutral-700 hover:bg-neutral-200 active:scale-90 disabled:opacity-30 transition-all duration-150 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={(e) => handleAddSim(product, e)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-2 text-xs font-semibold active:scale-95 transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs ${
                          lastAddedProductId === product.id
                            ? 'border-emerald-600 bg-emerald-700 text-white animate-btn-pop'
                            : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 hover:border-neutral-400'
                        }`}
                      >
                        {lastAddedProductId === product.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-white transition-transform duration-200" />
                            <span>Ditambahkan</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5 text-neutral-500 transition-colors" />
                            <span>{isOut ? 'Stok Habis' : '+ Keranjang'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar for shopping calculator total */}
      {simTotalItems > 0 && !isDrawerOpen && (
        <aside
          aria-label="Kalkulasi Total Uang Belanja"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-slide-up-subtle"
        >
          <div className="flex items-center justify-between rounded-xl bg-neutral-900 p-3 text-white shadow-xl border border-neutral-800 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="relative rounded-lg bg-neutral-800 p-2 text-white">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                <span
                  className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold tabular-nums transition-transform duration-200 ${
                    isCartBumping ? 'animate-badge-pop' : ''
                  }`}
                >
                  {simTotalItems}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium">Total Uang yang Harus Dibayar:</p>
                <p className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                  {formatRupiah(simTotalAmount)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 active:scale-95 transition-all duration-150 cursor-pointer shadow-xs whitespace-nowrap"
            >
              Lihat Keranjang
            </button>
          </div>
        </aside>
      )}

      {/* Clean micro-toast notification on add to cart */}
      {addedToastProduct && (
        <aside
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900/95 border border-slate-700 text-white px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-xs animate-toast-in">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[260px]">
              <strong className="text-white font-semibold">{addedToastProduct}</strong> masuk ke keranjang
            </span>
          </div>
        </aside>
      )}
        </>
      )}

      {/* Slide-over Drawer for Shopping Cart & Calculation */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-800">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Keranjang Belanja EcoMart
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Kalkulasi total uang yang harus dibayarkan saat membeli di kasir toko
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Tutup"
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs">
              <button
                type="button"
                onClick={() => setShowOrderSummaryMode(false)}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors cursor-pointer ${
                  !showOrderSummaryMode
                    ? 'border-neutral-900 text-neutral-900 bg-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Daftar Barang ({simTotalItems})
              </button>
              <button
                type="button"
                onClick={() => setShowOrderSummaryMode(true)}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors cursor-pointer ${
                  showOrderSummaryMode
                    ? 'border-neutral-900 text-neutral-900 bg-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Rincian Kalkulasi Pembayaran
              </button>
            </div>

            {/* Drawer Items */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-100">
              {simItems.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                  <p className="text-sm font-semibold text-neutral-700">
                    Keranjang Belanja Masih Kosong
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 max-w-xs mx-auto">
                    Pilih produk dari katalog toko dan klik &quot;+ Keranjang&quot; untuk mengalkulasi total uang yang harus dibayarkan saat membeli.
                  </p>
                </div>
              ) : showOrderSummaryMode ? (
                <div className="space-y-4 py-1">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 space-y-2.5 font-mono text-xs">
                    <div className="pb-1.5 border-b border-neutral-200 text-neutral-500 text-[11px] font-sans flex justify-between">
                      <span>Estimasi Tanggal Belanja:</span>
                      <strong className="text-neutral-900 font-mono">{businessDate}</strong>
                    </div>
                    {simItems.map(({ product, qty }, idx) => (
                      <div key={product.id} className="flex justify-between items-baseline py-1 border-b border-neutral-200 last:border-0">
                        <span className="text-neutral-900 truncate pr-2">
                          {idx + 1}. {product.name} ({qty} {product.unit})
                        </span>
                        <span className="text-neutral-700 font-bold tabular-nums shrink-0">
                          {formatRupiah(product.price * qty)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-neutral-300 flex justify-between font-bold text-sm text-neutral-900">
                      <span>TOTAL UANG YANG HARUS DIBAYAR:</span>
                      <span className="text-emerald-700 tabular-nums">{formatRupiah(simTotalAmount)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Info className="h-4 w-4 shrink-0 text-emerald-700" />
                      <span>Kalkulasi Pembayaran Mandiri (Tanpa Checkout)</span>
                    </p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Keranjang panel pembeli ini khusus untuk kalkulasi total uang yang harus disiapkan untuk membeli produk yang diinginkan. Tidak ada transaksi checkout online di sistem ini. Pembayaran fisik dilakukan langsung di meja kasir toko EcoMart (Tunai atau QRIS).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyChecklist}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white py-2 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all cursor-pointer"
                  >
                    {copiedChecklist ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Rincian Kalkulasi Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-neutral-500" />
                        <span>Salin Rincian Kalkulasi Belanja</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                simItems.map(({ product, qty }) => (
                  <div key={product.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          {formatRupiah(product.price)} / {product.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded border border-neutral-300 bg-white">
                        <button
                          type="button"
                          onClick={() => handleDecrementSim(product.id)}
                          aria-label={`Kurangi ${product.name}`}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 active:scale-90 transition-all rounded-l cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs font-bold px-2 text-neutral-900 min-w-[20px] text-center tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddSim(product)}
                          disabled={qty >= product.stock}
                          aria-label={`Tambah ${product.name}`}
                          className="p-1 text-neutral-600 hover:bg-neutral-100 active:scale-90 transition-all rounded-r disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <span className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
                          {formatRupiah(product.price * qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {simItems.length > 0 && (
              <div className="border-t border-neutral-200 bg-neutral-50 p-4 space-y-3">
                <div className="flex justify-between text-sm font-bold text-neutral-900">
                  <span>Total Uang yang Harus Dibayar:</span>
                  <span className="font-mono text-emerald-800 tabular-nums text-base">
                    {formatRupiah(simTotalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCart({})}
                    className="flex-1 rounded-lg border border-neutral-300 bg-white py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-98 cursor-pointer transition-all"
                  >
                    Kosongkan Keranjang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showOrderSummaryMode) {
                        setShowOrderSummaryMode(true);
                      } else {
                        setIsDrawerOpen(false);
                      }
                    }}
                    className="flex-1 rounded-lg bg-emerald-700 py-2 text-xs font-semibold text-white hover:bg-emerald-800 active:scale-98 cursor-pointer transition-all"
                  >
                    {showOrderSummaryMode ? 'Tutup Keranjang' : 'Rincian Kalkulasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simplified Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        currentSimQty={detailProduct ? simCart[detailProduct.id] ?? 0 : 0}
        isOpen={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        onUpdateSimQty={handleUpdateFromModal}
      />
    </div>
  );
};
