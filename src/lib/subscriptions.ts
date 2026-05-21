import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { subscriptions } from './schema';
import type { BillingCycle, Category, Subscription } from './types';

export async function createSubscription(data: {
  userId: string;
  name: string;
  category: Category;
  price: number;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  memo?: string;
}): Promise<void> {
  const now = new Date();
  await db.insert(subscriptions).values({
    id: crypto.randomUUID(),
    userId: data.userId,
    name: data.name,
    category: data.category,
    price: data.price,
    billingCycle: data.billingCycle,
    nextBillingDate: data.nextBillingDate,
    memo: data.memo ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listAll(userId: string): Promise<Subscription[]> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(asc(subscriptions.nextBillingDate));

  return rows as Subscription[];
}
