'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/get-session';
import { createSubscription, removeSubscription, updateSubscription } from '@/lib/subscriptions';
import { CATEGORIES } from '@/lib/types';

const subscriptionSchema = z.object({
  name: z.string().min(1, 'サービス名は必須です'),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().int().positive('料金は正の整数で入力してください'),
  billingCycle: z.enum(['monthly', 'yearly']),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '次回請求日の形式が不正です')
    .refine((v) => {
      const [year, month, day] = v.split('-').map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
    }, '次回請求日が不正です'),
  memo: z.string().optional(),
});

export async function createSubscriptionAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('未認証');

  const parsed = subscriptionSchema.parse(Object.fromEntries(formData));

  await createSubscription({
    userId: session.user.id,
    name: parsed.name.trim(),
    category: parsed.category,
    price: parsed.price,
    billingCycle: parsed.billingCycle,
    nextBillingDate: parsed.nextBillingDate,
    memo: parsed.memo?.trim() || undefined,
  });

  revalidatePath('/dashboard');
}

export async function updateSubscriptionAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('未認証');

  const id = formData.get('id');
  if (!id || typeof id !== 'string') throw new Error('IDが不正です');

  const parsed = subscriptionSchema.parse(Object.fromEntries(formData));

  await updateSubscription(id, session.user.id, {
    name: parsed.name.trim(),
    category: parsed.category,
    price: parsed.price,
    billingCycle: parsed.billingCycle,
    nextBillingDate: parsed.nextBillingDate,
    memo: parsed.memo?.trim() || undefined,
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function removeSubscriptionAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('未認証');

  const id = formData.get('id');
  if (!id || typeof id !== 'string') throw new Error('IDが不正です');

  await removeSubscription(id, session.user.id);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
