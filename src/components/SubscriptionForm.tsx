'use client';

import { createSubscriptionAction, removeSubscriptionAction, updateSubscriptionAction } from '@/app/actions';
import { CATEGORIES } from '@/lib/types';
import type { Subscription } from '@/lib/types';

type Props = {
  subscription?: Subscription;
};

export function SubscriptionForm({ subscription }: Props) {
  const isEdit = subscription !== undefined;

  return (
    <div>
      <form
        action={isEdit ? updateSubscriptionAction : createSubscriptionAction}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}
      >
        {isEdit && <input type="hidden" name="id" value={subscription.id} />}
        <input name="name" placeholder="サービス名" defaultValue={subscription?.name ?? ''} required />
        <select name="category" defaultValue={subscription?.category ?? CATEGORIES[0]} required>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="price" type="number" placeholder="料金（円）" defaultValue={subscription?.price ?? ''} required />
        <select name="billingCycle" defaultValue={subscription?.billingCycle ?? 'monthly'} required>
          <option value="monthly">月払い</option>
          <option value="yearly">年払い</option>
        </select>
        <input name="nextBillingDate" type="date" defaultValue={subscription?.nextBillingDate ?? ''} required />
        <textarea name="memo" placeholder="メモ（任意）" defaultValue={subscription?.memo ?? ''} />
        <button type="submit">{isEdit ? '更新' : '追加'}</button>
      </form>

      {isEdit && (
        <form action={removeSubscriptionAction} style={{ marginTop: 8 }}>
          <input type="hidden" name="id" value={subscription.id} />
          <button type="submit" style={{ color: 'red' }}>
            削除
          </button>
        </form>
      )}
    </div>
  );
}
