import 'server-only';
import { and, eq } from 'drizzle-orm';
import { toMonthly } from './billing';
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
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  return rows as Subscription[];
}

export async function getOne(id: string, userId: string): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .limit(1);
  return (rows[0] as Subscription) ?? null;
}

export async function updateSubscription(
  id: string,
  userId: string,
  data: {
    name: string;
    category: Category;
    price: number;
    billingCycle: BillingCycle;
    nextBillingDate: string;
    memo?: string;
  },
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      name: data.name,
      category: data.category,
      price: data.price,
      billingCycle: data.billingCycle,
      nextBillingDate: data.nextBillingDate,
      memo: data.memo ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}

export async function removeSubscription(id: string, userId: string): Promise<void> {
  await db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}

export function getMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((acc, s) => acc + toMonthly(s.price, s.billingCycle), 0);
}
