'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Subscription } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

type Props = {
  sub: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
};

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month}/${day}`;
}

export function ServiceCard({ sub, onEdit, onDelete }: Props) {
  const colors = CATEGORY_COLORS[sub.category];
  const initial = sub.name.charAt(0).toUpperCase();
  const monthly = sub.billingCycle === 'monthly' ? sub.price : Math.floor(sub.price / 12);

  return (
    <div className="group relative rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-200 hover:shadow-md">
      {/* 「···」メニュー */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-7 w-7 items-center justify-center rounded-full text-stone-300 opacity-0 transition-all duration-150 hover:bg-stone-100 hover:text-stone-600 group-hover:opacity-100"
            aria-label="メニュー"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <circle cx="7" cy="2.5" r="1.2" />
              <circle cx="7" cy="7" r="1.2" />
              <circle cx="7" cy="11.5" r="1.2" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit(sub)}>編集</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(sub.id)} className="text-red-600 focus:text-red-600">
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* アイコン + カテゴリ */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${colors.bg} ${colors.text}`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate pr-6 font-semibold text-sm text-stone-900">{sub.name}</p>
          <span
            className={`mt-0.5 inline-block rounded-full px-2 py-0.5 font-medium text-[10px] ${colors.bg} ${colors.text}`}
          >
            {sub.category}
          </span>
        </div>
      </div>

      {/* 料金 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-bold text-stone-900 text-xl">¥{sub.price.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-stone-400">
            {sub.billingCycle === 'monthly' ? '/ 月' : `/ 年 (月換算 ¥${monthly.toLocaleString()})`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-stone-400">次回</p>
          <p className="font-semibold text-sm text-stone-700">{formatDate(sub.nextBillingDate)}</p>
        </div>
      </div>
    </div>
  );
}
