'use client';

import { useActionState, useEffect, useRef } from 'react';
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

export function ServiceModal({ state, onClose }: Props) {
  const isOpen = state !== null;
  const isEdit = state?.mode === 'edit';
  const sub = isEdit ? state.sub : undefined;

  const action = isEdit ? updateSubscriptionAction : createSubscriptionAction;
  const [, formAction, isPending] = useActionState(async (_prev: null, formData: FormData) => {
    await action(formData);
    onClose();
    return null;
  }, null);

  const formRef = useRef<HTMLFormElement>(null);

  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

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
            <Label htmlFor="nextBillingDate">次回請求日</Label>
            <Input
              id="nextBillingDate"
              name="nextBillingDate"
              type="date"
              defaultValue={sub?.nextBillingDate ?? ''}
              required
            />
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
