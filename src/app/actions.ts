'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/get-session';
import { createSubscription } from '@/lib/subscriptions';
import { CATEGORIES } from '@/lib/types';

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function createSubscriptionAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('未認証');

  const name = formData.get('name');
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('サービス名は必須です');
  }

  const category = formData.get('category');
  if (!category || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error('カテゴリが不正です');
  }

  const priceRaw = formData.get('price');
  const price = Number(priceRaw);
  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('料金は正の整数で入力してください');
  }

  const billingCycle = formData.get('billingCycle');
  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    throw new Error('課金サイクルが不正です');
  }

  const nextBillingDate = formData.get('nextBillingDate');
  if (!nextBillingDate || typeof nextBillingDate !== 'string' || !isValidDateInput(nextBillingDate)) {
    throw new Error('次回請求日が不正です');
  }

  const memo = formData.get('memo');

  await createSubscription({
    userId: session.user.id,
    name: name.trim(),
    category: category as (typeof CATEGORIES)[number],
    price,
    billingCycle,
    nextBillingDate,
    memo: typeof memo === 'string' && memo.trim() !== '' ? memo.trim() : undefined,
  });

  revalidatePath('/dashboard');
}
