import { db } from './index.ts';
import {
  activityLogs,
  dailyClosings,
  products,
  systemSettings,
  transactions,
  users,
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import type {
  ActiveShiftSession,
  ActivityLog,
  CartItem,
  CashierArea,
  DailyClosingRecord,
  EcomartDatabaseState,
  Product,
  TransactionRecord,
} from '../types.ts';
import { createInitialDatabaseState } from '../data/seedData.ts';
import { migrateProductImageIfNeeded } from '../utils/productArtwork.ts';

export async function getDatabaseState(): Promise<EcomartDatabaseState> {
  try {
    // 1. Fetch system settings
    const settingsRows = await db.select().from(systemSettings);
    const settingsMap = new Map<string, string>();
    for (const row of settingsRows) {
      settingsMap.set(row.key, row.value);
    }

    // If settings are empty, initialize seed data directly into Cloud SQL
    if (!settingsMap.has('currentBusinessDate')) {
      console.log('Database empty, seeding initial data to Cloud SQL...');
      const seed = createInitialDatabaseState();
      await seedDatabase(seed);
      return seed;
    }

    // 2. Fetch products
    const productRows = await db.select().from(products);
    const mappedProducts: Product[] = productRows.map((p) =>
      migrateProductImageIfNeeded({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category as any,
        price: p.price,
        costPrice: p.costPrice,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        imageUrl: p.imageUrl,
        totalSoldAllTime: p.totalSoldAllTime,
        lastSoldAt: p.lastSoldAt,
        description: p.description ?? undefined,
        updatedAt: p.updatedAt,
      })
    );

    // 3. Fetch transactions
    const transactionRows = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));

    const mappedTransactions: TransactionRecord[] = transactionRows.map((t) => ({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      createdAt: t.createdAt,
      businessDate: t.businessDate,
      cashierAccount: t.cashierAccount as CashierArea,
      cashierName: t.cashierName,
      shiftCodeUsed: t.shiftCodeUsed,
      buyerLabel: t.buyerLabel ?? undefined,
      items: JSON.parse(t.itemsJson) as CartItem[],
      totalAmount: t.totalAmount,
      cashReceived: t.cashReceived,
      changeAmount: t.changeAmount,
      paymentMethod: t.paymentMethod as 'Tunai' | 'QRIS Koperasi',
      status: t.status as 'Selesai' | 'Dikoreksi',
      correctionNote: t.correctionNote ?? undefined,
    }));

    // 4. Fetch activity logs
    const logRows = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp));

    const mappedLogs: ActivityLog[] = logRows.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      actorRole: l.actorRole as 'kasir' | 'admin',
      actorName: l.actorName,
      cashierArea: (l.cashierArea as CashierArea) ?? undefined,
      actionType: l.actionType as any,
      summary: l.summary,
      details: l.details,
    }));

    // 5. Fetch daily closings
    const closingRows = await db
      .select()
      .from(dailyClosings)
      .orderBy(desc(dailyClosings.closedAt));

    const mappedClosings: DailyClosingRecord[] = closingRows.map((c) => ({
      id: c.id,
      closedAt: c.closedAt,
      businessDate: c.businessDate,
      closedByAdmin: c.closedByAdmin,
      totalTransactions: c.totalTransactions,
      totalRevenue: c.totalRevenue,
      totalItemsSold: c.totalItemsSold,
      insideAreaRevenue: c.insideAreaRevenue,
      outsideAreaRevenue: c.outsideAreaRevenue,
      cashierNamesInvolved: JSON.parse(c.cashierNamesInvolvedJson) as string[],
      lowStockProductsCount: c.lowStockProductsCount,
      notes: c.notes,
    }));

    const currentBusinessDate = settingsMap.get('currentBusinessDate') || '2026-10-15';
    const insideCode = settingsMap.get('insideCode') || 'DLM-8236';
    const outsideCode = settingsMap.get('outsideCode') || 'LUR-3422';

    let insideShift: ActiveShiftSession | null = null;
    if (settingsMap.has('activeShift_inside_name')) {
      insideShift = {
        area: 'Kasir Area Dalam',
        cashierName: settingsMap.get('activeShift_inside_name')!,
        loginAt: settingsMap.get('activeShift_inside_loginAt') || new Date().toISOString(),
        shiftCode: insideCode,
        isActive: true,
      };
    }

    let outsideShift: ActiveShiftSession | null = null;
    if (settingsMap.has('activeShift_outside_name')) {
      outsideShift = {
        area: 'Kasir Area Luar',
        cashierName: settingsMap.get('activeShift_outside_name')!,
        loginAt: settingsMap.get('activeShift_outside_loginAt') || new Date().toISOString(),
        shiftCode: outsideCode,
        isActive: true,
      };
    }

    const seedFallback = createInitialDatabaseState();
    let qrisConfig = seedFallback.qrisConfig;
    if (settingsMap.has('qrisConfigJson')) {
      try {
        qrisConfig = JSON.parse(settingsMap.get('qrisConfigJson')!);
      } catch (e) {
        console.error('Failed to parse qrisConfigJson:', e);
      }
    }

    let storeStatus = seedFallback.storeStatus;
    if (settingsMap.has('storeStatusJson')) {
      try {
        storeStatus = JSON.parse(settingsMap.get('storeStatusJson')!);
      } catch (e) {
        console.error('Failed to parse storeStatusJson:', e);
      }
    }

    const lastClosingTimestamp = settingsMap.get('lastClosingTimestamp') || undefined;

    return {
      currentBusinessDate,
      lastClosingTimestamp,
      dailyShiftCodes: {
        date: currentBusinessDate,
        insideCode,
        outsideCode,
      },
      storeStatus,
      activeShifts: {
        inside: insideShift,
        outside: outsideShift,
      },
      qrisConfig,
      products: mappedProducts,
      transactions: mappedTransactions,
      activityLogs: mappedLogs,
      closingHistory: mappedClosings,
    };
  } catch (error) {
    console.error('Error fetching state from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function seedDatabase(seed: EcomartDatabaseState): Promise<void> {
  try {
    // Insert products
    for (const p of seed.products) {
      await db
        .insert(products)
        .values({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          price: p.price,
          costPrice: p.costPrice,
          stock: p.stock,
          minStock: p.minStock,
          unit: p.unit,
          imageUrl: p.imageUrl,
          totalSoldAllTime: p.totalSoldAllTime,
          lastSoldAt: p.lastSoldAt,
          description: p.description ?? null,
          updatedAt: p.updatedAt,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            price: p.price,
            stock: p.stock,
            costPrice: p.costPrice,
            name: p.name,
            imageUrl: p.imageUrl,
            totalSoldAllTime: p.totalSoldAllTime,
            updatedAt: p.updatedAt,
          },
        });
    }

    // Insert transactions
    for (const t of seed.transactions) {
      await db
        .insert(transactions)
        .values({
          id: t.id,
          invoiceNumber: t.invoiceNumber,
          createdAt: t.createdAt,
          businessDate: t.businessDate,
          cashierAccount: t.cashierAccount,
          cashierName: t.cashierName,
          shiftCodeUsed: t.shiftCodeUsed,
          buyerLabel: t.buyerLabel ?? null,
          itemsJson: JSON.stringify(t.items),
          totalAmount: t.totalAmount,
          cashReceived: t.cashReceived,
          changeAmount: t.changeAmount,
          paymentMethod: t.paymentMethod,
          status: t.status,
          correctionNote: t.correctionNote ?? null,
        })
        .onConflictDoNothing();
    }

    // Insert activity logs
    for (const l of seed.activityLogs) {
      await db
        .insert(activityLogs)
        .values({
          id: l.id,
          timestamp: l.timestamp,
          actorRole: l.actorRole,
          actorName: l.actorName,
          cashierArea: l.cashierArea ?? null,
          actionType: l.actionType,
          summary: l.summary,
          details: l.details,
        })
        .onConflictDoNothing();
    }

    // Insert daily closings
    for (const c of seed.closingHistory) {
      await db
        .insert(dailyClosings)
        .values({
          id: c.id,
          closedAt: c.closedAt,
          businessDate: c.businessDate,
          closedByAdmin: c.closedByAdmin,
          totalTransactions: c.totalTransactions,
          totalRevenue: c.totalRevenue,
          totalItemsSold: c.totalItemsSold,
          insideAreaRevenue: c.insideAreaRevenue,
          outsideAreaRevenue: c.outsideAreaRevenue,
          cashierNamesInvolvedJson: JSON.stringify(c.cashierNamesInvolved),
          lowStockProductsCount: c.lowStockProductsCount,
          notes: c.notes,
        })
        .onConflictDoNothing();
    }

    // Save settings
    const settingsToSave = [
      { key: 'currentBusinessDate', value: seed.currentBusinessDate },
      { key: 'insideCode', value: seed.dailyShiftCodes.insideCode },
      { key: 'outsideCode', value: seed.dailyShiftCodes.outsideCode },
      { key: 'qrisConfigJson', value: JSON.stringify(seed.qrisConfig) },
      { key: 'lastClosingTimestamp', value: seed.lastClosingTimestamp || new Date().toISOString() },
      { key: 'storeStatusJson', value: JSON.stringify(seed.storeStatus || { status: 'BUKA', note: '06.45 – 15.30 WIB (Senin – Jumat)' }) },
    ];

    if (seed.activeShifts.inside) {
      settingsToSave.push(
        { key: 'activeShift_inside_name', value: seed.activeShifts.inside.cashierName },
        { key: 'activeShift_inside_loginAt', value: seed.activeShifts.inside.loginAt }
      );
    }
    if (seed.activeShifts.outside) {
      settingsToSave.push(
        { key: 'activeShift_outside_name', value: seed.activeShifts.outside.cashierName },
        { key: 'activeShift_outside_loginAt', value: seed.activeShifts.outside.loginAt }
      );
    }

    for (const s of settingsToSave) {
      await db
        .insert(systemSettings)
        .values(s)
        .onConflictDoUpdate({ target: systemSettings.key, set: { value: s.value } });
    }
  } catch (error) {
    console.error('Error seeding Cloud SQL:', error);
    throw new Error('Database seeding failed.', { cause: error });
  }
}

