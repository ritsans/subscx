import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/sign-out-button';
import { getSession } from '@/lib/get-session';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { user } = session;

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{user.name} さん</p>
      <p style={{ color: '#666', fontSize: 14 }}>{user.email}</p>

      <nav style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <Link href="/mypage">マイページ</Link>
        <SignOutButton />
      </nav>
    </main>
  );
}
