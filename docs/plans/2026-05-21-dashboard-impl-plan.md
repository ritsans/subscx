# ダッシュボード UI 実装計画

> **エージェント作業者向け:** 必須サブスキル: `superpowers:subagent-driven-development`(推奨) または `superpowers:executing-plans` を使い、タスク単位で実装する。ステップはチェックボックス (`- [ ]`) で進捗管理する。

**ゴール:** ダッシュボード1画面と、サービスの追加・編集モーダル(CRUD)を完成させる。

**設計方針:** Server Component をデフォルトとし、`use client` は操作が必要な末端だけに付ける。書き込みは Server Actions、集計はサーバーで計算。一覧のカテゴリフィルタのみクライアントで絞り込む。

**技術スタック:** Next.js 16 (App Router) / React 19 / TypeScript / Drizzle ORM + Turso / Tailwind 4 / shadcn/ui / zod / simple-icons / Biome 2

**参照:** `docs/plans/2026-05-21-dashboard-ui-design.md` / `docs/spec.md`

**前提・注意:**
- このプロジェクトにはテストフレームワークが無い。新規ライブラリ追加は禁止のため、各タスクの検証は `pnpm tsc --noEmit`(型チェック)・`pnpm lint`(Biome)・ブラウザでの目視確認で行う。
- `process.env` を直接参照しない。サーバー専用の値は `src/lib/env.ts` の `env` 経由。
- 全 DB クエリで `user_id` を必須にする。
- 3ディレクトリ構造厳守: `src/app` / `src/components` / `src/lib`。新ディレクトリは `src/components/ui/`(shadcn 生成物)のみ承認済み。
- パッケージマネージャは `pnpm`。

---

## ファイル構成

新規作成 / 変更するファイルと役割:

| ファイル | 区分 | 役割 |
|----------|------|------|
| `package.json` | 変更 | 依存追加 |
| `components.json` | 新規 | shadcn 設定 |
| `src/app/globals.css` | 変更 | shadcn テーマ CSS 変数 |
| `src/components/ui/*` | 新規 | shadcn 生成コンポーネント |
| `src/lib/schema.ts` | 新規 | `subscriptions` テーブル + auth-schema 再エクスポート |
| `src/lib/db.ts` | 新規 | Drizzle + Turso クライアントのシングルトン |
| `src/lib/types.ts` | 新規 | `Subscription` / `BillingCycle` / `Category` 型と定数 |
| `src/lib/billing.ts` | 新規 | 月額・年額換算の純粋関数 |
| `src/lib/icon-map.ts` | 新規 | サービス名 → simple-icons ブランド解決 |
| `src/lib/subscriptions.ts` | 新規 | CRUD クエリ(全件 `user_id` 必須) |
| `src/lib/utils.ts` | 新規 | shadcn の `cn` ヘルパー |
| `src/app/actions.ts` | 新規 | Server Actions(create / update / remove) |
| `src/app/dashboard/page.tsx` | 変更 | セッション → DB 読込 → 集計 → 描画 |
| `src/components/app-header.tsx` | 新規 | ヘッダー(client、ナビ active 判定) |
| `src/components/summary-cards.tsx` | 新規 | サマリーカード3枚(server) |
| `src/components/category-pill.tsx` | 新規 | カテゴリチップ / ラベル共用部品(server) |
| `src/components/service-icon.tsx` | 新規 | ブランドアイコン + 頭文字バッジ(server) |
| `src/components/subscription-card.tsx` | 新規 | サービスカード1枚(server) |
| `src/components/subscription-form.tsx` | 新規 | 追加・編集共用フォーム(client、モーダル中身) |
| `src/components/subscription-list.tsx` | 新規 | 一覧 + カテゴリフィルタ(client) |
| `drizzle.config.ts` | 変更 | schema パスを `schema.ts` に変更 |
| `docs/plan.md` | 変更 | 実装 Todo リスト追記(本計画の最後) |

---

## Task 1: 依存パッケージの追加と shadcn 初期化

**Files:**
- Modify: `package.json`
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: zod と simple-icons をインストール**

```bash
pnpm add zod simple-icons
```

- [ ] **Step 2: shadcn/ui を初期化**

```bash
pnpm dlx shadcn@latest init
```

