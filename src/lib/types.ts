export type BillingCycle = 'monthly' | 'yearly';

export const CATEGORIES = ['AI', 'エンタメ', '仕事', '音楽', '買い物'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  AI: { bg: 'bg-violet-100', text: 'text-violet-700' },
  エンタメ: { bg: 'bg-red-100', text: 'text-red-700' },
  仕事: { bg: 'bg-orange-100', text: 'text-orange-700' },
  音楽: { bg: 'bg-purple-100', text: 'text-purple-700' },
  買い物: { bg: 'bg-green-100', text: 'text-green-700' },
};

export type Subscription = {
  id: string;
  userId: string;
  name: string;
  category: Category;
  price: number;
  billingCycle: BillingCycle;
  /**
   * アンカー日 (これまでの請求日のいずれか 1 日)。
   * 「次回の請求日」は表示時に billing.ts の nextBillingFrom() で算出する。
   * 形式: YYYY-MM-DD
   */
  nextBillingDate: string;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CalendarEvent = {
  date: string;
  title: string;
  sourceId: string;
};

export type CalendarDay = {
  ymd: string;
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number;
  holidayName: string | null;
};
