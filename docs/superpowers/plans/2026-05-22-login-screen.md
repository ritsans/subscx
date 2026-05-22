# ログイン画面刷新 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デザインカンプ (`temp/Login.png`) に基づき `/login` ページを2カラムレイアウトに刷新し、ブランドパネルと機能するログインフォームを実装する。

**Architecture:** `src/components/auth/` に2つのコンポーネントを新設する。`BrandPanel` は純粋なサーバーコンポーネントで左側の装飾・コピー・プレビューカードを担当。`LoginForm` はクライアントコンポーネントでフォーム状態と `authClient.signIn.email` を使った送信処理を担当。`src/app/login/page.tsx` がこれら2つを2カラムグリッドに配置する。

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui (`Button`, `Input`, `Label`), Better Auth (`authClient.signIn.email`), lucide-react (`Eye`, `EyeOff`)

---

## ファイルマップ

| アクション | パス | 役割 |
|---|---|---|
| 新規作成 | `src/components/auth/BrandPanel.tsx` | 左パネル (装飾・キャッチ・プレビューカード) — Server Component |
| 新規作成 | `src/components/auth/LoginForm.tsx` | ログインフォーム — Client Component |
| 更新 | `src/app/login/page.tsx` | 2カラムレイアウト + 両コンポーネントの配置 |

---

### Task 1: BrandPanel コンポーネントを作成する

**Files:**
- Create: `src/components/auth/BrandPanel.tsx`

- [ ] **Step 1: `src/components/auth/BrandPanel.tsx` を作成する**

```tsx
// src/components/auth/BrandPanel.tsx

export function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-violet-50 px-12 py-10">
      {/* 右上の円形装飾 */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-violet-200/40" />
      <div className="pointer-events-none absolute -right-10 top-10 size-48 rounded-full bg-violet-300/20" />

      {/* ロゴ */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
          s
        </div>
        <span className="text-base font-semibold text-stone-800">subscx</span>
      </div>

      {/* メインコピー */}
      <div className="space-y-6">
        <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase">
          Subscriptions, Simplified
        </p>
        <h1 className="text-4xl font-bold leading-tight text-stone-900">
          毎月の
          <br />
          サブスクを、
          <br />
          ひと目で。
        </h1>
        <p className="text-sm leading-relaxed text-stone-500">
          登録しているサービスをまとめて管理。
          <br />
          合計金額・次回支払日・カテゴリ別の内訳が、
          <br />
          ひとつのダッシュボードで確認できます。
        </p>
      </div>

      {/* プレビューカード */}
      <div className="rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
        <p className="mb-3 text-xs text-stone-400">今月の合計</p>
        <div className="flex items-center gap-3">
          {/* カテゴリアイコンチップ (重ね表示) */}
          <div className="flex items-center">
            {[
              { label: "a", bg: "bg-violet-500" },
              { label: "N", bg: "bg-red-500" },
              { label: "S", bg: "bg-orange-400" },
              { label: "Ai", bg: "bg-blue-500" },
            ].map((chip, i) => (
              <div
                key={chip.label}
                className={`flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${chip.bg}`}
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {chip.label}
              </div>
            ))}
          </div>
          <span className="text-xl font-bold text-stone-900">¥18,450</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: lint を通す**

```bash
pnpm lint
```

エラーがあれば修正する。

- [ ] **Step 3: コミット**

```bash
git add src/components/auth/BrandPanel.tsx
git commit -m "feat: add BrandPanel component for login page"
```

---

### Task 2: LoginForm コンポーネントを作成する

**Files:**
- Create: `src/components/auth/LoginForm.tsx`

- [ ] **Step 1: `src/components/auth/LoginForm.tsx` を作成する**

```tsx
// src/components/auth/LoginForm.tsx
'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });
      if (err) {
        setError(err.message ?? 'ログインに失敗しました');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* 見出し */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-stone-900">ログイン</h2>
          <p className="text-sm text-stone-500">続けるにはアカウントにサインインしてください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* メールアドレス */}
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="yuki@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-lg"
            />
          </div>

          {/* パスワード */}
          <div className="space-y-1.5">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-lg pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* ログイン状態を保持 / パスワードを忘れた */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 accent-violet-600"
              />
              <span className="text-sm text-stone-600">ログイン状態を保持</span>
            </label>
            <span className="text-sm text-violet-600">パスワードを忘れた</span>
          </div>

          {/* エラー */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-lg bg-stone-900 text-sm font-medium text-white hover:bg-stone-800"
          >
            {pending ? '処理中...' : 'ログイン'}
          </Button>
        </form>

        {/* 区切り */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">または</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Google ボタン (UI のみ) */}
        <button
          type="button"
          disabled
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 opacity-60 cursor-not-allowed"
        >
          {/* Google SVG ロゴ */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"
            />
          </svg>
          Googleで続ける
        </button>

        {/* 新規登録リンク */}
        <p className="text-center text-sm text-stone-500">
          アカウントをお持ちでない?{' '}
          <Link href="/signup" className="font-medium text-violet-600 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型チェックを通す**

```bash
pnpm tsc --noEmit
```

エラーがあれば修正する。`authClient.signIn.email` の `rememberMe` パラメータが型エラーになる場合は `// @ts-ignore` ではなく `as Parameters<typeof authClient.signIn.email>[0]` で型を調整するか、`rememberMe` を省いて送信処理を調整する。

- [ ] **Step 3: lint を通す**

```bash
pnpm lint
```

- [ ] **Step 4: コミット**

```bash
git add src/components/auth/LoginForm.tsx
git commit -m "feat: add LoginForm component with rememberMe and password toggle"
```

---

### Task 3: login/page.tsx を2カラムレイアウトに更新する

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: `src/app/login/page.tsx` を書き換える**

```tsx
// src/app/login/page.tsx
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 2: lint & 型チェックを通す**

```bash
pnpm lint && pnpm tsc --noEmit
```

- [ ] **Step 3: コミット**

```bash
git add src/app/login/page.tsx
git commit -m "feat: refactor login page to two-column layout with BrandPanel and LoginForm"
```

---

### Task 4: 動作確認

- [ ] **Step 1: 開発サーバーを起動する**

```bash
pnpm dev
```

- [ ] **Step 2: `/login` をブラウザで開き見た目を確認する**

確認項目:
- lg以上 (≥1024px): 左パネルが表示され2カラムになっている
- lg未満 (<1024px): 右パネル (フォーム) のみ1カラムで表示される
- カンプ (`temp/Login.png`) と照合して装飾・コピー・プレビューカードが再現されている
- パスワード欄の「表示」アイコンをクリックするとマスクが解除される
- 「ログイン状態を保持」チェックがデフォルトONになっている

- [ ] **Step 3: 実アカウントでログイン成功を確認する**

既存アカウント (`dazzling3season@gmail.com` 等) でログインし `/dashboard` に遷移することを確認する。

- [ ] **Step 4: 誤った認証情報でエラー表示を確認する**

存在しないメールアドレスまたは誤ったパスワードで送信し、エラーメッセージが表示されることを確認する。

- [ ] **Step 5: 最終 lint & 型チェック**

```bash
pnpm lint && pnpm tsc --noEmit
```

どちらも0エラーであること。
