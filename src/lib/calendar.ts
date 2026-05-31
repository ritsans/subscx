import * as holidayJp from '@holiday-jp/holiday_jp';
import { formatYmdInAppTimeZone } from './billing';
import type { CalendarDay, CalendarEvent, Subscription } from './types';

export function formatDateKey(date: Date): string {
  return formatYmdInAppTimeZone(date);
}

export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

export function buildMonthGrid(year: number, month: number, today: Date): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDayOfWeek);
  const todayKey = formatDateKey(today);

  const lastDate = new Date(year, month, 1 - startDayOfWeek + 41);
  const holidays = holidayJp.between(startDate, lastDate);
  const holidayMap = new Map<string, string>();
  for (const h of holidays) {
    const key = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`;
    holidayMap.set(key, h.name);
  }

  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDayOfWeek + i);
    const cellYear = d.getFullYear();
    const cellMonth = d.getMonth();
    const cellDay = d.getDate();
    const ymd = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
    cells.push({
      ymd,
      year: cellYear,
      month: cellMonth,
      day: cellDay,
      isCurrentMonth: cellMonth === month,
      isToday: ymd === todayKey,
      dayOfWeek: d.getDay(),
      holidayName: holidayMap.get(ymd) ?? null,
    });
  }
  return cells;
}

export function expandSubscriptionsToMonth(subs: Subscription[], year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const sub of subs) {
    const [, anchorM, anchorD] = sub.nextBillingDate.split('-').map(Number);
    if (sub.billingCycle === 'yearly' && anchorM - 1 !== month) {
      continue;
    }
    const lastDay = getLastDayOfMonth(year, month);
    const day = Math.min(anchorD, lastDay);
    const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    events.push({ date: ymd, title: sub.name, sourceId: sub.id });
  }
  return events;
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}
