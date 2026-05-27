import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: int('price').notNull(),
  billingCycle: text('billing_cycle').notNull(),
  // アンカー日 (これまでの請求日のいずれか 1 日)。
  // 「次回の請求日」は src/lib/billing.ts の nextBillingFrom() で算出する。
  nextBillingDate: text('next_billing_date').notNull(),
  memo: text('memo'),
  createdAt: int('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updated_at', { mode: 'timestamp' }).notNull(),
});

export * from './auth-schema';
