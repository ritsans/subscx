import { redirect } from 'next/navigation';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { getSession } from '@/lib/get-session';
import { getOne, listAll } from '@/lib/subscriptions';

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { edit: editId } = await searchParams;

  const [subs, editSub] = await Promise.all([
    listAll(session.user.id),
    editId ? getOne(editId, session.user.id) : Promise.resolve(null),
  ]);

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1>ダッシュボード</h1>
      <p>こんにちは、{session.user.name} さん</p>

      <h2 style={{ marginTop: 32 }}>{editSub ? 'サービスを編集' : 'サービスを追加'}</h2>
      {editSub && (
        <a href="/dashboard" style={{ fontSize: 12, color: '#666' }}>
          キャンセル
        </a>
      )}
      <div style={{ marginTop: 8 }}>
        <SubscriptionForm subscription={editSub ?? undefined} />
      </div>

      <h2 style={{ marginTop: 32 }}>登録済みサービス ({subs.length}件)</h2>
      {subs.length === 0 ? (
        <p style={{ color: '#666' }}>まだサービスが登録されていません</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.map((sub) => (
            <li
              key={sub.id}
              style={{
                border: sub.id === editId ? '2px solid #0070f3' : '1px solid #ddd',
                borderRadius: 8,
              }}
            >
              <a
                href={`/dashboard?edit=${sub.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '12px 16px' }}
              >
                <strong>{sub.name}</strong>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{sub.category}</span>
                <div style={{ marginTop: 4, fontSize: 14 }}>
                  ¥{sub.price.toLocaleString()} / {sub.billingCycle === 'monthly' ? '月' : '年'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>次回請求日: {sub.nextBillingDate}</div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
