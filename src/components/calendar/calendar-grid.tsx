import type { CalendarDay, CalendarEvent } from '@/lib/types';
import { CalendarCell } from './calendar-cell';

type Props = {
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
};

const WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function bgForDayOfWeek(dow: number): string {
  if (dow === 0) return 'bg-red-50';
  if (dow === 6) return 'bg-blue-50';
  return 'bg-white';
}

function headerColor(dow: number): string {
  if (dow === 0) return 'text-red-600';
  if (dow === 6) return 'text-blue-600';
  return 'text-stone-500';
}

export function CalendarGrid({ days, eventsByDate }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="grid grid-cols-7 border-b border-stone-200">
        {WEEK_LABELS.map((label, i) => (
          <div key={label} className={`px-2 py-2 text-center text-xs font-medium ${headerColor(i)}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <CalendarCell
            key={day.ymd}
            day={day}
            events={eventsByDate.get(day.ymd) ?? []}
            bgClass={bgForDayOfWeek(day.dayOfWeek)}
          />
        ))}
      </div>
    </div>
  );
}
