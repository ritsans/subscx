import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { formatYmdInAppTimeZone } from '@/lib/billing';
import { getSession } from '@/lib/get-session';
import { getMonthlyTotal, listAll } from '@/lib/subscriptions';

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);
  const monthlyTotal = getMonthlyTotal(subs);
  const createdAt = formatYmdInAppTimeZone(new Date(session.user.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} userEmail={session.user.email} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-6 font-semibold text-stone-900 text-xl">マイページ</h1>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>アカウント</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="お名前" value={session.user.name ?? '未設定'} />
              <Row label="メールアドレス" value={session.user.email} />
              <Row label="登録日" value={createdAt.replace(/-/g, '/')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>サブスク</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="登録件数" value={`${subs.length} 件`} />
              <Row label="月額合計" value={`¥${monthlyTotal.toLocaleString('ja-JP')}`} />
            </CardContent>
          </Card>
        </div>

        <nav className="mt-8">
          <Link href="/dashboard" className="text-stone-600 text-sm hover:text-stone-900">
            ← ダッシュボードへ戻る
          </Link>
        </nav>
      </main>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-stone-100 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}
