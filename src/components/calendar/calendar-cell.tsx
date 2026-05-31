import type { CalendarDay, CalendarEvent } from '@/lib/types';

type Props = {
  day: CalendarDay;
  events: CalendarEvent[];
  bgClass: string;
};

export function CalendarCell({ day, events, bgClass }: Props) {
  const dayTextClass = !day.isCurrentMonth
    ? 'text-gray-300'
    : day.dayOfWeek === 0 || day.holidayName
      ? 'text-red-600'
      : day.dayOfWeek === 6
        ? 'text-blue-600'
        : 'text-stone-800';

  const ringClass = day.isToday ? 'ring-2 ring-blue-400 ring-inset' : '';

  const visible = events.slice(0, 2);
  const overflow = events.length - visible.length;

  return (
    <div className={`min-h-[88px] border border-stone-100 p-1.5 ${bgClass} ${ringClass}`}>
      <div className={`text-xs font-medium ${dayTextClass}`}>{day.day}</div>
      {day.holidayName ? <div className="mt-0.5 truncate text-[10px] text-red-600">{day.holidayName}</div> : null}
      <div className="mt-1 flex flex-col gap-0.5">
        {visible.map((e) => (
          <div
            key={e.sourceId}
            className="truncate rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-800"
            title={e.title}
          >
            {e.title}
          </div>
        ))}
        {overflow > 0 ? <div className="text-[10px] text-stone-500">+{overflow}</div> : null}
      </div>
    </div>
  );
}
