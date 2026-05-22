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
  nextBillingDate: string;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
};
