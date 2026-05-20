import Link from 'next/link';
import { getSession } from '@/lib/get-session';

export default async function Home() {
  const session = await getSession();

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1>subscx</h1>
      <p style={{ marginTop: 16, color: '#444' }}>
        サブスクリプションをかんたんに管理。月額換算・次回請求日の一覧表示で、無駄な支出をなくしましょう。
      </p>

      <div style={{ marginTop: 32 }}>
        {session ? (
          <Link
            href="/dashboard"
            style={{ padding: '10px 20px', background: '#111', color: '#fff', borderRadius: 4, textDecoration: 'none' }}
          >
            ダッシュボードへ
          </Link>
        ) : (
          <Link
            href="/login"
            style={{ padding: '10px 20px', background: '#111', color: '#fff', borderRadius: 4, textDecoration: 'none' }}
          >
            ログイン / 新規登録
          </Link>
        )}
      </div>
    </main>
  );
}
