import type {
  CartItem,
  CashierArea,
  DailyClosingRecord,
  EcomartDatabaseState,
  Product,
  ProductCategory,
  TransactionRecord,
} from '../types.ts';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Minuman',
  'Makanan',
  'Makanan Stok Terbatas',
  'Jasa Print',
  'ATK',
  'Atribut Seragam',
];

/**
 * Generates deterministic daily shift access codes for the two Ecomart cashier terminals
 * (Kasir Area Dalam & Kasir Area Luar) based on the business date and an optional seed suffix.
 */
export function generateDailyShiftCodes(businessDate: string, rotationCounter = 0): {
  date: string;
  insideCode: string;
  outsideCode: string;
} {
  const clean = businessDate.replace(/[^0-9]/g, '');
  const baseNum = Number(clean.slice(-4) || '1015') + rotationCounter * 37;
  const insideNum = ((baseNum * 7 + 131) % 9000) + 1000;
  const outsideNum = ((baseNum * 11 + 257) % 9000) + 1000;
  return {
    date: businessDate,
    insideCode: `DLM-${insideNum}`,
    outsideCode: `LUR-${outsideNum}`,
  };
}

/**
 * Calculates subtotal, total items, change, and validates whether cash is sufficient.
 */
export function calculateCheckoutSummary(items: CartItem[], cashReceived: number): {
  totalQuantity: number;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  isCashSufficient: boolean;
  shortfallAmount: number;
} {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const changeAmount = cashReceived >= totalAmount ? cashReceived - totalAmount : 0;
  const shortfallAmount = cashReceived < totalAmount ? totalAmount - cashReceived : 0;

  return {
    totalQuantity,
    totalAmount,
    cashReceived,
    changeAmount,
    isCashSufficient: items.length > 0 && cashReceived >= totalAmount,
    shortfallAmount,
  };
}

/**
 * Validates that every item in the cart has sufficient stock in the current product catalog.
 */
