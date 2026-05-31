import { redirect } from 'next/navigation';
import { ServiceGrid } from '@/components/dashboard/ServiceGrid';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { formatYmdInAppTimeZone, toMonthly, toYearly } from '@/lib/billing';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);
  const today = formatYmdInAppTimeZone(new Date());

  const monthlyTotal = subs.reduce((acc, s) => acc + toMonthly(s.price, s.billingCycle), 0);
  const yearlyTotal = subs.reduce((acc, s) => acc + toYearly(s.price, s.billingCycle), 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <SummaryCards monthlyTotal={monthlyTotal} yearlyTotal={yearlyTotal} count={subs.length} />
        <ServiceGrid subs={subs} today={today} />
      </main>

      <Footer />
    </div>
  );
}
