import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: int('price').notNull(),
  billingCycle: text('billing_cycle').notNull(),
  nextBillingDate: text('next_billing_date').notNull(),
  memo: text('memo'),
  createdAt: int('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updated_at', { mode: 'timestamp' }).notNull(),
});

export * from './auth-schema';
