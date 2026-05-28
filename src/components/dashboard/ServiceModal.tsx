//
// サービスの追加・編集用モーダルコンポーネント。
//
// サブスクリプションの名称、カテゴリ、料金、支払いサイクル、請求日、メモをユーザーが入力し、
// 既存サービスの更新または新規サービスの作成を行います。
//

'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createSubscriptionAction, updateSubscriptionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatYmdInAppTimeZone } from '@/lib/billing';
import type { Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

type ModalState = { mode: 'add' } | { mode: 'edit'; sub: Subscription } | null;

type Props = {
  state: ModalState;
  onClose: () => void;
};

// 1〜12 の month を受け取り、その0の月を受け取ることで最終日を返します。
// たとえば２月なら28や29、４月なら30を返します。このロジックでうるう年も正しく処理が可能です。
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 「今日」を Asia/Tokyo 基準で取得します。
// YYYY-MM-DD 形式の文字列を分割して数値に変換します。
function appTodayParts(): { year: number; month: number; day: number } {
  const [year, month, day] = formatYmdInAppTimeZone(new Date()).split('-').map(Number);
  return { year, month, day };
}

// 選択した月日から「次に訪れる年」を推測します。
// 例えば 6/1 を選んだとき、今日が 5/31 なら今年、今日が 6/2 なら来年になります。
function inferYear(month: number, day: number): number {
  const today = appTodayParts();
  const thisYear = today.year;
  const todayMd = (today.month - 1) * 100 + today.day;
  const candidateMd = (month - 1) * 100 + day;
  return candidateMd >= todayMd ? thisYear : thisYear + 1;
}

// 月と日を受け取り、送信する nextBillingDate の文字列を生成します。
// たとえば 2/30 のように存在しない日付が選ばれた場合でも、その月の最終日に丸めます。
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
  const today = appTodayParts();

  // 編集中なら既存サブスクの日付を初期値に、追加モードなら今日を初期値にします。
  const defaultMonth = sub ? Number(sub.nextBillingDate.split('-')[1]) : today.month;
  const defaultDay = sub ? Number(sub.nextBillingDate.split('-')[2]) : today.day;

  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay);

  // 月が変わったときに選択可能な日数を再計算します。
  const year = inferYear(month, day);
  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(day, maxDay);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  // hidden input に渡す nextBillingDate を生成します。
  // 月/日だけの選択から YYYY-MM-DD 形式に変換します。
  const anchorDate = useMemo(() => anchorFromParts(month, day), [month, day]);

  const action = isEdit ? updateSubscriptionAction : createSubscriptionAction;
  
  // useActionState はフォーム送信時に使うサーバーアクションの hook です。
  const [, formAction, isPending] = useActionState(async (_prev: null, formData: FormData) => {
    await action(formData);
    onClose();
    return null;
  }, null);

  const formRef = useRef<HTMLFormElement>(null);

  // モーダルが開いたときにフォーム初期状態をリセットします。
  // 編集時は既存の nextBillingDate を保持し、追加時は今日を初期値とします。
  useEffect(() => {
    if (isOpen) {
      const currentToday = appTodayParts();
      const m = sub ? Number(sub.nextBillingDate.split('-')[1]) : currentToday.month;
      const d = sub ? Number(sub.nextBillingDate.split('-')[2]) : currentToday.day;
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
