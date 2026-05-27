import type { BillingCycle } from './types';

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * アンカー日と課金サイクルから、today 以上で最も近い課金日を返す。
 * 月末日は遷移先の末日に丸めるが、アンカーの元の day を保持して毎回基準にする。
 */
export function nextBillingFrom(anchor: string, cycle: BillingCycle, today: string): string {
  const anchorDate = parseYmd(anchor);
  const todayDate = parseYmd(today);
  const originalDay = anchorDate.getUTCDate();
  const step = cycle === 'monthly' ? 1 : 12;
  let months = 0;
  let current = anchorDate;
  while (current.getTime() < todayDate.getTime()) {
    months += step;
    const targetMonthIndex = anchorDate.getUTCMonth() + months;
    const yearAdjusted = anchorDate.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
    const monthAdjusted = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = lastDayOfMonth(yearAdjusted, monthAdjusted);
    const day = Math.min(originalDay, lastDay);
    current = new Date(Date.UTC(yearAdjusted, monthAdjusted, day));
  }
  return formatYmd(current);
}

/**
 * today から次回課金日までの日数。最小 0。
 */
export function daysUntilNextBilling(anchor: string, cycle: BillingCycle, today: string): number {
  const next = parseYmd(nextBillingFrom(anchor, cycle, today));
  const t = parseYmd(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - t.getTime()) / msPerDay);
}

export function toMonthly(price: number, cycle: BillingCycle): number {
  return cycle === 'monthly' ? price : Math.floor(price / 12);
}

export function toYearly(price: number, cycle: BillingCycle): number {
  return cycle === 'yearly' ? price : price * 12;
}