対話プロンプトでの回答:
- スタイル: `New York`(または `Default`)
- ベースカラー: `Slate`
- CSS 変数を使う: `Yes`

これで `components.json`・`src/lib/utils.ts`(`cn` ヘルパー)が生成され、`src/app/globals.css` に shadcn のテーマ CSS 変数が追記され、`class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react` / `tw-animate-css` などの依存が `package.json` に追加される。

- [ ] **Step 3: 必要な shadcn コンポーネントを追加**

```bash
pnpm dlx shadcn@latest add dialog button input label select textarea
```

`src/components/ui/` に `dialog.tsx` `button.tsx` `input.tsx` `label.tsx` `select.tsx` `textarea.tsx` が生成される。

- [ ] **Step 4: 型チェックと lint が通ることを確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし(Biome が `src/components/ui/` の生成コードに警告を出す場合は、`biome.json` で `src/components/ui` を `files.includes` から除外するか `assist`/`linter` を `off` にする。除外する場合は次のステップでコミットに含める)。

- [ ] **Step 5: コミット**

```bash
git add package.json pnpm-lock.yaml components.json src/lib/utils.ts src/app/globals.css src/components/ui biome.json
git commit -m "chore: add shadcn/ui, zod, simple-icons for dashboard UI"
```

---

## Task 2: 型定義とカテゴリ定数

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: `src/lib/types.ts` を作成**

```typescript
export const CATEGORIES = ['AI', 'エンタメ', '仕事', '音楽', '買い物'] as const;
export type Category = (typeof CATEGORIES)[number];

export type BillingCycle = 'monthly' | 'yearly';

export type Subscription = {
  id: string;
  userId: string;
  name: string;
  category: Category;
  price: number;
  billingCycle: BillingCycle;
  nextBillingDate: string; // ISO date string (YYYY-MM-DD)
  note: string | null;
  createdAt: Date | null;
};

// カテゴリごとの色。頭文字バッジ背景・カテゴリチップで共用する。
export const CATEGORY_COLORS: Record<Category, string> = {
  AI: '#7c3aed',
  エンタメ: '#db2777',
  仕事: '#2563eb',
  音楽: '#16a34a',
  買い物: '#ea580c',
};
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/lib/types.ts
git commit -m "feat: add subscription domain types and category constants"
```

---

## Task 3: subscriptions スキーマと DB クライアント

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/db.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: `src/lib/schema.ts` を作成**

`auth-schema.ts` を re-export し、`subscriptions` テーブルを追加する。`drizzle-kit push` がこのファイルを見れば全テーブルを一括管理できる。

```typescript
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export * from './auth-schema';

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    price: integer('price').notNull(),
    billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).notNull(),
    nextBillingDate: text('next_billing_date').notNull(), // YYYY-MM-DD
    note: text('note'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => [
    index('subscriptions_user_id_idx').on(table.userId),
    index('subscriptions_user_next_billing_idx').on(table.userId, table.nextBillingDate),
  ],
);
```

- [ ] **Step 2: `src/lib/db.ts` を作成**

`auth.ts` 内でインラインに作っていた Drizzle クライアントを、アプリ全体で共有するシングルトンに切り出す。

```typescript
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { env } from './env';

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

- [ ] **Step 3: `drizzle.config.ts` の schema パスを変更**

`schema.ts` が `auth-schema.ts` を re-export するので、参照先を切り替える。

変更前:

```typescript
  schema: './src/lib/auth-schema.ts',
```

変更後:

```typescript
  schema: './src/lib/schema.ts',
```

- [ ] **Step 4: スキーマを Turso に反映**

```bash
pnpm drizzle-kit push
```

期待: `subscriptions` テーブルとインデックス2件が作成される。既存の auth 4テーブルは差分なし。

- [ ] **Step 5: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 6: コミット**

```bash
git add src/lib/schema.ts src/lib/db.ts drizzle.config.ts
git commit -m "feat: add subscriptions table schema and shared db client"
```

---

## Task 4: 集計ロジック (billing.ts)

**Files:**
- Create: `src/lib/billing.ts`

- [ ] **Step 1: `src/lib/billing.ts` を作成**

純粋関数のみ。yearly は12で割って四捨五入、monthly はそのまま。

```typescript
import type { BillingCycle, Subscription } from './types';

