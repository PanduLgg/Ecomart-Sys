import React, { useState, useEffect, useCallback } from 'react';
import type {
  ActiveShiftSession,
  CartItem,
  CashierArea,
  DailyClosingRecord,
  EcomartDatabaseState,
  Product,
  QrisPaymentConfig,
  StoreOperationalStatus,
  StoreStatusInfo,
  TransactionRecord,
  UserRole,
} from './types.ts';
import { createInitialDatabaseState } from './data/seedData.ts';
import {
  applyTransactionToProducts,
  calculateCheckoutSummary,
  checkShouldAutoCloseBook,
  executeDailyBookClosing,
  formatRupiah,
  generateDailyShiftCodes,
  validateStockAvailability,
} from './utils/billingLogic.ts';
import { BuyerCatalogView } from './components/BuyerCatalogView.tsx';
import { CashierPosView } from './components/CashierPosView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { RoleLoginModal } from './components/RoleLoginModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { StaffPortalLoginView } from './components/StaffPortalLoginView.tsx';
import { BuyerStorefrontFooter } from './components/BuyerStorefrontFooter.tsx';
import { Lock, LogOut, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { migrateProductImageIfNeeded } from './utils/productArtwork.ts';

const LOCAL_STORAGE_KEY = 'ecomart_billing_db_v1';

const normalizeDatabaseState = (state: EcomartDatabaseState): EcomartDatabaseState => {
  return {
    ...state,
    products: state.products.map(migrateProductImageIfNeeded),
  };
};

export default function App() {
  const [dbState, setDbState] = useState<EcomartDatabaseState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return normalizeDatabaseState(JSON.parse(saved) as EcomartDatabaseState);
      }
    } catch {
      // ignore local storage error
    }
    return normalizeDatabaseState(createInitialDatabaseState());
  });

  const SESSION_ROLE_KEY = 'ecomart_active_role';
  const SESSION_ADMIN_KEY = 'ecomart_admin_name';
  const SESSION_AREA_KEY = 'ecomart_cashier_area';

  // Always default strictly to buyer ('pembeli') when website is opened.
  // The app will ALWAYS open the Buyer Product Catalog first.
  const [activeRole, setActiveRole] = useState<UserRole>('pembeli');
  const [isStaffLoginPage, setIsStaffLoginPage] = useState<boolean>(false);

  const [staffLoginInitialTab, setStaffLoginInitialTab] = useState<'kasir' | 'admin'>('kasir');
  const [activeCashierArea, setActiveCashierArea] = useState<CashierArea>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_AREA_KEY);
      if (saved === 'Kasir Area Dalam' || saved === 'Kasir Area Luar') return saved;
    } catch {
      // ignore
    }
    return 'Kasir Area Dalam';
  });
  const [adminSessionName, setAdminSessionName] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_ADMIN_KEY) || null;
    } catch {
      // ignore
    }
    return null;
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'kasir' | 'admin'>('kasir');
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [autoClosingNotice, setAutoClosingNotice] = useState<string | null>(null);

  // Sync from server on mount & poll every 4s for multi-terminal synchronization
  useEffect(() => {
    let mounted = true;
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) return;
        const data = (await res.json()) as EcomartDatabaseState;
        if (mounted && data && Array.isArray(data.products)) {
          const normalized = normalizeDatabaseState(data);
          setDbState(normalized);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // Fallback to local state if offline
      }
    };

    fetchServerState();
    const interval = window.setInterval(fetchServerState, 4000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as EcomartDatabaseState;
          setDbState(normalizeDatabaseState(parsed));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Synchronize URL hash and keyboard shortcut for discreet staff portal access
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.toLowerCase();
      if (
        hash === '#staff' ||
        hash === '#login' ||
        hash === '#portal' ||
        hash === '#kasir-login' ||
        hash === '#staff-login'
      ) {
        setIsStaffLoginPage(true);
        setStaffLoginInitialTab('kasir');
      } else if (
        hash === '#admin-portal' ||
        hash === '#portal-admin' ||
        hash === '#login-admin' ||
        hash === '#admin-login'
      ) {
        setIsStaffLoginPage(true);
        setStaffLoginInitialTab('admin');
      } else if (hash === '#kasir' || hash === '#pos' || hash === '#terminal') {
        const hasActiveShift = Boolean(dbState.activeShifts.inside || dbState.activeShifts.outside);
        if (hasActiveShift) {
          setIsStaffLoginPage(false);
          setActiveRole('kasir');
        } else {
          try {
            window.location.hash = '';
          } catch {
            // ignore
          }
          setIsStaffLoginPage(false);
          setActiveRole('pembeli');
        }
      } else if (hash === '#admin-panel' || hash === '#admin') {
        if (adminSessionName) {
          setIsStaffLoginPage(false);
          setActiveRole('admin');
        } else {
          try {
            window.location.hash = '';
          } catch {
            // ignore
          }
          setIsStaffLoginPage(false);
          setActiveRole('pembeli');
        }
      } else {
        setIsStaffLoginPage(false);
        setActiveRole('pembeli');
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);

    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setIsStaffLoginPage((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);

    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeRole, isStaffLoginPage]);

  const commitDatabaseState = useCallback((updater: (prev: EcomartDatabaseState) => EcomartDatabaseState) => {
    setDbState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {
        // offline fallback handled via localStorage
      });
      return next;
    });
  }, []);

  // Real-time automatic 24-hour daily closing monitor
  useEffect(() => {
    const runAutoClosingCheck = () => {
      const now = new Date();
      if (checkShouldAutoCloseBook(dbState, now)) {
        const nowIso = now.toISOString();
        const { nextState, closingRecord } = executeDailyBookClosing(
          dbState,
          'Sistem Koperasi (Otomatis 24 Jam)',
          'Tutup buku harian otomatis oleh sistem EcoMart (Batas waktu 24 jam real-time terlampaui). Seluruh catatan transaksi dan keuangan berhasil diarsipkan ke riwayat.',
          nowIso
        );
        commitDatabaseState(() => nextState);
        setAutoClosingNotice(
          `Sistem telah mengeksekusi Tutup Buku Harian otomatis (siklus 24 jam). Pembukuan ${closingRecord.businessDate} telah diarsipkan ke riwayat dan buku baru (${nextState.currentBusinessDate}) telah aktif.`
        );
      }
    };

    runAutoClosingCheck();
    const timer = window.setInterval(runAutoClosingCheck, 30000);
    return () => window.clearInterval(timer);
  }, [dbState, commitDatabaseState]);

  // Current active shift for the selected cashier terminal (with graceful fallback to any active session)
  const currentCashierShift: ActiveShiftSession | null =
    (activeCashierArea === 'Kasir Area Dalam'
      ? dbState.activeShifts.inside
      : dbState.activeShifts.outside) ||
    dbState.activeShifts.inside ||
    dbState.activeShifts.outside ||
    null;

  const otherCashierShift: ActiveShiftSession | null =
    currentCashierShift?.area === 'Kasir Area Dalam'
      ? dbState.activeShifts.outside
      : dbState.activeShifts.inside;

  // Real-time store operational status (Buka / Istirahat / Tutup)
  const currentStoreStatus: StoreStatusInfo = dbState.storeStatus ?? {
    status: 'BUKA',
    note: '06.45 – 15.30 WIB (Senin – Jumat)',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Sistem Koperasi',
  };

  const handleUpdateStoreStatus = (status: StoreOperationalStatus, note?: string) => {
    // Hanya Kasir Area Dalam (Utama) atau Admin Koperasi yang memiliki hak akses mengubah status operasional toko
    if (activeRole === 'kasir' && currentCashierShift?.area !== 'Kasir Area Dalam') {
      console.warn('Hanya Kasir Area Dalam yang berwenang mengubah status operasional toko.');
      return;
    }

    const nowIso = new Date().toISOString();
    const actor = currentCashierShift?.cashierName || adminSessionName || 'Petugas Kasir Area Dalam';
    const statusLabels: Record<StoreOperationalStatus, string> = {
      BUKA: 'Buka',
      ISTIRAHAT: 'Istirahat',
      TUTUP: 'Tutup',
    };

    const defaultNotes: Record<StoreOperationalStatus, string> = {
      BUKA: '06.45 – 15.30 WIB (Senin – Jumat)',
      ISTIRAHAT: 'Sedang istirahat sejenak. Buka kembali jam 13.00 WIB.',
      TUTUP: 'Toko koperasi tutup. Buka kembali besok pagi jam 06.45 WIB.',
    };

    const cleanNote = note?.trim() || defaultNotes[status];

    commitDatabaseState((prev) => ({
      ...prev,
      storeStatus: {
        status,
        note: cleanNote,
        updatedAt: nowIso,
        updatedBy: actor,
      },
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: (activeRole === 'admin' ? 'admin' : 'kasir') as 'kasir' | 'admin',
          actorName: actor,
          cashierArea: currentCashierShift?.area,
          actionType: 'UPDATE_STORE_STATUS',
          summary: `Status Toko diubah menjadi ${statusLabels[status]} (${actor})`,
          details: `Status operasional disinkronkan ke pembeli: ${statusLabels[status]}. Catatan: "${cleanNote}".`,
        },
        ...prev.activityLogs,
      ],
    }));
  };

  // Handlers for Login & Shift Verification
  const handleLoginCashier = (
    area: CashierArea,
    cashierName: string,
    accessCode: string
  ): { success: boolean; error?: string } => {
    const cleanName = cashierName.trim();
    if (!cleanName) {
      return { success: false, error: 'Nama petugas kasir wajib diisi.' };
    }
    const expectedCode =
      area === 'Kasir Area Dalam'
        ? dbState.dailyShiftCodes.insideCode
        : dbState.dailyShiftCodes.outsideCode;

    if (accessCode.trim().toUpperCase() !== expectedCode.toUpperCase()) {
      return {
        success: false,
        error: `Kode akses harian tidak sesuai untuk ${area}. Gunakan kode hari ini (${expectedCode}).`,
      };
    }

    const nowIso = new Date().toISOString();
    const newSession: ActiveShiftSession = {
      area,
      cashierName: cleanName,
      loginAt: nowIso,
      shiftCode: expectedCode,
      isActive: true,
    };

    commitDatabaseState((prev) => ({
      ...prev,
      activeShifts: {
        ...prev.activeShifts,
        [area === 'Kasir Area Dalam' ? 'inside' : 'outside']: newSession,
      },
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'kasir',
          actorName: cleanName,
          cashierArea: area,
          actionType: 'LOGIN_SHIFT',
          summary: `Login Shift ${area} oleh ${cleanName}`,
          details: `Kode akses harian ${expectedCode} diverifikasi pada tanggal buku ${prev.currentBusinessDate}.`,
        },
        ...prev.activityLogs,
      ],
    }));

    setActiveCashierArea(area);
    setIsStaffLoginPage(false);
    setActiveRole('kasir');
    try {
      sessionStorage.setItem(SESSION_ROLE_KEY, 'kasir');
      sessionStorage.setItem(SESSION_AREA_KEY, area);
      window.location.hash = 'kasir';
    } catch {
      // ignore
    }
    return { success: true };
  };

  const handleLogoutShift = () => {
    if (!currentCashierShift) return;
    const nowIso = new Date().toISOString();
    const areaKey = activeCashierArea === 'Kasir Area Dalam' ? 'inside' : 'outside';

    commitDatabaseState((prev) => ({
      ...prev,
      activeShifts: {
        ...prev.activeShifts,
        [areaKey]: null,
      },
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'kasir',
          actorName: currentCashierShift.cashierName,
          cashierArea: currentCashierShift.area,
          actionType: 'LOGOUT_SHIFT',
          summary: `Logout Shift ${currentCashierShift.area} (${currentCashierShift.cashierName})`,
          details: `Sesi kasir ditutup oleh ${currentCashierShift.cashierName}.`,
        },
        ...prev.activityLogs,
      ],
    }));

    setActiveRole('pembeli');
    setIsStaffLoginPage(false);
    try {
      sessionStorage.setItem(SESSION_ROLE_KEY, 'pembeli');
      window.location.hash = '';
    } catch {
      // ignore
    }
  };

  const handleHandoverShift = (payload: {
    newCashierName: string;
    accessCode: string;
    handoverNotes: string;
  }): { success: boolean; error?: string } => {
    if (!currentCashierShift) {
      return { success: false, error: 'Tidak ada sesi kasir aktif untuk diserahterimakan.' };
    }

    const cleanNewName = payload.newCashierName.trim();
    if (!cleanNewName) {
      return { success: false, error: 'Nama kasir pengganti wajib diisi.' };
    }

    const expectedCode =
      activeCashierArea === 'Kasir Area Dalam'
        ? dbState.dailyShiftCodes.insideCode
        : dbState.dailyShiftCodes.outsideCode;

    if (payload.accessCode.trim().toUpperCase() !== expectedCode.toUpperCase()) {
      return { success: false, error: `Kode akses shift harian tidak valid untuk ${activeCashierArea}.` };
    }

    const nowIso = new Date().toISOString();
    const areaKey = activeCashierArea === 'Kasir Area Dalam' ? 'inside' : 'outside';
    const oldCashier = currentCashierShift.cashierName;

    const updatedSession: ActiveShiftSession = {
      area: activeCashierArea,
      cashierName: cleanNewName,
      loginAt: nowIso,
      shiftCode: expectedCode,
      isActive: true,
      previousCashierName: oldCashier,
      handoverAt: nowIso,
      handoverNotes: payload.handoverNotes || undefined,
    };

    commitDatabaseState((prev) => ({
      ...prev,
      activeShifts: {
        ...prev.activeShifts,
        [areaKey]: updatedSession,
      },
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'kasir',
          actorName: cleanNewName,
          cashierArea: activeCashierArea,
          actionType: 'SERAH_TERIMA_SHIFT',
          summary: `Oper Shift ${activeCashierArea}: ${oldCashier} ➔ ${cleanNewName}`,
          details: `Verifikasi serah terima kasir berhasil. Petugas baru bertanggung jawab atas transaksi berikutnya. Catatan: ${
            payload.handoverNotes || 'Tidak ada catatan serah terima.'
          }`,
        },
        ...prev.activityLogs,
      ],
    }));

    return { success: true };
  };

  const handleLoginAdmin = (
    adminName: string,
    password: string
  ): { success: boolean; error?: string } => {
    if (password.trim() !== 'ADMIN-ECO' && password.trim() !== 'admin123') {
      return {
        success: false,
        error: 'Kode otorisasi Admin tidak valid. Gunakan ADMIN-ECO.',
      };
    }
    const cleanAdmin = adminName.trim() || 'Admin Koperasi';
    const nowIso = new Date().toISOString();
    setAdminSessionName(cleanAdmin);
    setIsStaffLoginPage(false);
    setActiveRole('admin');
    try {
      sessionStorage.setItem(SESSION_ROLE_KEY, 'admin');
      sessionStorage.setItem(SESSION_ADMIN_KEY, cleanAdmin);
      window.location.hash = 'admin-panel';
    } catch {
      // ignore
    }

    commitDatabaseState((prev) => ({
      ...prev,
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'admin',
          actorName: cleanAdmin,
          actionType: 'LOGIN_SHIFT' as any,
          summary: `Login Admin Koperasi (${cleanAdmin})`,
          details: `Pengurus ${cleanAdmin} masuk ke panel manajemen koperasi.`,
        },
        ...prev.activityLogs,
      ],
    }));

    return { success: true };
  };

  const handleLogoutAdmin = () => {
    const actor = adminSessionName ?? 'Admin Koperasi';
    const nowIso = new Date().toISOString();
    commitDatabaseState((prev) => ({
      ...prev,
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'admin',
          actorName: actor,
          actionType: 'LOGOUT_SHIFT' as any,
          summary: `Keluar Sesi Admin Koperasi (${actor})`,
          details: `Admin ${actor} keluar dari panel manajemen koperasi.`,
        },
        ...prev.activityLogs,
      ],
    }));
    setAdminSessionName(null);
    setActiveRole('pembeli');
    setIsStaffLoginPage(false);
    try {
      sessionStorage.setItem(SESSION_ROLE_KEY, 'pembeli');
      sessionStorage.removeItem(SESSION_ADMIN_KEY);
      window.location.hash = '';
    } catch {
      // ignore
    }
  };

  // Process POS Transaction
  const handleProcessTransaction = (payload: {
    items: CartItem[];
    cashReceived: number;
    paymentMethod: 'Tunai' | 'QRIS Koperasi';
    buyerLabel: string;
  }): { success: boolean; error?: string; transaction?: TransactionRecord } => {
    if (!currentCashierShift) {
      return {
        success: false,
        error: 'Sesi shift kasir belum aktif. Silakan login shift terlebih dahulu.',
      };
    }

    const stockCheck = validateStockAvailability(payload.items, dbState.products);
    if (!stockCheck.valid) {
      return { success: false, error: stockCheck.error };
    }

    const summary = calculateCheckoutSummary(payload.items, payload.cashReceived);
    if (!summary.isCashSufficient) {
      return {
        success: false,
        error: `Uang tunai kurang ${formatRupiah(summary.shortfallAmount)}.`,
      };
    }

    const nowIso = new Date().toISOString();
    const dateCompact = dbState.currentBusinessDate.replace(/-/g, '');
    const seq = String(dbState.transactions.length + 1).padStart(3, '0');
    const newTx: TransactionRecord = {
      id: `TRX-${dateCompact}-${seq}-${Date.now().toString().slice(-3)}`,
      invoiceNumber: `INV/${dateCompact}/${seq}`,
      createdAt: nowIso,
      businessDate: dbState.currentBusinessDate,
      cashierAccount: currentCashierShift.area,
      cashierName: currentCashierShift.cashierName,
      shiftCodeUsed: currentCashierShift.shiftCode,
      buyerLabel: payload.buyerLabel || undefined,
      items: payload.items,
      totalAmount: summary.totalAmount,
      cashReceived: summary.cashReceived,
      changeAmount: summary.changeAmount,
      paymentMethod: payload.paymentMethod,
      status: 'Selesai',
    };

    const itemsSummaryText = payload.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', ');

    commitDatabaseState((prev) => ({
      ...prev,
      products: applyTransactionToProducts(prev.products, payload.items, nowIso),
      transactions: [newTx, ...prev.transactions],
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'kasir',
          actorName: currentCashierShift.cashierName,
          cashierArea: currentCashierShift.area,
          actionType: 'TRANSAKSI_BARU',
          summary: `Input Penjualan ${newTx.invoiceNumber} — ${formatRupiah(newTx.totalAmount)}`,
          details: `${itemsSummaryText}. Bayar (${newTx.paymentMethod}): ${formatRupiah(
            newTx.cashReceived
          )}, Kembali: ${formatRupiah(newTx.changeAmount)}.`,
        },
        ...prev.activityLogs,
      ],
    }));

    return { success: true, transaction: newTx };
  };

  // Cashier adds audit/correction note
  const handleAddCorrectionNote = (transactionId: string, note: string) => {
    const nowIso = new Date().toISOString();
    const actor = currentCashierShift?.cashierName ?? 'Petugas Kasir';
    const area = currentCashierShift?.area;

    commitDatabaseState((prev) => {
      const targetTx = prev.transactions.find((t) => t.id === transactionId);
      return {
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, correctionNote: note } : tx
        ),
        activityLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'kasir',
            actorName: actor,
            cashierArea: area,
            actionType: 'KOREKSI_TRANSAKSI',
            summary: `Catatan Audit Struk ${targetTx?.invoiceNumber ?? transactionId}`,
            details: `Kasir ${actor} menambahkan catatan: "${note}"`,
          },
          ...prev.activityLogs,
        ],
      };
    });
  };

  // Admin Restock
  const handleRestockProduct = (productId: string, addedQty: number) => {
    if (addedQty <= 0) return;
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';

    commitDatabaseState((prev) => {
      const target = prev.products.find((p) => p.id === productId);
      if (!target) return prev;
      const nextStock = target.stock + addedQty;

      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId
            ? { ...p, stock: nextStock, updatedAt: nowIso }
            : p
        ),
        activityLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'admin',
            actorName: actor,
            actionType: 'RESTOCK_BARANG',
            summary: `Restock ${target.name} (+${addedQty} ${target.unit})`,
            details: `Stok berubah dari ${target.stock} menjadi ${nextStock} ${target.unit}.`,
          },
          ...prev.activityLogs,
        ],
      };
    });
  };

  // Admin Update Product
  const handleUpdateProduct = (updated: Product) => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';

    commitDatabaseState((prev) => {
      const old = prev.products.find((p) => p.id === updated.id);
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === updated.id ? { ...updated, updatedAt: nowIso } : p
        ),
        activityLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'admin',
            actorName: actor,
            actionType: 'EDIT_PRODUK',
            summary: `Edit Data Produk ${updated.name} (${updated.sku})`,
            details: `Harga: ${formatRupiah(old?.price ?? 0)} -> ${formatRupiah(
              updated.price
            )}, Stok: ${old?.stock ?? 0} -> ${updated.stock} ${updated.unit}.`,
          },
          ...prev.activityLogs,
        ],
      };
    });
  };

  // Admin Create Product
  const handleCreateProduct = (
    newProd: Omit<Product, 'id' | 'totalSoldAllTime' | 'lastSoldAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';
    const created: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      totalSoldAllTime: 0,
      lastSoldAt: null,
      updatedAt: nowIso,
    };

    commitDatabaseState((prev) => ({
      ...prev,
      products: [created, ...prev.products],
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'admin',
          actorName: actor,
          actionType: 'TAMBAH_PRODUK',
          summary: `Tambah Produk Baru: ${created.name} (${created.sku})`,
          details: `Kategori ${created.category}, Harga ${formatRupiah(
            created.price
          )}, Stok awal ${created.stock} ${created.unit}.`,
        },
        ...prev.activityLogs,
      ],
    }));
  };

  // Admin Void/Correct Transaction (Restores Stock)
  const handleVoidOrCorrectTransaction = (txId: string, reason: string) => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';

    commitDatabaseState((prev) => {
      const targetTx = prev.transactions.find((t) => t.id === txId);
      if (!targetTx || targetTx.status === 'Dikoreksi') return prev;

      const restoredProducts = prev.products.map((prod) => {
        const soldItem = targetTx.items.find((i) => i.productId === prod.id);
        if (!soldItem) return prod;
        return {
          ...prod,
          stock: prod.stock + soldItem.quantity,
          totalSoldAllTime: Math.max(0, prod.totalSoldAllTime - soldItem.quantity),
          updatedAt: nowIso,
        };
      });

      return {
        ...prev,
        products: restoredProducts,
        transactions: prev.transactions.map((t) =>
          t.id === txId
            ? { ...t, status: 'Dikoreksi', correctionNote: reason }
            : t
        ),
        activityLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'admin',
            actorName: actor,
            actionType: 'KOREKSI_TRANSAKSI',
            summary: `Koreksi/Pembatalan Struk ${targetTx.invoiceNumber}`,
            details: `${reason}. Stok barang telah dikembalikan ke database.`,
          },
          ...prev.activityLogs,
        ],
      };
    });
  };

  // Admin Rotate Daily Shift Codes
  const handleRotateShiftCodes = () => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';

    commitDatabaseState((prev) => {
      const seed = Math.floor(Math.random() * 90) + 1;
      const rotated = generateDailyShiftCodes(prev.currentBusinessDate, seed);
      return {
        ...prev,
        dailyShiftCodes: rotated,
        activityLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: nowIso,
            actorRole: 'admin',
            actorName: actor,
            actionType: 'ROTASI_KODE_SHIFT',
            summary: `Rotasi Kode Shift Kasir (${prev.currentBusinessDate})`,
            details: `Kode baru Area Dalam: ${rotated.insideCode}, Area Luar: ${rotated.outsideCode}.`,
          },
          ...prev.activityLogs,
        ],
      };
    });
  };

  // Admin Execute Tutup Buku Harian
  const handleExecuteDailyClosing = (notes: string): DailyClosingRecord => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';
    const { nextState, closingRecord } = executeDailyBookClosing(
      dbState,
      actor,
      notes,
      nowIso
    );
    commitDatabaseState(() => nextState);
    return closingRecord;
  };

  // Admin Update QRIS Config & Payment Instructions
  const handleUpdateQrisConfig = (newConfig: QrisPaymentConfig) => {
    const nowIso = new Date().toISOString();
    const actor = adminSessionName ?? 'Admin Koperasi';

    commitDatabaseState((prev) => ({
      ...prev,
      qrisConfig: {
        ...newConfig,
        updatedAt: nowIso,
        updatedBy: actor,
      },
      activityLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          actorRole: 'admin',
          actorName: actor,
          actionType: 'UPDATE_QRIS_CONFIG',
          summary: `Pembaruan QRIS & Instruksi: ${newConfig.accountName}`,
          details: `Admin ${actor} memperbarui gambar barcode QRIS dan teks panduan pembayaran untuk pelanggan kasir.`,
        },
        ...prev.activityLogs,
      ],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 w-full max-w-full overflow-x-hidden">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-6 border-b border-slate-200 bg-white px-3 py-2 sm:px-6 sm:py-3.5 lg:px-8 shadow-2xs w-full max-w-full">
        {/* Zone 1: Wordmark & Role Subtitle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {activeRole === 'pembeli' && !isStaffLoginPage ? (
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveRole('pembeli');
                setIsStaffLoginPage(false);
                try {
                  window.location.hash = '';
                } catch {
                  // ignore
                }
              }}
              className="flex items-center gap-2 group"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs group-hover:bg-emerald-800 transition-colors">
                E
              </div>
              <div className="leading-tight">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  EcoMart
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold hidden sm:block">
                  Official Online Store
                </span>
              </div>
            </a>
          ) : isStaffLoginPage ? (
            <button
              type="button"
              onClick={() => {
                setIsStaffLoginPage(false);
                setActiveRole('pembeli');
                try {
                  window.location.hash = '';
                } catch {
                  // ignore
                }
              }}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs group-hover:bg-emerald-800 transition-colors">
                E
              </div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                EcoMart
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs">
                E
              </div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                EcoMart
              </span>
            </div>
          )}

          {isStaffLoginPage ? (
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white">
              Portal Staf
            </span>
          ) : activeRole === 'kasir' ? (
            <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap">
              <span className="sm:hidden">Kasir</span>
              <span className="hidden sm:inline">POS Kasir</span>
            </span>
          ) : activeRole === 'admin' ? (
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap">
              <span className="sm:hidden">Admin</span>
              <span className="hidden sm:inline">Admin Koperasi</span>
            </span>
          ) : null}
        </div>

        {/* Zone 2: Contextual Navigation based on User State (Hidden on smaller screens to guarantee logout buttons never overflow) */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-medium text-slate-600 min-w-0 truncate">
          {isStaffLoginPage ? (
            <span className="text-xs font-semibold text-slate-700 truncate">
              Otentikasi Petugas Kasir & Panel Administrasi
            </span>
          ) : activeRole === 'pembeli' ? (
            <div className="flex items-center gap-3 truncate">
              <span className="font-semibold text-slate-800 truncate">
                EcoMart Official Store
              </span>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <span className="text-[11px] text-slate-500 truncate">
                Belanja Online Praktis & Siap Ambil di Toko
              </span>
            </div>
          ) : null}
        </div>

        {/* Zone 3: Actions depending on current view (shrink-0 ml-auto so it never gets pushed out) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          {isStaffLoginPage ? (
            <button
              type="button"
              onClick={() => {
                setIsStaffLoginPage(false);
                setActiveRole('pembeli');
                try {
                  window.location.hash = '';
                } catch {
                  // ignore
                }
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ke Toko Online</span>
              <span className="sm:hidden">Toko</span>
            </button>
          ) : activeRole === 'pembeli' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {currentStoreStatus.status === 'BUKA' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span className="hidden sm:inline text-emerald-800 font-semibold">Toko Buka (06.45 – 15.30 WIB)</span>
                    <span className="sm:hidden text-emerald-800 font-semibold">Buka</span>
                  </>
                ) : currentStoreStatus.status === 'ISTIRAHAT' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="hidden sm:inline text-amber-800 font-semibold">Sedang Istirahat</span>
                    <span className="sm:hidden text-amber-800 font-semibold">Istirahat</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-600" />
                    <span className="hidden sm:inline text-rose-800 font-semibold">Toko Tutup</span>
                    <span className="sm:hidden text-rose-800 font-semibold">Tutup</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStaffLoginPage(true);
                }}
                title="Portal Staf EcoMart"
                aria-label="Portal Staf EcoMart"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors shadow-2xs whitespace-nowrap"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-medium hidden sm:inline">Portal Staf</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Real-time 24-Hour Auto-Closing Notification Banner (Only for Staff / Kasir / Admin, never shown to Buyers) */}
      {autoClosingNotice && activeRole !== 'pembeli' && !isStaffLoginPage && (
        <aside
          role="alert"
          aria-live="polite"
          className="bg-emerald-800 text-white px-4 py-2.5 text-xs border-b border-emerald-900 shadow-sm"
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{autoClosingNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoClosingNotice(null)}
              className="text-emerald-200 hover:text-white p-1 rounded hover:bg-emerald-700/60 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">
        {isStaffLoginPage ? (
          <StaffPortalLoginView
            businessDate={dbState.currentBusinessDate}
            dailyShiftCodes={dbState.dailyShiftCodes}
            activeShifts={dbState.activeShifts}
            initialTab={staffLoginInitialTab}
            onBackToCatalog={() => {
              setIsStaffLoginPage(false);
              setActiveRole('pembeli');
              try {
                window.location.hash = '';
              } catch {
                // ignore
              }
            }}
            onLoginCashier={handleLoginCashier}
            onLoginAdmin={handleLoginAdmin}
          />
        ) : activeRole === 'kasir' && currentCashierShift ? (
          <CashierPosView
            products={dbState.products}
            transactions={dbState.transactions}
            businessDate={dbState.currentBusinessDate}
            currentShift={currentCashierShift}
            otherTerminalShift={otherCashierShift}
            qrisConfig={dbState.qrisConfig}
            storeStatus={currentStoreStatus}
            onUpdateStoreStatus={handleUpdateStoreStatus}
            onProcessTransaction={handleProcessTransaction}
            onAddCorrectionNote={handleAddCorrectionNote}
            onSwitchShiftOrTerminal={() => {
              setStaffLoginInitialTab('kasir');
              setIsStaffLoginPage(true);
            }}
            onHandoverShift={handleHandoverShift}
            onLogoutShift={handleLogoutShift}
            onInspectReceipt={(tx) => setActiveReceipt(tx)}
          />
        ) : activeRole === 'admin' && adminSessionName ? (
          <AdminDashboardView
            adminName={adminSessionName}
            businessDate={dbState.currentBusinessDate}
            lastClosingTimestamp={dbState.lastClosingTimestamp}
            dailyShiftCodes={dbState.dailyShiftCodes}
            activeShifts={dbState.activeShifts}
            products={dbState.products}
            transactions={dbState.transactions}
            activityLogs={dbState.activityLogs}
            closingHistory={dbState.closingHistory}
            qrisConfig={dbState.qrisConfig}
            onRestockProduct={handleRestockProduct}
            onUpdateProduct={handleUpdateProduct}
            onCreateProduct={handleCreateProduct}
            onVoidOrCorrectTransaction={handleVoidOrCorrectTransaction}
            onRotateShiftCodes={handleRotateShiftCodes}
            onExecuteDailyClosing={handleExecuteDailyClosing}
            onInspectReceipt={(tx) => setActiveReceipt(tx)}
            onUpdateQrisConfig={handleUpdateQrisConfig}
            onLogoutAdmin={handleLogoutAdmin}
          />
        ) : (
          <BuyerCatalogView
            products={dbState.products}
            businessDate={dbState.currentBusinessDate}
            activeShifts={dbState.activeShifts}
            storeStatus={currentStoreStatus}
          />
        )}
      </main>

      {/* Dynamic Footers: Dedicated E-Commerce Storefront Footer for Buyers vs Internal Operational Footer for Staff */}
      {activeRole === 'pembeli' && !isStaffLoginPage ? (
        <BuyerStorefrontFooter />
      ) : (
        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 sm:flex-row">
            <p className="font-medium text-slate-600">
              EcoMart — Sistem Kasir & Operasional Koperasi Sekolah
            </p>
            <p className="font-mono text-slate-400 text-[11px]">
              Tanggal Buku Aktif: {dbState.currentBusinessDate}
            </p>
          </div>
        </footer>
      )}

      {/* Optional quick modal fallback for cashier in-POS switches */}
      <RoleLoginModal
        isOpen={loginModalOpen}
        initialTab={loginModalTab}
        businessDate={dbState.currentBusinessDate}
        dailyShiftCodes={dbState.dailyShiftCodes}
        onClose={() => setLoginModalOpen(false)}
        onLoginCashier={handleLoginCashier}
        onLoginAdmin={handleLoginAdmin}
      />

      <ReceiptModal
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
}
