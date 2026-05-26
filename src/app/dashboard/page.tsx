import { redirect } from 'next/navigation';
import { ServiceGrid } from '@/components/dashboard/ServiceGrid';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);

  const monthlyTotal = Math.floor(
    subs.reduce((acc, s) => acc + (s.billingCycle === 'monthly' ? s.price : s.price / 12), 0),
  );
  const yearlyTotal = subs.reduce((acc, s) => acc + (s.billingCycle === 'yearly' ? s.price : s.price * 12), 0);
  const aiCount = subs.filter((s) => s.category === 'AI').length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <SummaryCards monthlyTotal={monthlyTotal} yearlyTotal={yearlyTotal} count={subs.length} aiCount={aiCount} />
        <ServiceGrid subs={subs} />
      </main>

      <Footer />
    </div>
  );
}