// 1件を月額換算する。yearly は /12 して四捨五入。
export function toMonthly(price: number, cycle: BillingCycle): number {
  return cycle === 'yearly' ? Math.round(price / 12) : price;
}

// 全件を月額換算して合計する。
export function monthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => sum + toMonthly(s.price, s.billingCycle), 0);
}

// 月額合計の12倍を年額換算とする。
export function yearlyTotal(subs: Subscription[]): number {
  return monthlyTotal(subs) * 12;
}
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: 動作を手早く確認**

`node` で挙動を確認する(任意、型チェックが通れば省略可)。

```bash
node -e "const {toMonthly}=require('./src/lib/billing.ts'); " 2>/dev/null || echo "tsは直接requireできない。型チェックのみで可"
```

ロジック確認: `toMonthly(12000, 'yearly')` は `1000`、`toMonthly(1000, 'monthly')` は `1000`、`toMonthly(10000, 'yearly')` は `833`(四捨五入)。

- [ ] **Step 4: コミット**

```bash
git add src/lib/billing.ts
git commit -m "feat: add billing conversion pure functions"
```

---

## Task 5: アイコン解決 (icon-map.ts)

**Files:**
- Create: `src/lib/icon-map.ts`

- [ ] **Step 1: simple-icons の import 形式を確認**

```bash
node -e "const si=require('simple-icons'); const k=Object.keys(si).find(x=>x.startsWith('si')); console.log(k, si[k]);"
```

期待: `siNetflix { title, slug, hex, path, ... }` のような出力。`simple-icons` は `siXxx` という名前付きエクスポートで各ブランドを公開し、各オブジェクトは `title` `slug` `hex`(色、`#` なし)`path`(SVG パスデータ)を持つ。

- [ ] **Step 2: `src/lib/icon-map.ts` を作成**

サービス名を正規化(小文字化・空白除去)し、simple-icons の slug と照合する。見つかれば SVG パスとカラーを返し、無ければ `null`(呼び出し側が頭文字バッジにフォールバック)。

```typescript
import * as simpleIcons from 'simple-icons';

export type BrandIcon = {
  path: string; // SVG path data
  hex: string; // brand color, with leading '#'
};

type SimpleIcon = { title: string; slug: string; hex: string; path: string };

// slug -> アイコン の索引を一度だけ構築する。
const bySlug = new Map<string, SimpleIcon>();
for (const value of Object.values(simpleIcons)) {
  if (value && typeof value === 'object' && 'slug' in value) {
    const icon = value as SimpleIcon;
    bySlug.set(icon.slug, icon);
  }
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '');
}

// サービス名からブランドアイコンを解決する。見つからなければ null。
export function resolveBrandIcon(serviceName: string): BrandIcon | null {
  const icon = bySlug.get(normalize(serviceName));
  if (!icon) return null;
  return { path: icon.path, hex: `#${icon.hex}` };
}
```

- [ ] **Step 3: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。`simple-icons` の型が解決できない場合は `pnpm add -D @types/simple-icons` ではなく(型定義は本体同梱)、本体のバージョンを確認する。

- [ ] **Step 4: コミット**

```bash
git add src/lib/icon-map.ts
git commit -m "feat: add brand icon resolution from simple-icons"
```

---

## Task 6: CRUD クエリ (subscriptions.ts)

**Files:**
- Create: `src/lib/subscriptions.ts`

- [ ] **Step 1: `src/lib/subscriptions.ts` を作成**

全クエリで `userId` を必須にする。一覧は `nextBillingDate` 昇順。update / remove は `id` と `userId` の両方を条件にして他人のレコードを操作できないようにする。

```typescript
import { and, asc, eq } from 'drizzle-orm';
import { db } from './db';
import { subscriptions } from './schema';
import type { Category, Subscription } from './types';

type SubscriptionInput = {
  name: string;
  category: Category;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  note: string | null;
};

// ユーザーの全サブスクを次回請求日の昇順で返す。
export async function listAll(userId: string): Promise<Subscription[]> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(asc(subscriptions.nextBillingDate));
  return rows as Subscription[];
}

// 1件取得。他人のレコードは取得できない。
export async function getOne(userId: string, id: string): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
  return (rows[0] as Subscription) ?? null;
}

