import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  expandSubscriptionsToMonth,
  formatDateKey,
  getLastDayOfMonth,
  groupEventsByDate,
  nextMonth,
  prevMonth,
} from './calendar';
import type { Subscription } from './types';

describe('formatDateKey', () => {
  it('returns YYYY-MM-DD in Asia/Tokyo', () => {
    expect(formatDateKey(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
  });

  it('handles JST early morning correctly (UTC previous day)', () => {
    // 2026-01-01T15:00:00Z は JST で 2026-01-02 00:00
    expect(formatDateKey(new Date('2026-01-01T15:00:00Z'))).toBe('2026-01-02');
  });
});

describe('getLastDayOfMonth', () => {
  it('returns 31 for January', () => {
    expect(getLastDayOfMonth(2026, 0)).toBe(31);
  });

  it('returns 28 for February non-leap', () => {
    expect(getLastDayOfMonth(2026, 1)).toBe(28);
  });

  it('returns 29 for February leap year', () => {
    expect(getLastDayOfMonth(2024, 1)).toBe(29);
  });

  it('returns 30 for April', () => {
    expect(getLastDayOfMonth(2026, 3)).toBe(30);
  });
});

describe('prevMonth', () => {
  it('rolls over January to previous December', () => {
    expect(prevMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
  });

  it('decrements within year', () => {
    expect(prevMonth(2026, 5)).toEqual({ year: 2026, month: 4 });
  });
});

describe('nextMonth', () => {
  it('rolls over December to next January', () => {
    expect(nextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });
  });

  it('increments within year', () => {
    expect(nextMonth(2026, 5)).toEqual({ year: 2026, month: 6 });
  });
});

describe('buildMonthGrid', () => {
  it('returns exactly 42 cells', () => {
    const today = new Date('2026-05-29T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    expect(grid).toHaveLength(42);
  });

  it('marks isToday for today in Asia/Tokyo', () => {
    const today = new Date('2026-05-29T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    const todayCells = grid.filter((d) => d.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].ymd).toBe('2026-05-29');
  });

  it('marks isCurrentMonth correctly', () => {
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    const currentMonthCells = grid.filter((d) => d.isCurrentMonth);
    expect(currentMonthCells).toHaveLength(31);
    expect(currentMonthCells[0].day).toBe(1);
    expect(currentMonthCells[30].day).toBe(31);
  });

  it('includes trailing days from previous month at the start', () => {
    // May 2026: 1日は金曜 → 前月 (April) の日曜〜木曜が先頭に並ぶ
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    expect(grid[0].isCurrentMonth).toBe(false);
    expect(grid[0].month).toBe(3); // April
  });

  it('assigns dayOfWeek 0 for Sunday and 6 for Saturday', () => {
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    expect(grid[0].dayOfWeek).toBe(0);
    expect(grid[6].dayOfWeek).toBe(6);
  });

  it('sets holidayName for Japanese national holidays', () => {
    const today = new Date('2026-05-03T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    const may3 = grid.find((d) => d.ymd === '2026-05-03');
    expect(may3?.holidayName).toBe('憲法記念日');
  });
});

function makeSub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-1',
    userId: 'u1',
    name: 'Netflix',
    category: 'エンタメ',
    price: 1490,
    billingCycle: 'monthly',
    nextBillingDate: '2026-01-15',
    memo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('expandSubscriptionsToMonth', () => {
  it('expands monthly subscription to every month on anchor day', () => {
    const sub = makeSub({ nextBillingDate: '2026-01-15', billingCycle: 'monthly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 4);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-05-15');
    expect(events[0].title).toBe('Netflix');
    expect(events[0].sourceId).toBe('sub-1');
  });

  it('clamps day 31 monthly to last day of February', () => {
    const sub = makeSub({ id: 's2', nextBillingDate: '2026-01-31', billingCycle: 'monthly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 1);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-02-28');
  });

  it('expands yearly only on anchor month', () => {
    const sub = makeSub({ id: 's3', nextBillingDate: '2026-03-10', billingCycle: 'yearly' });
    const eventsMar = expandSubscriptionsToMonth([sub], 2026, 2);
    const eventsApr = expandSubscriptionsToMonth([sub], 2026, 3);
    expect(eventsMar).toHaveLength(1);
    expect(eventsMar[0].date).toBe('2026-03-10');
    expect(eventsApr).toHaveLength(0);
  });

  it('expands yearly on anchor month in future years', () => {
    const sub = makeSub({ id: 's4', nextBillingDate: '2024-07-20', billingCycle: 'yearly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 6);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-07-20');
  });

  it('returns multiple events for multiple subscriptions', () => {
    const subs = [
      makeSub({ id: 'a', nextBillingDate: '2026-01-10', billingCycle: 'monthly' }),
      makeSub({ id: 'b', nextBillingDate: '2026-01-20', billingCycle: 'monthly' }),
    ];
    const events = expandSubscriptionsToMonth(subs, 2026, 4);
    expect(events).toHaveLength(2);
  });
});

describe('groupEventsByDate', () => {
  it('groups events by date key', () => {
    const events = [
      { date: '2026-05-10', title: 'A', sourceId: '1' },
      { date: '2026-05-10', title: 'B', sourceId: '2' },
      { date: '2026-05-15', title: 'C', sourceId: '3' },
    ];
    const map = groupEventsByDate(events);
    expect(map.get('2026-05-10')).toHaveLength(2);
    expect(map.get('2026-05-15')).toHaveLength(1);
    expect(map.get('2026-05-20')).toBeUndefined();
  });
});