export function validateStockAvailability(
  items: CartItem[],
  products: Product[]
): { valid: boolean; error?: string } {
  if (items.length === 0) {
    return { valid: false, error: 'Keranjang belanja masih kosong.' };
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      return { valid: false, error: `Jumlah untuk ${item.name} harus lebih dari 0.` };
    }
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { valid: false, error: `Produk ${item.name} tidak ditemukan di database.` };
    }
    if (product.stock < item.quantity) {
      return {
        valid: false,
        error: `Stok ${product.name} tidak mencukupi (Sisa: ${product.stock} ${product.unit}, Diminta: ${item.quantity}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Applies a transaction to the product list, deducting stock and incrementing totalSoldAllTime.
 */
export function applyTransactionToProducts(
  products: Product[],
  items: CartItem[],
  timestampIso: string
): Product[] {
  const itemMap = new Map<string, number>();
  for (const item of items) {
    itemMap.set(item.productId, (itemMap.get(item.productId) ?? 0) + item.quantity);
  }

  return products.map((product) => {
    const qtySold = itemMap.get(product.id);
    if (!qtySold) return product;
    return {
      ...product,
      stock: Math.max(0, product.stock - qtySold),
      totalSoldAllTime: product.totalSoldAllTime + qtySold,
      lastSoldAt: timestampIso,
      updatedAt: timestampIso,
    };
  });
}

export interface ProductAnalyticsItem {
  product: Product;
  periodUnitsSold: number;
  periodRevenue: number;
  periodProfit: number;
  daysSinceLastSale: number | null;
  stockVelocityRatio: number; // sold / (sold + currentStock)
  isDeadstock: boolean;
  deadstockReason?: string;
}

/**
 * Computes product performance analytics, separating best-selling items and deadstock items.
 * Deadstock criteria:
 * - Has stock > 0 AND (never sold OR daysSinceLastSale >= 7 OR periodUnitsSold === 0 with high stock >= 15)
 * - Excludes 'Jasa Print' service items from physical deadstock warning unless stock === 0.
 */
export function computeBusinessAnalytics(
  products: Product[],
  transactions: TransactionRecord[],
  referenceDateIso: string,
  periodDays: 1 | 7 | 30 | 365 = 30
): {
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  totalUnitsSold: number;
  insideRevenue: number;
  outsideRevenue: number;
  bestSellers: ProductAnalyticsItem[];
  deadstockProducts: ProductAnalyticsItem[];
  lowStockProducts: Product[];
  categoryBreakdown: { category: ProductCategory; revenue: number; units: number }[];
} {
  const refTime = new Date(referenceDateIso).getTime();
  const cutoffTime = refTime - periodDays * 24 * 60 * 60 * 1000;

  const activeTransactions = transactions.filter((tx) => {
    if (tx.status === 'Dikoreksi') return false;
    const txTime = new Date(tx.createdAt).getTime();
    if (periodDays === 1) {
      return tx.businessDate === referenceDateIso.slice(0, 10);
    }
    return txTime >= cutoffTime && txTime <= refTime + 86400000;
  });

  const soldByProduct = new Map<string, { units: number; revenue: number }>();
  const categoryStats = new Map<ProductCategory, { revenue: number; units: number }>();
  for (const cat of PRODUCT_CATEGORIES) {
    categoryStats.set(cat, { revenue: 0, units: 0 });
  }

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let insideRevenue = 0;
  let outsideRevenue = 0;

  for (const tx of activeTransactions) {
    totalRevenue += tx.totalAmount;
    if (tx.cashierAccount === 'Kasir Area Dalam') {
      insideRevenue += tx.totalAmount;
    } else {
      outsideRevenue += tx.totalAmount;
    }

    for (const item of tx.items) {
      totalUnitsSold += item.quantity;
      const prev = soldByProduct.get(item.productId) ?? { units: 0, revenue: 0 };
      soldByProduct.set(item.productId, {
        units: prev.units + item.quantity,
        revenue: prev.revenue + item.price * item.quantity,
      });

      const catStat = categoryStats.get(item.category) ?? { revenue: 0, units: 0 };
      categoryStats.set(item.category, {
        revenue: catStat.revenue + item.price * item.quantity,
        units: catStat.units + item.quantity,
      });
    }
  }

  let totalProfit = 0;
  const analyzedProducts: ProductAnalyticsItem[] = products.map((product) => {
    const stat = soldByProduct.get(product.id) ?? { units: 0, revenue: 0 };
    const unitMargin = Math.max(0, product.price - product.costPrice);
    const periodProfit = stat.units * unitMargin;
    totalProfit += periodProfit;

    let daysSinceLastSale: number | null = null;
    if (product.lastSoldAt) {
      const diffMs = Math.max(0, refTime - new Date(product.lastSoldAt).getTime());
      daysSinceLastSale = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    const totalPool = stat.units + product.stock;
    const stockVelocityRatio = totalPool > 0 ? stat.units / totalPool : 0;

    let isDeadstock = false;
    let deadstockReason: string | undefined;

    if (product.category !== 'Jasa Print' && product.stock > 0) {
      if (product.totalSoldAllTime <= 2 && product.stock >= 15) {
        isDeadstock = true;
        deadstockReason = `Terjual hanya ${product.totalSoldAllTime} ${product.unit} sementara stok menumpuk (${product.stock} ${product.unit}).`;
      } else if (daysSinceLastSale !== null && daysSinceLastSale >= 10) {
        isDeadstock = true;
        deadstockReason = `Tidak ada penjualan selama ${daysSinceLastSale} hari terakhir (Stok mengendap: ${product.stock} ${product.unit}).`;
      } else if (product.lastSoldAt === null && product.stock >= 10) {
        isDeadstock = true;
        deadstockReason = `Belum pernah terjual sejak stok masuk (${product.stock} ${product.unit}).`;
      }
    }

    return {
      product,
      periodUnitsSold: stat.units,
      periodRevenue: stat.revenue,
      periodProfit,
      daysSinceLastSale,
      stockVelocityRatio,
      isDeadstock,
      deadstockReason,
    };
  });

  const bestSellers = [...analyzedProducts]
    .filter((item) => item.periodUnitsSold > 0 || item.product.totalSoldAllTime > 0)
    .sort((a, b) => {
      if (b.periodUnitsSold !== a.periodUnitsSold) {
        return b.periodUnitsSold - a.periodUnitsSold;
      }
      return b.product.totalSoldAllTime - a.product.totalSoldAllTime;
    });

  const deadstockProducts = analyzedProducts
    .filter((item) => item.isDeadstock)
    .sort((a, b) => b.product.stock - a.product.stock);

  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock);

  const categoryBreakdown = PRODUCT_CATEGORIES.map((category) => ({
    category,
    revenue: categoryStats.get(category)?.revenue ?? 0,
    units: categoryStats.get(category)?.units ?? 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalProfit,
    totalTransactions: activeTransactions.length,
    totalUnitsSold,
    insideRevenue,
    outsideRevenue,
    bestSellers,
    deadstockProducts,
    lowStockProducts,
    categoryBreakdown,
  };
}

/**
 * Advances a YYYY-MM-DD date string by 1 day for Tutup Buku Harian (End-of-Day Closing).
 */
export function getNextBusinessDate(currentDateStr: string): string {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

/**
 * Performs Tutup Buku Harian (End-of-Day Book Closing):
 * - Summarizes all active transactions for `state.currentBusinessDate`
 * - Creates a `DailyClosingRecord`
 * - Advances `currentBusinessDate` to tomorrow so daily counters reset cleanly for the next day
 * - Rotates the daily cashier access codes (`DLM-xxxx` & `LUR-xxxx`) for tomorrow's shift
 * - Logs out active cashier shifts so tomorrow's cashiers verify with the new daily code
 */
export function executeDailyBookClosing(
  state: EcomartDatabaseState,
  adminName: string,
  notes: string,
  closedAtIso: string
): {
  nextState: EcomartDatabaseState;
  closingRecord: DailyClosingRecord;
} {
  const todayTx = state.transactions.filter(
    (tx) => tx.businessDate === state.currentBusinessDate && tx.status === 'Selesai'
  );

  let totalRevenue = 0;
  let totalItemsSold = 0;
  let insideAreaRevenue = 0;
  let outsideAreaRevenue = 0;
  const cashierSet = new Set<string>();

  for (const tx of todayTx) {
    totalRevenue += tx.totalAmount;
    if (tx.cashierAccount === 'Kasir Area Dalam') {
      insideAreaRevenue += tx.totalAmount;
    } else {
      outsideAreaRevenue += tx.totalAmount;
    }
    cashierSet.add(`${tx.cashierName} (${tx.cashierAccount})`);
    for (const item of tx.items) {
      totalItemsSold += item.quantity;
    }
  }

  const lowStockCount = state.products.filter((p) => p.stock <= p.minStock).length;

  const closingRecord: DailyClosingRecord = {
    id: `CLS-${Date.now()}`,
    closedAt: closedAtIso,
    businessDate: state.currentBusinessDate,
    closedByAdmin: adminName,
    totalTransactions: todayTx.length,
    totalRevenue,
    totalItemsSold,
    insideAreaRevenue,
    outsideAreaRevenue,
    cashierNamesInvolved: Array.from(cashierSet),
    lowStockProductsCount: lowStockCount,
    notes: notes.trim() || 'Tutup buku reguler selesai. Siap restock untuk operasional besok.',
  };

  const nextDate = getNextBusinessDate(state.currentBusinessDate);
  const nextCodes = generateDailyShiftCodes(nextDate, state.closingHistory.length + 1);

  const nextState: EcomartDatabaseState = {
    ...state,
    currentBusinessDate: nextDate,
    lastClosingTimestamp: closedAtIso,
    dailyShiftCodes: nextCodes,
    storeStatus: {
      status: 'TUTUP',
      note: 'Toko koperasi tutup setelah pelaksanaan tutup buku harian. Menunggu pembukaan operasional oleh Kasir Area Dalam.',
      updatedAt: closedAtIso,
      updatedBy: adminName,
    },
    activeShifts: {
      inside: null,
      outside: null,
    },
    closingHistory: [closingRecord, ...state.closingHistory],
    activityLogs: [
      {
        id: `LOG-${Date.now()}`,
        timestamp: closedAtIso,
        actorRole: 'admin',
        actorName: adminName,
        actionType: 'TUTUP_BUKU',
        summary: `Tutup Buku Harian (${state.currentBusinessDate}) & Reset Buku ke ${nextDate}`,
        details: `Total ${todayTx.length} transaksi (Rp ${totalRevenue.toLocaleString('id-ID')}). Kode shift baru telah dirotasi untuk ${nextDate}.`,
      },
      ...state.activityLogs,
    ],
  };

  return { nextState, closingRecord };
}

/**
 * Determines whether the daily book closing should be executed automatically:
 * 1. If 24 hours (86,400,000 ms) have elapsed since the last closing timestamp.
 * 2. Or if the real-time calendar date (in YYYY-MM-DD format) is ahead of current business date.
 */
export function checkShouldAutoCloseBook(
  state: EcomartDatabaseState,
  realTimeNow: Date = new Date()
): boolean {
  // Calendar date check in local time YYYY-MM-DD
  const y = realTimeNow.getFullYear();
  const m = String(realTimeNow.getMonth() + 1).padStart(2, '0');
  const d = String(realTimeNow.getDate()).padStart(2, '0');
  const realDateStr = `${y}-${m}-${d}`;

  if (realDateStr > state.currentBusinessDate) {
    return true;
  }

  // 24-hour elapsed check
  if (state.lastClosingTimestamp) {
    const lastClosingTime = new Date(state.lastClosingTimestamp).getTime();
    if (!Number.isNaN(lastClosingTime)) {
      const elapsedMs = realTimeNow.getTime() - lastClosingTime;
      if (elapsedMs >= 24 * 60 * 60 * 1000) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns remaining milliseconds until the 24-hour cycle expires.
 */
export function getClosingCycleRemainingMs(
  state: EcomartDatabaseState,
  realTimeNow: Date = new Date()
): number {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  if (!state.lastClosingTimestamp) {
    return TWENTY_FOUR_HOURS;
  }
  const lastClosingTime = new Date(state.lastClosingTimestamp).getTime();
  if (Number.isNaN(lastClosingTime)) return TWENTY_FOUR_HOURS;

  const elapsed = realTimeNow.getTime() - lastClosingTime;
  const remaining = TWENTY_FOUR_HOURS - elapsed;
  return Math.max(0, remaining);
}

export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}