export async function create(userId: string, input: SubscriptionInput): Promise<void> {
  await db.insert(subscriptions).values({ userId, ...input });
}

// id と userId の両方が一致した時だけ更新する。
export async function update(userId: string, id: string, input: SubscriptionInput): Promise<void> {
  await db
    .update(subscriptions)
    .set(input)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}

// id と userId の両方が一致した時だけ削除する。
export async function remove(userId: string, id: string): Promise<void> {
  await db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
}
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/lib/subscriptions.ts
git commit -m "feat: add subscription CRUD queries with user_id scoping"
```

---

## Task 7: Server Actions (actions.ts)

**Files:**
- Create: `src/app/actions.ts`

- [ ] **Step 1: `src/app/actions.ts` を作成**

`useActionState` 用に第1引数 `prevState`、第2引数 `formData` のシグネチャ。zod で検証し、`getSession()` で `userId` を取得、DB を更新したら `revalidatePath('/dashboard')`。エラーはフォームへ返す。

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/get-session';
import * as repo from '@/lib/subscriptions';
import { CATEGORIES } from '@/lib/types';

export type FormState = {
  error: string | null;
};

const schema = z.object({
  name: z.string().trim().min(1, '名前は必須です'),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().int('料金は整数で入力してください').positive('料金は正の数で入力してください'),
  billingCycle: z.enum(['monthly', 'yearly']),
  nextBillingDate: z.iso.date('有効な日付を入力してください'),
  note: z
    .string()
    .trim()
    .nullable()
    .transform((v) => (v ? v : null)),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    price: formData.get('price'),
    billingCycle: formData.get('billingCycle'),
    nextBillingDate: formData.get('nextBillingDate'),
    note: formData.get('note'),
  });
}

export async function createSubscription(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'ログインが必要です' };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力エラー' };
  }

  await repo.create(session.user.id, parsed.data);
  revalidatePath('/dashboard');
  return { error: null };
}

export async function updateSubscription(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'ログインが必要です' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { error: '対象が不明です' };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力エラー' };
  }

  await repo.update(session.user.id, id, parsed.data);
  revalidatePath('/dashboard');
  return { error: null };
}

export async function removeSubscription(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'ログインが必要です' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { error: '対象が不明です' };

  await repo.remove(session.user.id, id);
  revalidatePath('/dashboard');
  return { error: null };
}
```

- [ ] **Step 2: zod の API バージョン差異を確認**

```bash
node -e "const z=require('zod'); console.log(require('zod/package.json').version); console.log(typeof z.z?.iso, typeof z.iso);"
```

期待: zod v4 系なら `z.iso.date()` と `z.enum(配列)` が使える。もし v3 系がインストールされた場合は `z.iso.date()` を `z.string().refine((s) => !Number.isNaN(Date.parse(s)), '有効な日付を入力してください')` に、`z.enum(CATEGORIES)` を `z.enum(CATEGORIES as unknown as [string, ...string[]])` に置き換える。

- [ ] **Step 3: 型チェックと lint を確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし。

- [ ] **Step 4: コミット**

```bash
git add src/app/actions.ts
git commit -m "feat: add subscription create/update/remove server actions"
```

---

## Task 8: カテゴリチップ部品 (category-pill.tsx)

**Files:**
- Create: `src/components/category-pill.tsx`

- [ ] **Step 1: `src/components/category-pill.tsx` を作成**

カテゴリラベル表示と、フィルタチップの両方で使う server component。`active` と `onClick` は任意で、フィルタ用途のとき client 側から渡される(この部品自体は `use client` を付けない。state は持たない)。

```tsx
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  category: Category;
  active?: boolean;
  onClick?: () => void;
};

// カテゴリチップ / ラベルの共用部品。onClick が無ければ純粋なラベル。
export function CategoryPill({ category, active, onClick }: Props) {
  const color = CATEGORY_COLORS[category];
  const className = cn(
    'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors',
    onClick && 'cursor-pointer',
    active ? 'text-white' : 'text-foreground/70',
  );
  const style = active ? { backgroundColor: color } : { backgroundColor: `${color}1a` };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {category}
      </button>
    );
  }
  return (
    <span className={className} style={style}>
      {category}
    </span>
  );
}
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/category-pill.tsx
git commit -m "feat: add category pill shared component"
```

