import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';
import { CATEGORIES } from '@/lib/types';
import { createSubscriptionAction } from '../actions';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1>ダッシュボード</h1>
      <p>こんにちは、{session.user.name} さん</p>

      <h2 style={{ marginTop: 32 }}>サービスを追加</h2>
      <form
        action={createSubscriptionAction}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}
      >
        <input name="name" placeholder="サービス名" required />
        <select name="category" required>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="price" type="number" placeholder="料金（円）" required />
        <select name="billingCycle" required>
          <option value="monthly">月払い</option>
          <option value="yearly">年払い</option>
        </select>
        <input name="nextBillingDate" type="date" required />
        <textarea name="memo" placeholder="メモ（任意）" />
        <button type="submit">追加</button>
      </form>

      <h2 style={{ marginTop: 32 }}>登録済みサービス ({subs.length}件)</h2>
      {subs.length === 0 ? (
        <p style={{ color: '#666' }}>まだサービスが登録されていません</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.map((sub) => (
            <li key={sub.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 16px' }}>
              <strong>{sub.name}</strong>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{sub.category}</span>
              <div style={{ marginTop: 4, fontSize: 14 }}>
                ¥{sub.price.toLocaleString()} / {sub.billingCycle === 'monthly' ? '月' : '年'}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>次回請求日: {sub.nextBillingDate}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
