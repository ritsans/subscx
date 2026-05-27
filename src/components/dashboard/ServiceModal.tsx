'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createSubscriptionAction, updateSubscriptionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

type ModalState = { mode: 'add' } | { mode: 'edit'; sub: Subscription } | null;

type Props = {
  state: ModalState;
  onClose: () => void;
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function inferYear(month: number, day: number): number {
  const today = new Date();
  const thisYear = today.getFullYear();
  const todayMd = today.getMonth() * 100 + today.getDate();
  const candidateMd = (month - 1) * 100 + day;
  return candidateMd >= todayMd ? thisYear : thisYear + 1;
}

function anchorFromParts(month: number, day: number): string {
  const year = inferYear(month, day);
  const clampedDay = Math.min(day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function ServiceModal({ state, onClose }: Props) {
  const isOpen = state !== null;
  const isEdit = state?.mode === 'edit';
  const sub = isEdit ? state.sub : undefined;

  const defaultMonth = sub ? Number(sub.nextBillingDate.split('-')[1]) : new Date().getMonth() + 1;
  const defaultDay = sub ? Number(sub.nextBillingDate.split('-')[2]) : new Date().getDate();

  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay);

  const year = inferYear(month, day);
  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(day, maxDay);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const anchorDate = useMemo(() => anchorFromParts(month, day), [month, day]);

  const action = isEdit ? updateSubscriptionAction : createSubscriptionAction;
  const [, formAction, isPending] = useActionState(async (_prev: null, formData: FormData) => {
    await action(formData);
    onClose();
    return null;
  }, null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      const m = sub ? Number(sub.nextBillingDate.split('-')[1]) : new Date().getMonth() + 1;
      const d = sub ? Number(sub.nextBillingDate.split('-')[2]) : new Date().getDate();
      setMonth(m);
      setDay(d);
      formRef.current?.reset();
    }
  }, [isOpen, sub]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'サービスを編集' : 'サービスを追加'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'サブスクリプションの内容を更新します。' : '新しいサブスクリプションを登録します。'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={sub?.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">サービス名</Label>
            <Input id="name" name="name" placeholder="例: Netflix" defaultValue={sub?.name ?? ''} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">カテゴリ</Label>
            <Select name="category" defaultValue={sub?.category ?? CATEGORIES[0]}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">料金（円）</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={1}
                placeholder="1980"
                defaultValue={sub?.price ?? ''}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billingCycle">支払いサイクル</Label>
              <Select name="billingCycle" defaultValue={sub?.billingCycle ?? 'monthly'}>
                <SelectTrigger id="billingCycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月払い</SelectItem>
                  <SelectItem value="yearly">年払い</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>請求日 (月/日)</Label>
            <input type="hidden" name="nextBillingDate" value={anchorDate} />
            <div className="flex gap-2">
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(clampedDay)} onValueChange={(v) => setDay(Number(v))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Input id="memo" name="memo" placeholder="備考など" defaultValue={sub?.memo ?? ''} />
          </div>

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? '保存中...' : isEdit ? '更新する' : '追加する'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