---

## Task 9: サービスアイコン部品 (service-icon.tsx)

**Files:**
- Create: `src/components/service-icon.tsx`

- [ ] **Step 1: `src/components/service-icon.tsx` を作成**

`resolveBrandIcon` でブランドを引き、見つかれば SVG、無ければ頭文字バッジ(カテゴリ色背景)を表示する server component。

```tsx
import { resolveBrandIcon } from '@/lib/icon-map';
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

type Props = {
  name: string;
  category: Category;
  size?: number;
};

// ブランドアイコンを解決。無ければ頭文字バッジにフォールバックする。
export function ServiceIcon({ name, category, size = 40 }: Props) {
  const brand = resolveBrandIcon(name);

  if (brand) {
    return (
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: size, height: size, backgroundColor: `${brand.hex}1a` }}
      >
        <svg
          role="img"
          aria-label={name}
          viewBox="0 0 24 24"
          width={size * 0.55}
          height={size * 0.55}
          fill={brand.hex}
        >
          <path d={brand.path} />
        </svg>
      </div>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex items-center justify-center rounded-lg font-bold text-white"
      style={{ width: size, height: size, backgroundColor: CATEGORY_COLORS[category] }}
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/service-icon.tsx
git commit -m "feat: add service icon with brand resolution and initial fallback"
```

---

## Task 10: フォーム本体 (subscription-form.tsx)

**Files:**
- Create: `src/components/subscription-form.tsx`

- [ ] **Step 1: `src/components/subscription-form.tsx` を作成**

追加・編集の共用フォーム。モーダルの中身。`subscription` prop があれば編集モード、無ければ追加モード。`useActionState` でエラーとペンディング状態を扱う。編集モードでは削除ボタンも置く。送信成功時(`state.error === null` かつ送信済み)に `onSuccess` を呼んでモーダルを閉じる。

```tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createSubscription, type FormState, removeSubscription, updateSubscription } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

const initialState: FormState = { error: null };

type Props = {
  subscription?: Subscription;
  onSuccess: () => void;
};

export function SubscriptionForm({ subscription, onSuccess }: Props) {
  const isEdit = Boolean(subscription);
  const action = isEdit ? updateSubscription : createSubscription;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeSubscription, initialState);
  const submitted = useRef(false);

  // 送信が完了しエラーが無ければモーダルを閉じる。
  useEffect(() => {
    if (submitted.current && !pending && state.error === null) {
      submitted.current = false;
      onSuccess();
    }
  }, [pending, state.error, onSuccess]);

  useEffect(() => {
    if (submitted.current && !removePending && removeState.error === null) {
      submitted.current = false;
      onSuccess();
    }
  }, [removePending, removeState.error, onSuccess]);

  return (
    <div className="space-y-4">
      <form action={formAction} onSubmit={() => { submitted.current = true; }} className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={subscription?.id} />}

        <div className="space-y-1.5">
          <Label htmlFor="name">サービス名</Label>
          <Input id="name" name="name" defaultValue={subscription?.name} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">カテゴリ</Label>
          <Select name="category" defaultValue={subscription?.category ?? CATEGORIES[0]}>
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

        <div className="space-y-1.5">
          <Label htmlFor="price">料金 (円)</Label>
          <Input id="price" name="price" type="number" min={1} defaultValue={subscription?.price} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="billingCycle">課金サイクル</Label>
          <Select name="billingCycle" defaultValue={subscription?.billingCycle ?? 'monthly'}>
            <SelectTrigger id="billingCycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">月額</SelectItem>
              <SelectItem value="yearly">年額</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextBillingDate">次回請求日</Label>
          <Input
            id="nextBillingDate"
            name="nextBillingDate"
            type="date"
            defaultValue={subscription?.nextBillingDate}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">メモ</Label>
          <Textarea id="note" name="note" defaultValue={subscription?.note ?? ''} />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? '保存中...' : isEdit ? '更新する' : '追加する'}
        </Button>
      </form>

      {isEdit && (
        <form action={removeAction} onSubmit={() => { submitted.current = true; }}>
          <input type="hidden" name="id" value={subscription?.id} />
          {removeState.error && <p className="text-sm text-red-600">{removeState.error}</p>}
          <Button type="submit" variant="destructive" disabled={removePending} className="w-full">
            {removePending ? '削除中...' : '削除する'}
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: shadcn の select / textarea のエクスポート名を確認**

```bash
grep -E "^export" src/components/ui/select.tsx src/components/ui/textarea.tsx src/components/ui/button.tsx
```

期待: `Select` `SelectContent` `SelectItem` `SelectTrigger` `SelectValue` / `Textarea` / `Button`。名前が違う場合は import を実態に合わせて修正する。

- [ ] **Step 3: 型チェックと lint を確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし。

- [ ] **Step 4: コミット**

```bash
git add src/components/subscription-form.tsx
git commit -m "feat: add shared subscription add/edit form"
```

---

## Task 11: サービスカード (subscription-card.tsx)

**Files:**
- Create: `src/components/subscription-card.tsx`

- [ ] **Step 1: `src/components/subscription-card.tsx` を作成**

サービス1件を表示する。クリックで編集モーダルを開くため、カード全体は client のラッパーでくるむ想定だが、表示自体は純粋なので server component として作り、開閉トリガは `subscription-list.tsx` 側が担う。ここではカードの見た目だけを返し、`onEdit` コールバックを受ける(`onEdit` がある場合のみクリック可能)。

```tsx
'use client';

