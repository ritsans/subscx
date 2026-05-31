'use client';

import { buildMonthGrid, expandSubscriptionsToMonth, groupEventsByDate, nextMonth, prevMonth } from '@/lib/calendar';
import type { Subscription } from '@/lib/types';
import { useMemo, useState } from 'react';
import { CalendarGrid } from './calendar-grid';
import { CalendarHeader } from './calendar-header';

type Props = {
  initialSubscriptions: Subscription[];
};

export function Calendar({ initialSubscriptions }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => buildMonthGrid(year, month, new Date()), [year, month]);
  const eventsByDate = useMemo(() => {
    const events = expandSubscriptionsToMonth(initialSubscriptions, year, month);
    return groupEventsByDate(events);
  }, [initialSubscriptions, year, month]);

  function handlePrev() {
    const { year: y, month: m } = prevMonth(year, month);
    setYear(y);
    setMonth(m);
  }

  function handleNext() {
    const { year: y, month: m } = nextMonth(year, month);
    setYear(y);
    setMonth(m);
  }

  function handleToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarHeader year={year} month={month} onPrev={handlePrev} onNext={handleNext} onToday={handleToday} />
      <CalendarGrid days={days} eventsByDate={eventsByDate} />
    </div>
  );
}
