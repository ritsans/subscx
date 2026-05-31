import type { BillingCycle } from './types';

export const APP_TIME_ZONE = 'Asia/Tokyo';

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

export function formatYmdInAppTimeZone(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to format date in app time zone');
  }

  return `${year}-${month}-${day}`;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * アンカー日と課金サイクルから、today 以上で最も近い課金日を返す。
 * アンカーの月/日 (位相) を基準に today の年月から直接算出する。
 * 未来アンカー・過去アンカーどちらでも正しく動作する。
 * 月末締め (originalDay) は遷移先の末日に丸めるが、長い月では元の日に戻る。
 */
export function nextBillingFrom(anchor: string, cycle: BillingCycle, today: string): string {
  const anchorDate = parseYmd(anchor);
  const todayDate = parseYmd(today);
  const originalDay = anchorDate.getUTCDate();

  if (cycle === 'monthly') {
    // 候補月 = today の年/月 から始め、候補日 < today なら翌月へ進める
    let candidateYear = todayDate.getUTCFullYear();
    let candidateMonthIndex = todayDate.getUTCMonth();
    const clampDay = (y: number, mi: number) => Math.min(originalDay, lastDayOfMonth(y, mi));
    let candidateDay = clampDay(candidateYear, candidateMonthIndex);
    let candidate = new Date(Date.UTC(candidateYear, candidateMonthIndex, candidateDay));

    if (candidate.getTime() < todayDate.getTime()) {
      const nextMonthIndex = candidateMonthIndex + 1;
      candidateYear = candidateYear + Math.floor(nextMonthIndex / 12);
      candidateMonthIndex = nextMonthIndex % 12;
      candidateDay = clampDay(candidateYear, candidateMonthIndex);
      candidate = new Date(Date.UTC(candidateYear, candidateMonthIndex, candidateDay));
    }

    return formatYmd(candidate);
  }

  // yearly: アンカーの月/日 を基準に today の年を候補にする
  const anchorMonthIndex = anchorDate.getUTCMonth();
  const clampDay = (y: number) => Math.min(originalDay, lastDayOfMonth(y, anchorMonthIndex));
  let candidateYear = todayDate.getUTCFullYear();
  let candidateDay = clampDay(candidateYear);
  let candidate = new Date(Date.UTC(candidateYear, anchorMonthIndex, candidateDay));

  if (candidate.getTime() < todayDate.getTime()) {
    candidateYear += 1;
    candidateDay = clampDay(candidateYear);
    candidate = new Date(Date.UTC(candidateYear, anchorMonthIndex, candidateDay));
  }

  return formatYmd(candidate);
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