import { ServiceIcon } from '@/components/service-icon';
import { CategoryPill } from '@/components/category-pill';
import { toMonthly } from '@/lib/billing';
import type { Subscription } from '@/lib/types';

type Props = {
  subscription: Subscription;
  onEdit: (s: Subscription) => void;
};

// サービスカード1枚。クリックで編集モーダルを開く。
export function SubscriptionCard({ subscription, onEdit }: Props) {
  const monthly = toMonthly(subscription.price, subscription.billingCycle);

  return (
    <button
      type="button"
      onClick={() => onEdit(subscription)}
      className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md"
    >
      <ServiceIcon name={subscription.name} category={subscription.category} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{subscription.name}</div>
        <div className="mt-1">
          <CategoryPill category={subscription.category} />
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{monthly.toLocaleString('ja-JP')}円</div>
        <div className="text-xs text-foreground/60">
          {subscription.billingCycle === 'yearly' ? '月額換算' : '月額'}
        </div>
      </div>
    </button>
  );
}
```

注: 当初の設計では server component と書いたが、編集モーダルを開くクリックハンドラを受けるため client にする。設計意図(末端だけ client)からは外れないが、カードはリスト内のインタラクティブ要素なので client が妥当。

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/subscription-card.tsx
git commit -m "feat: add subscription card component"
```

---

## Task 12: 一覧 + カテゴリフィルタ + モーダル (subscription-list.tsx)

**Files:**
- Create: `src/components/subscription-list.tsx`

- [ ] **Step 1: `src/components/subscription-list.tsx` を作成**

`use client`。サーバーから受け取った配列を保持し、選択中カテゴリで `filter` する。「+ サービスを追加」と各カードのクリックで shadcn `Dialog` を開く。追加と編集で同じ Dialog を使い回し、開いている対象を state で持つ。

