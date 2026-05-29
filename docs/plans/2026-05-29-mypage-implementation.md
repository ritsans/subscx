# マイページ最低限機能 実装計画書

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/mypage` にアカウント情報とサブスクの最小サマリーを表示し、ヘッダーアバターから DropdownMenu でマイページ遷移・ログアウトできるようにする。

**Architecture:** Server Component で session と本人サブスクを取得し、shadcn `Card` で表示。Header は Server のまま、Avatar 部分のみ `UserMenu` (Client) に差し替えて DropdownMenu を内包する。月額合計は既存の `toMonthly()` を流用し、共通の集計関数 `getMonthlyTotal()` を `src/lib/subscriptions.ts` に追加して dashboard / mypage で再利用する。

**Tech Stack:** Next.js 16 App Router (Server Components), Better Auth (`authClient.signOut`), shadcn/ui (`Card`, `DropdownMenu`), Tailwind 4 (ライトテーマ固定), Biome 2

**Spec:** `docs/plans/2026-05-26-mypage-minimum-design.md`

---

## ファイル構成

| 種別 | パス | 役割 |
|---|---|---|
| 新規 | `src/components/layout/UserMenu.tsx` | Client。Avatar + DropdownMenu + signOut |
| 変更 | `src/components/layout/Header.tsx` | props に `userEmail` を追加、Avatar div を `UserMenu` に差し替え |
| 変更 | `src/app/mypage/page.tsx` | 全面書き換え。Server Component で session + listAll + 集計を表示 |
| 変更 | `src/app/dashboard/page.tsx` | `Header` に `userEmail` を渡す |
| 変更 | `src/lib/subscriptions.ts` | `getMonthlyTotal()` を追加 |
| 削除 | `src/components/sign-out-button.tsx` | 参照消失後に削除 |

**事前確認:** 現状 `src/components/layout/Header.tsx` の Avatar は `<div>` で表示されており、props は `userName: string` のみ。`src/app/dashboard/page.tsx` の `<Header userName={...} />` 呼び出しが Header の唯一の利用箇所であることを確認済み。

---

## Task 1: `getMonthlyTotal()` を共通化

**Files:**
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: `getMonthlyTotal()` を `src/lib/subscriptions.ts` の末尾に追加**

```typescript
import { toMonthly } from './billing';
// 既存 import 群に上記を追加 (重複していれば不要)

export function getMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((acc, s) => acc + toMonthly(s.price, s.billingCycle), 0);
}
```

- [ ] **Step 2: `pnpm tsc --noEmit` を実行**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/lib/subscriptions.ts
git commit -m "refactor(subscriptions): extract getMonthlyTotal helper"
```

---

## Task 2: `UserMenu` Client Component を新規作成

**Files:**
- Create: `src/components/layout/UserMenu.tsx`

- [ ] **Step 1: `UserMenu.tsx` を新規作成**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

type Props = {
  userName: string;
  userEmail: string;
};