export async function saveEntireState(nextState: EcomartDatabaseState): Promise<void> {
  try {
    // 1. Update settings
    await db
      .insert(systemSettings)
      .values({ key: 'currentBusinessDate', value: nextState.currentBusinessDate })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: nextState.currentBusinessDate },
      });

    await db
      .insert(systemSettings)
      .values({ key: 'insideCode', value: nextState.dailyShiftCodes.insideCode })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: nextState.dailyShiftCodes.insideCode },
      });

    await db
      .insert(systemSettings)
      .values({ key: 'outsideCode', value: nextState.dailyShiftCodes.outsideCode })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: nextState.dailyShiftCodes.outsideCode },
      });

    if (nextState.lastClosingTimestamp) {
      await db
        .insert(systemSettings)
        .values({ key: 'lastClosingTimestamp', value: nextState.lastClosingTimestamp })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: nextState.lastClosingTimestamp },
        });
    }

    if (nextState.storeStatus) {
      await db
        .insert(systemSettings)
        .values({
          key: 'storeStatusJson',
          value: JSON.stringify(nextState.storeStatus),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: JSON.stringify(nextState.storeStatus) },
        });
    }

    if (nextState.qrisConfig) {
      await db
        .insert(systemSettings)
        .values({
          key: 'qrisConfigJson',
          value: JSON.stringify(nextState.qrisConfig),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: JSON.stringify(nextState.qrisConfig) },
        });
    }

    // Active shifts
    if (nextState.activeShifts.inside) {
      await db
        .insert(systemSettings)
        .values({
          key: 'activeShift_inside_name',
          value: nextState.activeShifts.inside.cashierName,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: nextState.activeShifts.inside.cashierName },
        });
      await db
        .insert(systemSettings)
        .values({
          key: 'activeShift_inside_loginAt',
          value: nextState.activeShifts.inside.loginAt,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: nextState.activeShifts.inside.loginAt },
        });
    } else {
      await db.delete(systemSettings).where(eq(systemSettings.key, 'activeShift_inside_name'));
      await db.delete(systemSettings).where(eq(systemSettings.key, 'activeShift_inside_loginAt'));
    }

    if (nextState.activeShifts.outside) {
      await db
        .insert(systemSettings)
        .values({
          key: 'activeShift_outside_name',
          value: nextState.activeShifts.outside.cashierName,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: nextState.activeShifts.outside.cashierName },
        });
      await db
        .insert(systemSettings)
        .values({
          key: 'activeShift_outside_loginAt',
          value: nextState.activeShifts.outside.loginAt,
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: nextState.activeShifts.outside.loginAt },
        });
    } else {
      await db.delete(systemSettings).where(eq(systemSettings.key, 'activeShift_outside_name'));
      await db.delete(systemSettings).where(eq(systemSettings.key, 'activeShift_outside_loginAt'));
    }

    // 2. Upsert products
    for (const p of nextState.products) {
      await db
        .insert(products)
        .values({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          price: p.price,
          costPrice: p.costPrice,
          stock: p.stock,
          minStock: p.minStock,
          unit: p.unit,
          imageUrl: p.imageUrl,
          totalSoldAllTime: p.totalSoldAllTime,
          lastSoldAt: p.lastSoldAt,
          description: p.description ?? null,
          updatedAt: p.updatedAt,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: p.name,
            category: p.category,
            price: p.price,
            costPrice: p.costPrice,
            stock: p.stock,
            minStock: p.minStock,
            unit: p.unit,
            imageUrl: p.imageUrl,
            totalSoldAllTime: p.totalSoldAllTime,
            lastSoldAt: p.lastSoldAt,
            description: p.description ?? null,
            updatedAt: p.updatedAt,
          },
        });
    }

    // 3. Upsert transactions
    for (const t of nextState.transactions) {
      await db
        .insert(transactions)
        .values({
          id: t.id,
          invoiceNumber: t.invoiceNumber,
          createdAt: t.createdAt,
          businessDate: t.businessDate,
          cashierAccount: t.cashierAccount,
          cashierName: t.cashierName,
          shiftCodeUsed: t.shiftCodeUsed,
          buyerLabel: t.buyerLabel ?? null,
          itemsJson: JSON.stringify(t.items),
          totalAmount: t.totalAmount,
          cashReceived: t.cashReceived,
          changeAmount: t.changeAmount,
          paymentMethod: t.paymentMethod,
          status: t.status,
          correctionNote: t.correctionNote ?? null,
        })
        .onConflictDoUpdate({
          target: transactions.id,
          set: {
            status: t.status,
            correctionNote: t.correctionNote ?? null,
          },
        });
    }

    // 4. Insert new activity logs
    for (const l of nextState.activityLogs) {
      await db
        .insert(activityLogs)
        .values({
          id: l.id,
          timestamp: l.timestamp,
          actorRole: l.actorRole,
          actorName: l.actorName,
          cashierArea: l.cashierArea ?? null,
          actionType: l.actionType,
          summary: l.summary,
          details: l.details,
        })
        .onConflictDoNothing();
    }

    // 5. Insert daily closings
    for (const c of nextState.closingHistory) {
      await db
        .insert(dailyClosings)
        .values({
          id: c.id,
          closedAt: c.closedAt,
          businessDate: c.businessDate,
          closedByAdmin: c.closedByAdmin,
          totalTransactions: c.totalTransactions,
          totalRevenue: c.totalRevenue,
          totalItemsSold: c.totalItemsSold,
          insideAreaRevenue: c.insideAreaRevenue,
          outsideAreaRevenue: c.outsideAreaRevenue,
          cashierNamesInvolvedJson: JSON.stringify(c.cashierNamesInvolved),
          lowStockProductsCount: c.lowStockProductsCount,
          notes: c.notes,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Error saving state to Cloud SQL:', error);
    throw new Error('Database write failed.', { cause: error });
  }
}
