'use client';

import { useCallback, useState } from 'react';
import { removeSubscriptionAction } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nextBillingFrom } from '@/lib/billing';
import type { Category, Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { AddServiceButton } from './AddServiceButton';
import { ServiceCard } from './ServiceCard';
import { ServiceModal } from './ServiceModal';

type ModalState = { mode: 'add' } | { mode: 'edit'; sub: Subscription } | null;

type Props = {
  subs: Subscription[];
  today: string;
};

const ALL = 'すべて' as const;
type Filter = typeof ALL | Category;

type SortKey = 'billing' | 'added' | 'price-desc' | 'price-asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'billing', label: '支払いが近い順' },
  { value: 'added', label: '追加順' },
  { value: 'price-desc', label: '高い順' },
  { value: 'price-asc', label: '安い順' },
];

function sortSubs(subs: Subscription[], sortKey: SortKey, today: string): Subscription[] {
  return [...subs].sort((a, b) => {
    switch (sortKey) {
      case 'billing': {
        const an = nextBillingFrom(a.nextBillingDate, a.billingCycle, today);
        const bn = nextBillingFrom(b.nextBillingDate, b.billingCycle, today);
        return an.localeCompare(bn);
      }
      case 'added':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'price-desc':
        return b.price - a.price;
      case 'price-asc':
        return a.price - b.price;
    }
  });
}

type SectionedGridProps = {
  subs: Subscription[];
  today: string;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

function SectionedGrid({ subs, today, onEdit, onDelete, onAdd }: SectionedGridProps) {
  const monthly = subs.filter((s) => s.billingCycle === 'monthly');
  const yearly = subs.filter((s) => s.billingCycle === 'yearly');

  return (
    <div className="flex flex-col gap-6">
      {monthly.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-400 text-xs">月額払い</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {monthly.map((sub) => (
              <ServiceCard key={sub.id} sub={sub} today={today} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
      {yearly.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-400 text-xs">年額払い</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {yearly.map((sub) => (
              <ServiceCard key={sub.id} sub={sub} today={today} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <AddServiceButton onClick={onAdd} />
      </div>
    </div>
  );
}

export function ServiceGrid({ subs, today }: Props) {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('billing');
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = filter === ALL ? subs : subs.filter((s) => s.category === filter);
  const sorted = sortSubs(filtered, sortKey, today);

  const handleEdit = useCallback((sub: Subscription) => {
    setModal({ mode: 'edit', sub });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('削除しますか？')) return;
    const fd = new FormData();
    fd.set('id', id);
    await removeSubscriptionAction(fd);
  }, []);

  const pills: Filter[] = [ALL, ...CATEGORIES];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-8 w-auto min-w-[9rem] rounded-full border-stone-200 bg-white px-3.5 py-1.5 font-medium text-stone-600 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setFilter(pill)}
            className={`rounded-full border px-3.5 py-1.5 font-medium text-xs transition-colors duration-150 ${
              filter === pill
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {sorted.length === 0 && filter === ALL ? (
        <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-stone-400">
          <p className="text-sm">まだサービスが登録されていません</p>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="text-violet-600 text-xs underline underline-offset-2"
          >
            最初のサービスを追加する
          </button>
        </div>
      ) : filter !== ALL ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sorted.map((sub) => (
            <ServiceCard key={sub.id} sub={sub} today={today} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <SectionedGrid
          subs={sorted}
          today={today}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setModal({ mode: 'add' })}
        />
      )}

      <ServiceModal state={modal} onClose={() => setModal(null)} />
    </>
  );
}
