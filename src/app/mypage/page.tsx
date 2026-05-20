import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1>マイページ</h1>
      <p style={{ color: '#666' }}>プロファイル・設定（準備中）</p>

      <nav style={{ marginTop: 32 }}>
        <Link href="/dashboard">← ダッシュボードへ戻る</Link>
      </nav>
    </main>
  );
}
