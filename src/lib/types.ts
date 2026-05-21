export type BillingCycle = 'monthly' | 'yearly';

export const CATEGORIES = ['AI', 'エンタメ', '仕事', '音楽', '買い物'] as const;
export type Category = (typeof CATEGORIES)[number];

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