export function UserMenu({ userName, userEmail }: Props) {
  const router = useRouter();
  const initials = userName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="アカウントメニュー"
          className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-violet-600 font-semibold text-white text-xs"
          title={userName}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-medium text-sm text-stone-900">{userName}</div>
          <div className="text-stone-500 text-xs">{userEmail}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/mypage">マイページ</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>ログアウト</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit` を実行**

期待: エラーなし。`src/components/ui/dropdown-menu.tsx` から名前付き export が見つかればOK (既存)。

- [ ] **Step 3: コミット**

```bash
git add src/components/layout/UserMenu.tsx
git commit -m "feat(layout): add UserMenu with dropdown and signOut"
```

---

## Task 3: `Header` を `UserMenu` に差し替え

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: `Header.tsx` を以下に置き換え**

```tsx
import Link from 'next/link';
import { UserMenu } from './UserMenu';

type Props = {
  userName: string;
  userEmail: string;
};

export function Header({ userName, userEmail }: Props) {
  return (
    <header className="sticky top-0 z-40 border-stone-200/60 border-b bg-[#f7f5f2]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-sm text-stone-900 tracking-tight">subscx</span>
          <nav className="hidden items-center gap-1 sm:flex">
            {(['サービス', 'カレンダー', '設定'] as const).map((label) => (
              <Link
                key={label}
                href="#"
                className="rounded-lg px-3 py-1.5 font-medium text-stone-500 text-xs transition-colors hover:bg-stone-100/80 hover:text-stone-900"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="通知"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v3.5L2 11v.5h12V11l-1.5-1.5V6C12.5 3.5 10.5 1.5 8 1.5ZM6.5 12a1.5 1.5 0 0 0 3 0"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <UserMenu userName={userName} userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit` を実行**

期待: `src/app/dashboard/page.tsx` で `userEmail` 未指定エラーが出ること (Task 4 で解消)。

- [ ] **Step 3: コミット** (型エラー解消後にまとめる方針なので、ここでは未コミットでもOK。Task 4 とまとめて 1 コミットも可)

---

## Task 4: `dashboard/page.tsx` で `userEmail` を渡す

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Header 呼び出し箇所を更新**

`<Header userName={session.user.name ?? session.user.email} />` を以下に置き換え:

```tsx
<Header userName={session.user.name ?? session.user.email} userEmail={session.user.email} />
```

- [ ] **Step 2: `pnpm tsc --noEmit` を実行**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/layout/Header.tsx src/app/dashboard/page.tsx
git commit -m "feat(layout): wire UserMenu into Header with userEmail prop"
```

---

## Task 5: `/mypage` を実装

**Files:**
- Modify: `src/app/mypage/page.tsx`

- [ ] **Step 1: `page.tsx` を全面書き換え**

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { formatYmdInAppTimeZone } from '@/lib/billing';
import { getSession } from '@/lib/get-session';
import { getMonthlyTotal, listAll } from '@/lib/subscriptions';

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);
  const monthlyTotal = getMonthlyTotal(subs);
  const createdAt = formatYmdInAppTimeZone(new Date(session.user.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} userEmail={session.user.email} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-6 font-semibold text-stone-900 text-xl">マイページ</h1>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>アカウント</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="お名前" value={session.user.name ?? '未設定'} />
              <Row label="メールアドレス" value={session.user.email} />
              <Row label="登録日" value={createdAt.replace(/-/g, '/')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>サブスク</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="登録件数" value={`${subs.length} 件`} />
              <Row label="月額合計" value={`¥${monthlyTotal.toLocaleString('ja-JP')}`} />
            </CardContent>
          </Card>
        </div>

        <nav className="mt-8">
          <Link href="/dashboard" className="text-stone-600 text-sm hover:text-stone-900">
            ← ダッシュボードへ戻る
          </Link>
        </nav>
      </main>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-stone-100 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit` を実行**

期待: エラーなし。Better Auth の `session.user.createdAt` 型が `Date | string` の場合、`new Date(...)` で吸収可能。`Date` 型のみなら `new Date(session.user.createdAt)` でも問題なし。

- [ ] **Step 3: コミット**

```bash
git add src/app/mypage/page.tsx
git commit -m "feat(mypage): implement account info and subscription summary"
```

---

## Task 6: 不要になった `sign-out-button.tsx` を削除

**Files:**
- Delete: `src/components/sign-out-button.tsx`

- [ ] **Step 1: 参照確認**

Run:
```bash
grep -r "sign-out-button" src/ || echo "no references"
grep -r "SignOutButton" src/ || echo "no references"
```

期待: `no references` のみ表示される (signOut は `UserMenu` に集約されたため)。参照が残っていた場合は削除を中止し、本タスクをスキップ。

- [ ] **Step 2: 削除**

```bash
git rm src/components/sign-out-button.tsx
```

- [ ] **Step 3: `pnpm tsc --noEmit` と `pnpm lint` を実行**

期待: エラーなし。

- [ ] **Step 4: コミット**

```bash
git commit -m "chore: remove unused SignOutButton (replaced by UserMenu)"
```

---

## Task 7: 手動検証

**Files:** なし (ブラウザでの動作確認)

- [ ] **Step 1: dev サーバ起動**

```bash
pnpm dev
```

- [ ] **Step 2: 以下のチェックリストを順に実行**

1. ログイン状態で `/dashboard` を開く
2. ヘッダー右上のアバターをクリック → Dropdown が表示される
3. Dropdown 上部にユーザー名 (太字) とメール (薄色) が表示される
4. 「マイページ」をクリック → `/mypage` に遷移
5. 「アカウント」カードに名前・メール・登録日 (YYYY/MM/DD) が表示される
6. 「サブスク」カードに件数・月額合計 (¥カンマ区切り) が表示される
7. 「← ダッシュボードへ戻る」で `/dashboard` に戻る
8. アバター → Dropdown → 「ログアウト」を選択 → `/` に遷移
9. 再度 `/dashboard` にアクセス → `/login` にリダイレクトされる
10. キーボード操作: Tab でアバターにフォーカス → Enter で Dropdown が開く → 矢印キーで項目移動 → Enter で選択できる

- [ ] **Step 3: 最終チェック**

```bash
pnpm tsc --noEmit
pnpm lint
```

期待: 両方ともエラーなし。`pnpm lint` の自動ソート差分が出る場合は `pnpm lint --write ./src` を実行してから再コミット。

---

## 受け入れ基準 (Definition of Done)

- [ ] `/mypage` でアカウント情報 (名前・メール・登録日) が表示される
- [ ] `/mypage` でサブスクの件数と月額合計が表示される
- [ ] ヘッダーのアバタークリックで DropdownMenu が開く
- [ ] Dropdown からマイページ遷移とログアウトが動作する
- [ ] `sign-out-button.tsx` が削除されている (or 参照が残るなら未削除であることが意図的)
- [ ] ダークモード関連コード (`dark:`, `next-themes` 等) が一切追加されていない
- [ ] `pnpm tsc --noEmit` / `pnpm lint` が通る
- [ ] 上記の手動検証 10 項目すべて通過

---

## 補足: 判断指針

- **編集 UI を出さない**: 名前変更・メール変更・パスワード変更はすべて非ゴール (spec 準拠)。Input / Button / Form を `/mypage` に追加しない。
- **`session.user.createdAt`**: Better Auth が `Date` を返すが、型上 `string | Date` の場合に備え `new Date(...)` でラップ。
- **ライトテーマ固定**: `dark:` バリアントを追加しない (CLAUDE.md)。
- **月額合計の重複定義禁止**: dashboard の reduce ロジックも `getMonthlyTotal(subs)` に置き換えるリファクタは**今回は実施しない** (Task 1 で関数だけ追加し、mypage のみ利用。dashboard 側は v1 polish のスコープ外として温存)。`yearlyTotal` は dashboard 固有のため引き続きインライン。
