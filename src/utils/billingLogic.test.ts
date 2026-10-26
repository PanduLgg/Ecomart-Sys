import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTransactionToProducts,
  calculateCheckoutSummary,
  checkShouldAutoCloseBook,
  computeBusinessAnalytics,
  executeDailyBookClosing,
  generateDailyShiftCodes,
  getClosingCycleRemainingMs,
  getNextBusinessDate,
  validateStockAvailability,
} from './billingLogic.ts';
import type { EcomartDatabaseState, Product } from '../types.ts';

const sampleProducts: Product[] = [
  {
    id: 'p-1',
    sku: 'MIN-001',
    name: 'Teh Pucuk Harum 350ml',
    category: 'Minuman',
    price: 4000,
    costPrice: 3000,
    stock: 25,
    minStock: 10,
    unit: 'botol',
    imageUrl: '',
    totalSoldAllTime: 120,
    lastSoldAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: 'p-2',
    sku: 'ATK-099',
    name: 'Jangka Besi Joyko Set Lama',
    category: 'ATK',
    price: 18000,
    costPrice: 13000,
    stock: 22,
    minStock: 5,
    unit: 'set',
    imageUrl: '',
    totalSoldAllTime: 1,
    lastSoldAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-20T08:00:00.000Z',
  },
];

test('generateDailyShiftCodes creates distinct deterministic codes for Inside and Outside terminals', () => {
  const codes = generateDailyShiftCodes('2026-10-15');
  assert.equal(codes.date, '2026-10-15');
  assert.ok(codes.insideCode.startsWith('DLM-'));
  assert.ok(codes.outsideCode.startsWith('LUR-'));
  assert.notEqual(codes.insideCode, codes.outsideCode);
});

test('calculateCheckoutSummary computes total and change accurately', () => {
  const items = [
    {
      productId: 'p-1',
      sku: 'MIN-001',
      name: 'Teh Pucuk Harum 350ml',
      category: 'Minuman' as const,
      price: 4000,
      quantity: 3,
      unit: 'botol',
    },
  ];
  const summary = calculateCheckoutSummary(items, 20000);
  assert.equal(summary.totalQuantity, 3);
  assert.equal(summary.totalAmount, 12000);
  assert.equal(summary.changeAmount, 8000);
  assert.equal(summary.isCashSufficient, true);
  assert.equal(summary.shortfallAmount, 0);

  const insufficient = calculateCheckoutSummary(items, 10000);
  assert.equal(insufficient.isCashSufficient, false);
  assert.equal(insufficient.shortfallAmount, 2000);
});

test('validateStockAvailability blocks purchase exceeding stock and deducts properly on apply', () => {
  const failCheck = validateStockAvailability(
    [
      {
        productId: 'p-1',
        sku: 'MIN-001',
        name: 'Teh Pucuk Harum 350ml',
        category: 'Minuman',
        price: 4000,
        quantity: 30,
        unit: 'botol',
      },
    ],
    sampleProducts
  );
  assert.equal(failCheck.valid, false);

  const okCheck = validateStockAvailability(
    [
      {
        productId: 'p-1',
        sku: 'MIN-001',
        name: 'Teh Pucuk Harum 350ml',
        category: 'Minuman',
        price: 4000,
        quantity: 5,
        unit: 'botol',
      },
    ],
    sampleProducts
  );
  assert.equal(okCheck.valid, true);

  const updated = applyTransactionToProducts(
    sampleProducts,
    [
      {
        productId: 'p-1',
        sku: 'MIN-001',
        name: 'Teh Pucuk Harum 350ml',
        category: 'Minuman',
        price: 4000,
        quantity: 5,
        unit: 'botol',
      },
    ],
    '2026-10-15T09:30:00.000Z'
  );
  assert.equal(updated[0].stock, 20);
  assert.equal(updated[0].totalSoldAllTime, 125);
});

