export type ProductCategory =
  | 'Minuman'
  | 'Makanan'
  | 'Makanan Stok Terbatas'
  | 'Jasa Print'
  | 'ATK'
  | 'Atribut Seragam';

export type CashierArea = 'Kasir Area Dalam' | 'Kasir Area Luar';

export type UserRole = 'pembeli' | 'kasir' | 'admin';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string; // e.g., 'pcs', 'botol', 'porsi', 'lembar', 'set'
  imageUrl: string;
  totalSoldAllTime: number;
  lastSoldAt: string | null; // ISO timestamp or null if never sold
  updatedAt: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  quantity: number;
  unit: string;
  notes?: string; // e.g., "HVS A4 Hitam Putih 12 lbr"
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  createdAt: string; // ISO string
  businessDate: string; // YYYY-MM-DD of active book day
  cashierAccount: CashierArea;
  cashierName: string;
  shiftCodeUsed: string;
  buyerLabel?: string; // Optional e.g. "Siswa Kelas XI" or "Guru"
  items: CartItem[];
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  paymentMethod: 'Tunai' | 'QRIS Koperasi';
  status: 'Selesai' | 'Dikoreksi';
  correctionNote?: string;
}

export type ActivityType =
  | 'LOGIN_SHIFT'
  | 'LOGOUT_SHIFT'
  | 'SERAH_TERIMA_SHIFT'
  | 'TRANSAKSI_BARU'
  | 'KOREKSI_TRANSAKSI'
  | 'RESTOCK_BARANG'
  | 'EDIT_PRODUK'
  | 'TAMBAH_PRODUK'
  | 'TUTUP_BUKU'
  | 'ROTASI_KODE_SHIFT'
  | 'UPDATE_QRIS_CONFIG'
  | 'UPDATE_STORE_STATUS';

export type StoreOperationalStatus = 'BUKA' | 'ISTIRAHAT' | 'TUTUP';

export interface StoreStatusInfo {
  status: StoreOperationalStatus;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorRole: 'kasir' | 'admin';
  actorName: string;
  cashierArea?: CashierArea;
  actionType: ActivityType;
  summary: string;
  details: string;
}

export interface DailyClosingRecord {
  id: string;
  closedAt: string;
  businessDate: string;
  closedByAdmin: string;
  totalTransactions: number;
  totalRevenue: number;
  totalItemsSold: number;
  insideAreaRevenue: number;
  outsideAreaRevenue: number;
  cashierNamesInvolved: string[];
  lowStockProductsCount: number;
  notes: string;
}

export interface ActiveShiftSession {
  area: CashierArea;
  cashierName: string;
  loginAt: string;
  shiftCode: string;
  isActive: boolean;
  handoverNotes?: string;
  handoverAt?: string;
  previousCashierName?: string;
}

export interface QrisPaymentConfig {
  imageUrl: string;
  accountName: string;
  instructionText: string;
  merchantNmid?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EcomartDatabaseState {
  currentBusinessDate: string; // YYYY-MM-DD
  lastClosingTimestamp?: string; // ISO string of when last closing happened or date opened
  dailyShiftCodes: {
    date: string;
    insideCode: string; // Kode akses harian Kasir Area Dalam
    outsideCode: string; // Kode akses harian Kasir Area Luar
  };
  activeShifts: {
    inside: ActiveShiftSession | null;
    outside: ActiveShiftSession | null;
  };
  qrisConfig: QrisPaymentConfig;
  products: Product[];
  transactions: TransactionRecord[]; // Active open-book + historical transactions
  activityLogs: ActivityLog[];
  closingHistory: DailyClosingRecord[];
  storeStatus?: StoreStatusInfo;
}
