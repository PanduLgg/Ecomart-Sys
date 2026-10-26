import { pgTable, text, integer, timestamp, serial } from 'drizzle-orm/pg-core';

// 1. Users table (Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('kasir'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. System Settings table (Store current business date, shift codes, and active cashier shifts)
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  costPrice: integer('cost_price').notNull(),
  stock: integer('stock').notNull(),
  minStock: integer('min_stock').notNull(),
  unit: text('unit').notNull(),
  imageUrl: text('image_url').notNull(),
  totalSoldAllTime: integer('total_sold_all_time').notNull().default(0),
  lastSoldAt: text('last_sold_at'),
  description: text('description'),
  updatedAt: text('updated_at').notNull(),
});

// 4. Transactions table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  createdAt: text('created_at').notNull(),
  businessDate: text('business_date').notNull(),
  cashierAccount: text('cashier_account').notNull(),
  cashierName: text('cashier_name').notNull(),
  shiftCodeUsed: text('shift_code_used').notNull(),
  buyerLabel: text('buyer_label'),
  itemsJson: text('items_json').notNull(),
  totalAmount: integer('total_amount').notNull(),
  cashReceived: integer('cash_received').notNull(),
  changeAmount: integer('change_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().default('Selesai'),
  correctionNote: text('correction_note'),
});

// 5. Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  actorRole: text('actor_role').notNull(),
  actorName: text('actor_name').notNull(),
  cashierArea: text('cashier_area'),
  actionType: text('action_type').notNull(),
  summary: text('summary').notNull(),
  details: text('details').notNull(),
});

// 6. Daily Closings table
export const dailyClosings = pgTable('daily_closings', {
  id: text('id').primaryKey(),
  closedAt: text('closed_at').notNull(),
  businessDate: text('business_date').notNull(),
  closedByAdmin: text('closed_by_admin').notNull(),
  totalTransactions: integer('total_transactions').notNull(),
  totalRevenue: integer('total_revenue').notNull(),
  totalItemsSold: integer('total_items_sold').notNull(),
  insideAreaRevenue: integer('inside_area_revenue').notNull(),
  outsideAreaRevenue: integer('outside_area_revenue').notNull(),
  cashierNamesInvolvedJson: text('cashier_names_involved_json').notNull(),
  lowStockProductsCount: integer('low_stock_products_count').notNull(),
  notes: text('notes').notNull(),
});
