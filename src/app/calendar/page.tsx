import { redirect } from 'next/navigation';
import { Calendar } from '@/components/calendar/calendar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} userEmail={session.user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Calendar initialSubscriptions={subs} />
      </main>
      <Footer />
    </div>
  );
}