test('computeBusinessAnalytics detects deadstock and best sellers accurately', () => {
  const analytics = computeBusinessAnalytics(
    sampleProducts,
    [
      {
        id: 'tx-1',
        invoiceNumber: 'INV-20261015-001',
        createdAt: '2026-10-15T09:00:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri',
        shiftCodeUsed: 'DLM-4821',
        items: [
          {
            productId: 'p-1',
            sku: 'MIN-001',
            name: 'Teh Pucuk Harum 350ml',
            category: 'Minuman',
            price: 4000,
            quantity: 4,
            unit: 'botol',
          },
        ],
        totalAmount: 16000,
        cashReceived: 20000,
        changeAmount: 4000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
    ],
    '2026-10-15T12:00:00.000Z',
    1
  );

  assert.equal(analytics.totalRevenue, 16000);
  assert.equal(analytics.insideRevenue, 16000);
  assert.equal(analytics.outsideRevenue, 0);
  assert.equal(analytics.bestSellers[0].product.id, 'p-1');
  assert.equal(analytics.deadstockProducts.length, 1);
  assert.equal(analytics.deadstockProducts[0].product.id, 'p-2');
});

test('executeDailyBookClosing archives daily revenue, advances businessDate, and rotates shift codes', () => {
  const initialState: EcomartDatabaseState = {
    currentBusinessDate: '2026-10-15',
    dailyShiftCodes: generateDailyShiftCodes('2026-10-15'),
    activeShifts: {
      inside: {
        area: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri',
        loginAt: '2026-10-15T07:00:00.000Z',
        shiftCode: 'DLM-1234',
        isActive: true,
      },
      outside: null,
    },
    products: sampleProducts,
    transactions: [
      {
        id: 'tx-1',
        invoiceNumber: 'INV-20261015-001',
        createdAt: '2026-10-15T09:00:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri',
        shiftCodeUsed: 'DLM-1234',
        items: [
          {
            productId: 'p-1',
            sku: 'MIN-001',
            name: 'Teh Pucuk Harum 350ml',
            category: 'Minuman',
            price: 4000,
            quantity: 2,
            unit: 'botol',
          },
        ],
        totalAmount: 8000,
        cashReceived: 10000,
        changeAmount: 2000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
    ],
    activityLogs: [],
    closingHistory: [],
    qrisConfig: {
      imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      accountName: 'KOPERASI SEKOLAH ECOMART',
      merchantNmid: 'ID1020039281729',
      instructionText: 'Scan QRIS untuk pembayaran',
      updatedAt: '2026-10-15T07:00:00.000Z',
      updatedBy: 'Admin Koperasi',
    },
  };

  const { nextState, closingRecord } = executeDailyBookClosing(
    initialState,
    'Pak Hendra (Admin)',
    'Tutup buku Kamis sore',
    '2026-10-15T16:00:00.000Z'
  );

  assert.equal(closingRecord.businessDate, '2026-10-15');
  assert.equal(closingRecord.totalRevenue, 8000);
  assert.equal(closingRecord.totalItemsSold, 2);
  assert.equal(nextState.currentBusinessDate, getNextBusinessDate('2026-10-15'));
  assert.equal(nextState.lastClosingTimestamp, '2026-10-15T16:00:00.000Z');
  assert.equal(nextState.activeShifts.inside, null);
  assert.equal(nextState.storeStatus?.status, 'TUTUP');
  assert.notEqual(nextState.dailyShiftCodes.insideCode, initialState.dailyShiftCodes.insideCode);
});

test('checkShouldAutoCloseBook detects 24h limit expiration and calendar date advances', () => {
  const dummyState: EcomartDatabaseState = {
    currentBusinessDate: '2026-10-15',
    lastClosingTimestamp: '2026-10-15T00:00:00.000Z',
    dailyShiftCodes: { date: '2026-10-15', insideCode: 'DLM-1000', outsideCode: 'LUR-2000' },
    activeShifts: { inside: null, outside: null },
    qrisConfig: {
      imageUrl: '',
      accountName: 'TEST',
      instructionText: '',
      updatedAt: '',
      updatedBy: '',
    },
    products: [],
    transactions: [],
    activityLogs: [],
    closingHistory: [],
  };

  // Same day, only 5 hours later -> should NOT auto close
  const fiveHoursLater = new Date('2026-10-15T05:00:00.000Z');
  assert.equal(checkShouldAutoCloseBook(dummyState, fiveHoursLater), false);
  assert.ok(getClosingCycleRemainingMs(dummyState, fiveHoursLater) > 0);

  // 25 hours later -> SHOULD auto close (24h limit exceeded)
  const twentyFiveHoursLater = new Date('2026-10-16T01:00:00.000Z');
  assert.equal(checkShouldAutoCloseBook(dummyState, twentyFiveHoursLater), true);
  assert.equal(getClosingCycleRemainingMs(dummyState, twentyFiveHoursLater), 0);
});
