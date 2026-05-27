'use client';

import { useCallback, useState } from 'react';
import { removeSubscriptionAction } from '@/app/actions';
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

export function ServiceGrid({ subs, today }: Props) {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = filter === ALL ? subs : subs.filter((s) => s.category === filter);

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
      <div className="flex flex-wrap gap-2">
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

      {filtered.length === 0 && filter === ALL ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((sub) => (
            <ServiceCard key={sub.id} sub={sub} today={today} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          {filter === ALL && <AddServiceButton onClick={() => setModal({ mode: 'add' })} />}
        </div>
      )}

      <ServiceModal state={modal} onClose={() => setModal(null)} />
    </>
  );
}
