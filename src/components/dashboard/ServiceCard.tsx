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
      {/* ヘッダー: アイコン + サービス名 + メニュー */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${colors.bg} ${colors.text}`}
        >
          {initial}
        </div>
        <p className="min-w-0 flex-1 truncate pr-6 font-semibold text-sm text-stone-900">{sub.name}</p>
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
      </div>

      {/* 料金 */}
      <div className="mb-4 text-right">
        <p className="font-bold text-stone-900 text-2xl">
          ¥<span className="font-numeric">{monthly.toLocaleString()}</span>
          <span className="ml-1 text-sm font-normal text-stone-400">/ 月</span>
        </p>
      </div>

      {/* フッター: 次回 + カテゴリバッジ */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-stone-400">次回 {formatDate(sub.nextBillingDate)}</p>
        <span className={`rounded-full px-2.5 py-1 font-medium text-xs ${colors.bg} ${colors.text}`}>
          {sub.category}
        </span>
      </div>
    </div>
  );
}