```tsx
'use client';

import { useState } from 'react';
import { CategoryPill } from '@/components/category-pill';
import { SubscriptionCard } from '@/components/subscription-card';
import { SubscriptionForm } from '@/components/subscription-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Category, Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

type Props = {
  subscriptions: Subscription[];
};

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; target: Subscription };

export function SubscriptionList({ subscriptions }: Props) {
  const [selected, setSelected] = useState<Category | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });

  const visible = selected ? subscriptions.filter((s) => s.category === selected) : subscriptions;

  const closeModal = () => setModal({ mode: 'closed' });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">サービス一覧</h2>
        <Button onClick={() => setModal({ mode: 'create' })}>+ サービスを追加</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            selected === null ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground/70'
          }`}
        >
          すべて
        </button>
        {CATEGORIES.map((c) => (
          <CategoryPill key={c} category={c} active={selected === c} onClick={() => setSelected(c)} />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-foreground/60">登録されたサービスがありません</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((s) => (
            <SubscriptionCard key={s.id} subscription={s} onEdit={(t) => setModal({ mode: 'edit', target: t })} />
          ))}
        </div>
      )}

      <Dialog open={modal.mode !== 'closed'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.mode === 'edit' ? 'サービスを編集' : 'サービスを追加'}</DialogTitle>
          </DialogHeader>
          {modal.mode === 'edit' ? (
            <SubscriptionForm subscription={modal.target} onSuccess={closeModal} />
          ) : modal.mode === 'create' ? (
            <SubscriptionForm onSuccess={closeModal} />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
```

- [ ] **Step 2: shadcn の dialog エクスポート名を確認**

```bash
grep -E "^export" src/components/ui/dialog.tsx
```

期待: `Dialog` `DialogContent` `DialogHeader` `DialogTitle` を含む。違えば import を修正。

- [ ] **Step 3: 型チェックと lint を確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし。

- [ ] **Step 4: コミット**

```bash
git add src/components/subscription-list.tsx
git commit -m "feat: add subscription list with category filter and modal"
```

---

## Task 13: サマリーカード (summary-cards.tsx)

**Files:**
- Create: `src/components/summary-cards.tsx`

- [ ] **Step 1: `src/components/summary-cards.tsx` を作成**

server component。月額合計・年額換算・登録件数の3枚を表示する。値は page から props で受ける(集計は page 側で実行)。

```tsx
type Props = {
  monthly: number;
  yearly: number;
  count: number;
};

// サマリーカード3枚。集計値は page から受け取る。
export function SummaryCards({ monthly, yearly, count }: Props) {
  const cards = [
    { label: '今月の合計', value: `${monthly.toLocaleString('ja-JP')}円` },
    { label: '年額換算', value: `${yearly.toLocaleString('ja-JP')}円` },
    { label: '登録件数', value: `${count}件` },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-4">
          <div className="text-sm text-foreground/60">{c.label}</div>
          <div className="mt-1 text-2xl font-bold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 型チェックを確認**

```bash
pnpm tsc --noEmit
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/summary-cards.tsx
git commit -m "feat: add summary cards component"
```

---

## Task 14: ヘッダー (app-header.tsx)

**Files:**
- Create: `src/components/app-header.tsx`

- [ ] **Step 1: `src/components/app-header.tsx` を作成**

`use client`(ナビの active 判定に `usePathname` を使う)。ロゴ・ナビ・通知ベル(飾り)・アバター。ナビは「ダッシュボード」のみ有効、「サービス」「カレンダー」「設定」はグレーアウトしてクリック不可。

```tsx
'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'ダッシュボード', href: '/dashboard', enabled: true },
  { label: 'サービス', href: '#', enabled: false },
  { label: 'カレンダー', href: '#', enabled: false },
  { label: '設定', href: '#', enabled: false },
];

type Props = {
  userName: string;
};

export function AppHeader({ userName }: Props) {
  const pathname = usePathname();
  const initial = userName.trim().charAt(0).toUpperCase() || '?';

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold">subscx</span>
        <nav className="flex gap-4">
          {navItems.map((item) => {
            const active = item.enabled && pathname === item.href;
            if (!item.enabled) {
              return (
                <span key={item.label} className="cursor-not-allowed text-sm text-foreground/30">
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm ${active ? 'font-semibold text-foreground' : 'text-foreground/60'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Bell className="size-5 text-foreground/40" aria-hidden />
        <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {initial}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 型チェックと lint を確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/app-header.tsx
git commit -m "feat: add app header with nav and decorative bell"
```

---

## Task 15: ダッシュボード画面の組み立て (dashboard/page.tsx)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: `src/app/dashboard/page.tsx` を全面的に書き換え**

セッション取得 → DB 読込 → 集計 → 各コンポーネントへ描画。`SignOutButton` はマイページに残すか、ここでは省く。あいさつ部に年月とユーザー名を出す。

```tsx
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { SubscriptionList } from '@/components/subscription-list';
import { SummaryCards } from '@/components/summary-cards';
import { monthlyTotal, yearlyTotal } from '@/lib/billing';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subscriptions = await listAll(session.user.id);
  const monthly = monthlyTotal(subscriptions);
  const yearly = yearlyTotal(subscriptions);

  const now = new Date();
  const yearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={session.user.name} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/60">{yearMonth}</p>
            <h1 className="text-xl font-bold">こんにちは、{session.user.name}さん</h1>
          </div>
        </div>

        <SummaryCards monthly={monthly} yearly={yearly} count={subscriptions.length} />
        <SubscriptionList subscriptions={subscriptions} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 型チェックと lint を確認**

```bash
pnpm tsc --noEmit && pnpm lint
```

期待: エラーなし。

- [ ] **Step 3: 開発サーバーで目視確認**

```bash
pnpm dev
```

ブラウザで `http://localhost:3000/dashboard` を開き(未ログインなら `/login` でログイン)、以下を確認:
- ヘッダーが表示され、「ダッシュボード」だけクリック可能、他3つはグレーアウト
- サマリーカード3枚が表示される(初期はすべて0)
- 「+ サービスを追加」でモーダルが開く
- フォーム入力 → 「追加する」でモーダルが閉じ、一覧にカードが出る
- カードクリックで編集モーダルが開き、値がプリフィルされている
- 値を変えて「更新する」で反映、「削除する」でカードが消える
- カテゴリチップで一覧が絞り込まれる
- 年額(yearly)で登録したサービスが月額換算で表示される(例: 12000円/年 → 1000円)
- ブランド名(例: Netflix)はブランドアイコン、未知の名前は頭文字バッジ

- [ ] **Step 4: コミット**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: build dashboard page with summary and subscription list"
```

---

## Task 16: 旧フォームページの廃止確認

**Files:**
- (削除対象なし — `src/app/new/` `src/app/edit/` は未作成のため作業不要)

- [ ] **Step 1: 旧ルートが存在しないことを確認**

```bash
ls src/app/new src/app/edit 2>/dev/null || echo "旧ルートは存在しない。削除作業不要"
```

期待: 「旧ルートは存在しない」。設計書で「`/new` と `/edit/[id]` は廃止する」と書いたが、これらは元々未作成(spec.md で 🔜)なので、作らないことで廃止が成立する。新規作成しないこと自体がこのタスクの達成条件。

- [ ] **Step 2: 確認のみ。コミット不要**

---

## Task 17: README と spec の状態更新

**Files:**
- Modify: `README.md`

- [ ] **Step 1: `README.md` の状態セクションを更新**

`## 現状` を「ダッシュボード UI / CRUD 実装完了」に、`## 次やること` の「UIの実装」にチェックを入れ、`## やったこと (新しい順)` の先頭に当日の作業を追記する。

```markdown
## 現状
ダッシュボード UI 実装完了。サブスク CRUD・月額/年額換算・カテゴリフィルタが動作する状態。

## 次やること
- [x] UIの実装
```

`## やったこと (新しい順)` の先頭に:

```markdown
- 2026-05-21: ダッシュボード UI 実装完了。サブスク CRUD・サマリーカード・カテゴリフィルタ・追加/編集モーダルを追加
```

- [ ] **Step 2: コミット**

```bash
git add README.md
git commit -m "docs: update README after dashboard UI implementation"
```

---

## 自己レビュー結果

- **設計書カバレッジ:** ページ構成(Task 15)・全コンポーネント(Task 8-15)・全 lib(Task 2-6)・Server Actions(Task 7)・データモデル enum(Task 2)・集計(Task 4)・アイコン(Task 5,9)・カテゴリフィルタ(Task 12)・書き込みフロー(Task 7,10)・バリデーション(Task 7)・追加するもの(Task 1)を網羅。`/new` `/edit` 廃止は Task 16。
- **設計からの逸脱:** `subscription-card.tsx` は設計書で server としたが、編集モーダルを開くクリックハンドラのため client にした(Task 11 ステップ1の注記参照)。`db.ts` は spec.md で ✅ とあったが実在しないため Task 3 で新規作成する。
- **型整合:** `Subscription` / `Category` / `BillingCycle` / `FormState` の名前と形は全タスクで一致。`repo.*`(subscriptions.ts)の関数名 `listAll` `getOne` `create` `update` `remove` は actions.ts の呼び出しと一致。
- **未確定リスク:** zod のメジャーバージョン(v3/v4 で `z.iso.date` と `z.enum` の API が違う)→ Task 7 ステップ2で確認・代替コードを明記。shadcn のエクスポート名 → Task 10,12 で grep 確認するステップを設置。
