# v1 仕上げパック Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ダッシュボードに「7日以内 警告バッジ」「次回請求日の遅延評価」「主要サービスのロゴアイコン化」を追加し、v1 スコープを綺麗に閉じる。

**Architecture:** DB スキーマは変更しない。`nextBillingDate` の意味を「アンカー日」へ再定義し、`src/lib/billing.ts` に集約した純粋関数で表示のたびに次回課金日を算出する。アイコンは `simple-icons` の個別 import + 名前マップで主要サービスのみブランドロゴに差し替え、未登録は従来の頭文字バッジに落とす。

**Tech Stack:** Next.js 16 (App Router) / React 19 / TypeScript / Tailwind 4 / shadcn/ui / Drizzle ORM / Turso / `simple-icons` (新規)

**関連設計:**
- 設計書: `docs/superpowers/specs/2026-05-26-v1-polish-pack-design.md`
- Before/After 解説: `docs/superpowers/specs/2026-05-26-v1-polish-pack-before-after.md`

**前提知識 / プロジェクト規約:**
- ライトテーマ固定。`dark:` クラス・`.dark` セレクタ等は絶対に追加しない (`CLAUDE.md` 参照)
- ファイル構成は `src/app` / `src/components` / `src/lib` の 3 階層厳守
- single quote、semicolon あり、indent 2、lineWidth 120、JSX属性は double quote
- ライブラリインストールは自分で実行しない。コマンドを提示してユーザーに委ねる (例: `pnpm add simple-icons`)
- 本プランで **vitest を新規導入** する。テスト対象は `src/lib/billing.ts` の純粋関数のみ。UI コンポーネントのテストは書かない (目視検証で代替)

**Out of Scope (このプランでやらないこと):**
- DB スキーマ変更 / マイグレーション
- 7日以内警告の集約バナー (上部のまとめ表示)
- バッジの色分け2段階・過去日表示
- アイコンのユーザー手動選択 UI
- ダッシュボード以外のページの改修
- UI コンポーネントの自動テスト (React Testing Library 等)

**File Structure:**

| パス | 種別 | 責務 |
|------|------|------|
| `src/lib/billing.ts` | 新規 | 課金日・換算の純粋関数集約 (`nextBillingFrom` / `daysUntilNextBilling` / `toMonthly` / `toYearly`) |
| `src/lib/billing.test.ts` | 新規 | `billing.ts` のユニットテスト (vitest) |
| `vitest.config.ts` | 新規 | vitest 設定 (node 環境、TypeScript パス解決) |
| `tsconfig.json` | 修正 | `types: ["vitest/globals"]` を追加し、`describe` / `it` / `expect` をグローバルに |
| `src/lib/icon-map.ts` | 新規 | サービス名 (正規化済み) → simple-icons import の対応表 + `resolveIcon(name)` ヘルパー |
| `src/components/dashboard/ServiceIcon.tsx` | 新規 | 名前を受け取り、ロゴ or 頭文字バッジを描画する presentational コンポーネント |
| `src/components/dashboard/NextBillingBadge.tsx` | 新規 | 残日数を受け取り 0/1〜7/8+ で出し分ける丸型バッジ |
| `src/app/dashboard/page.tsx` | 修正 | `billing.ts` 経由で合計算出 / `today` を子に props で渡す / 並び替えを Server 側で実施 |
| `src/lib/subscriptions.ts` | 修正 | `listAll` の `orderBy` を撤去 |
| `src/components/dashboard/ServiceCard.tsx` | 修正 | `ServiceIcon` 採用 / `billing.ts` 経由で次回日・月額計算 / `NextBillingBadge` 統合 |
| `src/components/dashboard/ServiceGrid.tsx` | 修正 | `today` を受け取って `ServiceCard` に伝搬 |
| `src/lib/types.ts` | 修正 | `nextBillingDate` を「アンカー日」と明示するコメント追加 |
| `src/lib/schema.ts` | 修正 | 同上、Drizzle スキーマ側にもコメント |
| `README.md` | 修正 | 進捗欄を更新 |
| `package.json` | 修正 | `simple-icons` を追加 (ユーザーが `pnpm add` 実行) |

**実装順序の方針:** コメント追記 → vitest セットアップ → `billing.ts` を TDD で実装 → アイコン基盤 (`icon-map.ts` / `ServiceIcon.tsx`) → バッジ (`NextBillingBadge.tsx`) → 統合 (`ServiceCard` / `page.tsx` / `subscriptions.ts`) → ドキュメント。各タスク末で commit する。

**Task 番号対応表 (vitest 追加で番号変動):**

| # | 内容 |
|---|------|
| 1 | コメント追記 (types/schema) |
| 2 | **vitest セットアップ (新規)** |
| 3 | **`billing.ts` を TDD で実装 (旧 Task 2 を分割)** |
| 4 | `simple-icons` 依存追加 |
| 5 | `icon-map.ts` |
| 6 | `ServiceIcon.tsx` |
| 7 | `NextBillingBadge.tsx` |
| 8 | `subscriptions.ts` の ORDER BY 撤去 |
| 9 | `ServiceCard.tsx` |
| 10 | `ServiceGrid.tsx` |
| 11 | `page.tsx` |
| 12 | dev サーバー目視確認 |
| 13 | README 更新 |

---

## Task 1: `today` 取得方針の決定とコメント追記

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/schema.ts`

設計書の Open Question「`today` を Date / 文字列どちらで渡すか」の最終決定をここで行い、後続タスクの基準を作る。

**決定:**
- Server Component (`page.tsx`) で `new Date()` を 1 回だけ生成
- 子コンポーネントへは ISO 文字列 `YYYY-MM-DD` (= `formatYmd(date)`) で渡す
- 理由: Client Component に Date オブジェクトを直接 props で渡すとシリアライズ警告が出る場合がある。文字列ならシリアライズ安全で、純粋関数のテスト性も保たれる
- `billing.ts` の関数は引数として `today: string (YYYY-MM-DD)` を受ける

この決定は後続タスクの関数シグネチャに影響する。

- [ ] **Step 1: `src/lib/types.ts` の `Subscription.nextBillingDate` にコメント追加**

`src/lib/types.ts` の `Subscription` 型定義を以下のように更新する。

```ts
export type Subscription = {
  id: string;
  userId: string;
  name: string;
  category: Category;
  price: number;
  billingCycle: BillingCycle;
  /**
   * アンカー日 (これまでの請求日のいずれか 1 日)。
   * 「次回の請求日」は表示時に billing.ts の nextBillingFrom() で算出する。
   * 形式: YYYY-MM-DD
   */
  nextBillingDate: string;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

- [ ] **Step 2: `src/lib/schema.ts` の対応カラムにコメント追加**

`src/lib/schema.ts` を以下に置き換える (コメント以外は同一)。

```ts
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: int('price').notNull(),
  billingCycle: text('billing_cycle').notNull(),
  // アンカー日 (これまでの請求日のいずれか 1 日)。
  // 「次回の請求日」は src/lib/billing.ts の nextBillingFrom() で算出する。
  nextBillingDate: text('next_billing_date').notNull(),
  memo: text('memo'),
  createdAt: int('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updated_at', { mode: 'timestamp' }).notNull(),
});

export * from './auth-schema';
```

- [ ] **Step 3: 型チェック**

Run: `pnpm tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/schema.ts
git commit -m "docs: clarify nextBillingDate as anchor date in types and schema"
```

---

## Task 2: vitest セットアップ

**Files:**
- Modify: `package.json` (ユーザー実行による更新)
- Create: `vitest.config.ts`
- Modify: `tsconfig.json`

`billing.ts` を TDD で実装するための基盤を整える。Node 環境で動くシンプル構成。jsdom や React Testing Library は導入しない (UI テストは Out of Scope)。

- [ ] **Step 1: ユーザーに devDependencies インストールを依頼**

ユーザー宛に次のメッセージを表示する。

> 次のコマンドを実行してください:
> ```
> pnpm add -D vitest
> ```
> 完了したら教えてください。

- [ ] **Step 2: インストール確認**

Run: `node -e "console.log(require('vitest/package.json').version)"`
Expected: バージョン番号が表示される (例: `3.x.x` または `4.x.x`)。失敗したらユーザーに再確認を依頼。

- [ ] **Step 3: `vitest.config.ts` を作成**

プロジェクトルートに `vitest.config.ts` を作成する。

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

ポイント:
- `globals: true` で `describe` / `it` / `expect` を import 不要に
- `environment: 'node'` (DOM 不要)
- `include` を `*.test.ts` に限定。`*.tsx` はテスト対象外 (UI は目視検証のため)
- `@/*` パスエイリアスを Next.js と同じ解決にする

- [ ] **Step 4: `tsconfig.json` に vitest globals を追加**

`tsconfig.json` の `compilerOptions` に `types` を追加する。

修正前 (該当箇所):
```json
"compilerOptions": {
  "target": "ES2017",
  ...
  "plugins": [
    {
      "name": "next"
    }
  ],
```

修正後:
```json
"compilerOptions": {
  "target": "ES2017",
  ...
  "types": ["vitest/globals"],
  "plugins": [
    {
      "name": "next"
    }
  ],
```

`types` 配列を追加する位置はどこでもよいが、`plugins` の直前を推奨。

- [ ] **Step 5: `package.json` に `test` スクリプト追加**

`package.json` の `scripts` に以下を追加。

```json
"test": "vitest run",
"test:watch": "vitest"
```

CI 向けには `vitest run` (1 回実行), 開発中は `pnpm test:watch` を使う。

- [ ] **Step 6: スモークテスト**

最小の動作確認用に `src/lib/__smoke__.test.ts` を一時的に作成する。

```ts
describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test`
Expected: 1 passed。エラーが出る場合は config を確認。

- [ ] **Step 7: スモークテストを削除**

```bash
rm src/lib/__smoke__.test.ts
```

- [ ] **Step 8: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: エラーなし

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tsconfig.json
git commit -m "test: set up vitest with node environment and path alias"
```

---

## Task 3: `billing.ts` を TDD で実装

**Files:**
- Create: `src/lib/billing.test.ts`
- Create: `src/lib/billing.ts`

テストを先に書き、red を確認してから実装する典型的な TDD ループ。1 関数ずつ進める。最後に全テストが green になることをもって完了とする。

`billing.ts` には以下 4 関数 + 1 ヘルパー (`formatYmd`) を実装する。
- `formatYmd(date: Date): string`
- `nextBillingFrom(anchor, cycle, today): string`
- `daysUntilNextBilling(anchor, cycle, today): number`
- `toMonthly(price, cycle): number`
- `toYearly(price, cycle): number`

- [ ] **Step 1: テストファイル `src/lib/billing.test.ts` を作成**

```ts
import { daysUntilNextBilling, formatYmd, nextBillingFrom, toMonthly, toYearly } from './billing';

describe('formatYmd', () => {
  it('formats UTC date to YYYY-MM-DD with zero padding', () => {
    expect(formatYmd(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
    expect(formatYmd(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31');
  });
});

describe('nextBillingFrom (monthly)', () => {
  it('returns anchor when anchor is in the future', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-10')).toBe('2026-01-15');
  });

  it('returns anchor when anchor equals today', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-15')).toBe('2026-01-15');
  });

  it('advances one month when anchor is just past', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-20')).toBe('2026-02-15');
  });

  it('advances multiple months when anchor is well past', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-07-01')).toBe('2026-07-15');
  });

  it('clamps to end of month when target month is shorter (Jan 31 -> Feb 28 in non-leap year)', () => {
    expect(nextBillingFrom('2026-01-31', 'monthly', '2026-02-01')).toBe('2026-02-28');
  });

  it('clamps to end of month in leap year February (Jan 31 -> Feb 29 in 2024)', () => {
    expect(nextBillingFrom('2024-01-31', 'monthly', '2024-02-01')).toBe('2024-02-29');
  });

  it('returns to original day after passing a short month (Jan 31 -> Feb 28 -> Mar 31)', () => {
    expect(nextBillingFrom('2026-01-31', 'monthly', '2026-03-01')).toBe('2026-03-31');
  });
});

describe('nextBillingFrom (yearly)', () => {
  it('returns anchor when anchor is in the future', () => {
    expect(nextBillingFrom('2027-06-01', 'yearly', '2026-01-01')).toBe('2027-06-01');
  });

  it('advances one year when anchor is past', () => {
    expect(nextBillingFrom('2025-06-01', 'yearly', '2026-01-01')).toBe('2026-06-01');
  });

  it('clamps Feb 29 to Feb 28 in non-leap year', () => {
    expect(nextBillingFrom('2024-02-29', 'yearly', '2025-01-01')).toBe('2025-02-28');
  });

  it('keeps Feb 29 when target year is also leap', () => {
    expect(nextBillingFrom('2024-02-29', 'yearly', '2028-01-01')).toBe('2028-02-29');
  });
});

describe('daysUntilNextBilling', () => {
  it('returns 0 when next billing is today', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-15')).toBe(0);
  });

  it('returns 7 when next billing is 7 days away', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-08')).toBe(7);
  });

  it('returns 8 when next billing is 8 days away (above threshold)', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-07')).toBe(8);
  });

  it('returns 1 when next billing is tomorrow', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-14')).toBe(1);
  });
});

describe('toMonthly', () => {
  it('returns price as-is for monthly cycle', () => {
    expect(toMonthly(1490, 'monthly')).toBe(1490);
  });

  it('divides yearly price by 12 and floors', () => {
    expect(toMonthly(5900, 'yearly')).toBe(491);
  });

  it('handles exact division', () => {
    expect(toMonthly(12000, 'yearly')).toBe(1000);
  });
});

describe('toYearly', () => {
  it('multiplies monthly price by 12', () => {
    expect(toYearly(1490, 'monthly')).toBe(17880);
  });

  it('returns yearly price as-is', () => {
    expect(toYearly(5900, 'yearly')).toBe(5900);
  });
});
```

- [ ] **Step 2: red を確認 (実装ファイル未作成)**

Run: `pnpm test`
Expected: テスト実行時、`src/lib/billing` モジュールが見つからずすべてのテストがエラー。これが期待される red 状態。

- [ ] **Step 3: `src/lib/billing.ts` を実装**

```ts
import type { BillingCycle } from './types';

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * アンカー日に対し、指定ヶ月数を加算した日付を返す。
 * 月末日問題に対応: 元の day が遷移先の月末を超えていたら遷移先の月末に丸める。
 * 例: 2026-01-31 に +1 month → 2026-02-28
 */
function addMonthsClamped(anchor: Date, months: number): Date {
  const targetYear = anchor.getUTCFullYear();
  const targetMonthIndex = anchor.getUTCMonth() + months;
  const originalDay = anchor.getUTCDate();
  const yearAdjusted = targetYear + Math.floor(targetMonthIndex / 12);
  const monthAdjusted = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = lastDayOfMonth(yearAdjusted, monthAdjusted);
  const day = Math.min(originalDay, lastDay);
  return new Date(Date.UTC(yearAdjusted, monthAdjusted, day));
}

/**
 * アンカー日と課金サイクルから、today 以上で最も近い課金日を返す。
 * - monthly: 1 ヶ月ずつ加算。月末日は遷移先の末日に丸める。
 * - yearly: 1 年ずつ加算 (= 12 ヶ月加算)。2/29 は平年で 2/28 に丸める。
 */
export function nextBillingFrom(anchor: string, cycle: BillingCycle, today: string): string {
  const anchorDate = parseYmd(anchor);
  const todayDate = parseYmd(today);
  let current = anchorDate;
  const step = cycle === 'monthly' ? 1 : 12;
  while (current.getTime() < todayDate.getTime()) {
    current = addMonthsClamped(current, step);
  }
  return formatYmd(current);
}

/**
 * today から次回課金日までの日数。最小 0。
 */
export function daysUntilNextBilling(anchor: string, cycle: BillingCycle, today: string): number {
  const next = parseYmd(nextBillingFrom(anchor, cycle, today));
  const t = parseYmd(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - t.getTime()) / msPerDay);
}

export function toMonthly(price: number, cycle: BillingCycle): number {
  return cycle === 'monthly' ? price : Math.floor(price / 12);
}

export function toYearly(price: number, cycle: BillingCycle): number {
  return cycle === 'yearly' ? price : price * 12;
}
```

- [ ] **Step 4: green を確認**

Run: `pnpm test`
Expected: すべてのテストが pass。失敗するケースがあれば、テストではなく実装を修正してから再実行する。

- [ ] **Step 5: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/lib/billing.ts src/lib/billing.test.ts
git commit -m "feat(lib): add billing pure functions with unit tests for lazy evaluation"
```

---

## Task 4: `simple-icons` 依存追加

**Files:**
- Modify: `package.json` (ユーザーが `pnpm add` で更新)

実装エージェントは pnpm を直接実行しない。ユーザーに依頼するコマンドを提示し、ユーザー実行を待つ。

- [ ] **Step 1: ユーザーに `pnpm add` 実行を依頼**

ユーザー宛に次のメッセージを表示する。

> 次のコマンドを実行してください:
> ```
> pnpm add simple-icons
> ```
> 完了したら教えてください。`package.json` と `pnpm-lock.yaml` の更新後に Task 5 に進みます。

- [ ] **Step 2: 完了確認**

ユーザーから完了の合図を受けたら、以下で導入を確認する。

Run: `node -e "console.log(Object.keys(require('simple-icons')).slice(0, 5))"`
Expected: `[ 'siXxx', 'siYyy', ... ]` のような配列出力 (具体名は問わない)

もし `Error: Cannot find module 'simple-icons'` なら、ユーザーに再度インストール確認を依頼する。

- [ ] **Step 3: Commit (lock ファイル更新分)**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add simple-icons for service brand logos"
```

---

## Task 5: `icon-map.ts` 実装

**Files:**
- Create: `src/lib/icon-map.ts`

サービス名 (正規化済み小文字) → `SimpleIcon` への対応表を作る。`simple-icons` から必要分だけ静的 import する。

- [ ] **Step 1: `src/lib/icon-map.ts` を作成**

```ts
import {
  siAdobecreativecloud,
  siAmazon,
  siAmazonprime,
  siApplemusic,
  siAnthropic,
  siDisneyplus,
  siDropbox,
  siFigma,
  siGithub,
  siHulu,
  siNetflix,
  siNotion,
  siOpenai,
  siSpotify,
  siYoutube,
  type SimpleIcon,
} from 'simple-icons';

/**
 * サービス名を比較用に正規化する。
 * - 前後の空白を除去
 * - 小文字化
 */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * 正規化済みの名前 → simple-icons オブジェクト。
 * 命名揺れに備えてエイリアスも登録する (例: youtube / youtube premium)。
 * 未登録の名前は resolveIcon() が null を返し、頭文字バッジへ落ちる。
 */
const ICON_MAP: Record<string, SimpleIcon> = {
  netflix: siNetflix,
  amazon: siAmazon,
  'amazon prime': siAmazonprime,
  'prime video': siAmazonprime,
  spotify: siSpotify,
  youtube: siYoutube,
  'youtube premium': siYoutube,
  'apple music': siApplemusic,
  'disney+': siDisneyplus,
  'disney plus': siDisneyplus,
  hulu: siHulu,
  chatgpt: siOpenai,
  openai: siOpenai,
  claude: siAnthropic,
  anthropic: siAnthropic,
  notion: siNotion,
  figma: siFigma,
  github: siGithub,
  'adobe creative cloud': siAdobecreativecloud,
  adobe: siAdobecreativecloud,
  dropbox: siDropbox,
};

/**
 * サービス名から SimpleIcon を解決する。ヒットしなければ null。
 */
export function resolveIcon(name: string): SimpleIcon | null {
  return ICON_MAP[normalize(name)] ?? null;
}
```

- [ ] **Step 2: simple-icons から import できる slug の存在確認**

Run: `node -e "const i=require('simple-icons'); ['siAdobecreativecloud','siAmazon','siAmazonprime','siApplemusic','siAnthropic','siDisneyplus','siDropbox','siFigma','siGithub','siHulu','siNetflix','siNotion','siOpenai','siSpotify','siYoutube'].forEach(k => console.log(k, !!i[k]));"`

Expected: 各行に `siXxx true` と出る。`false` のものがあれば、`icon-map.ts` のその import 行を削除し、対応する mapping 行も削除する (例: `siAnthropic` が無ければ Claude / Anthropic の行を消す)。

- [ ] **Step 3: 型チェック**

Run: `pnpm tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: エラーなし

- [ ] **Step 5: Commit**

```bash
git add src/lib/icon-map.ts
git commit -m "feat(lib): add icon-map for major service brand logos"
```

---

## Task 6: `ServiceIcon` コンポーネント実装

**Files:**
- Create: `src/components/dashboard/ServiceIcon.tsx`

`resolveIcon` の結果でロゴ SVG or 頭文字バッジを描画する presentational component。

- [ ] **Step 1: `src/components/dashboard/ServiceIcon.tsx` を作成**

```tsx
import { resolveIcon } from '@/lib/icon-map';
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

type Props = {
  name: string;
  category: Category;
};

export function ServiceIcon({ name, category }: Props) {
  const icon = resolveIcon(name);

  if (icon) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200"
        aria-label={`${icon.title} ロゴ`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill={`#${icon.hex}`}
          aria-hidden="true"
        >
          <title>{icon.title}</title>
          <path d={icon.path} />
        </svg>
      </div>
    );
  }

  const colors = CATEGORY_COLORS[category];
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${colors.bg} ${colors.text}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ServiceIcon.tsx
git commit -m "feat(dashboard): add ServiceIcon component with brand logo fallback"
```

---

## Task 7: `NextBillingBadge` コンポーネント実装

**Files:**
- Create: `src/components/dashboard/NextBillingBadge.tsx`

残日数を受け取り、丸型の赤バッジを描画する。8 日以上は何も描画しない (`null`)。

- [ ] **Step 1: `src/components/dashboard/NextBillingBadge.tsx` を作成**

```tsx
type Props = {
  daysUntil: number;
};

/**
 * 7日以内の課金を強調するバッジ。
 * - 0       → "今日"
 * - 1..7    → "あと◯日"
 * - 8以上   → 描画しない
 *
 * カードの右上に絶対配置される前提でスタイリングする。
 */
export function NextBillingBadge({ daysUntil }: Props) {
  if (daysUntil < 0 || daysUntil > 7) return null;

  const label = daysUntil === 0 ? '今日' : `あと${daysUntil}日`;

  return (
    <span
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 font-bold text-white text-xs shadow-sm"
      aria-label={`次回請求まで ${label}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/NextBillingBadge.tsx
git commit -m "feat(dashboard): add NextBillingBadge for 7-day warning"
```

---

## Task 8: `subscriptions.ts` の `listAll` から ORDER BY を撤去

**Files:**
- Modify: `src/lib/subscriptions.ts`

アンカー日順のソートは意味を失ったため DB 側から外す。並び替えは Server Component 側で行う (Task 9)。

- [ ] **Step 1: `src/lib/subscriptions.ts` の `listAll` を修正**

`listAll` 関数を以下に差し替える (それ以外の関数は触らない)。

```ts
export async function listAll(userId: string): Promise<Subscription[]> {
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  return rows as Subscription[];
}
```

ファイル冒頭で不要になる import (`asc`) があれば削除する。`and` と `eq` は他関数で使われているため残す。

修正後の import 行は以下のいずれか:
```ts
import { and, eq } from 'drizzle-orm';
```

- [ ] **Step 2: 型チェック**

Run: `pnpm tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: 未使用 import などのエラーなし

- [ ] **Step 4: Commit**

```bash
git add src/lib/subscriptions.ts
git commit -m "refactor(lib): drop ORDER BY from listAll (sorted in server component)"
```

---

## Task 9: `ServiceCard` を新基盤へ移行

**Files:**
- Modify: `src/components/dashboard/ServiceCard.tsx`

- アイコン部分を `ServiceIcon` に置換
- 月額計算を `toMonthly` 経由に置換
- 「次回 M/D」表示を `nextBillingFrom` の結果から導出
- 右上に `NextBillingBadge` を追加 (既存のメニューと位置を共存させる)

`today` props を新たに受け取る。

- [ ] **Step 1: `src/components/dashboard/ServiceCard.tsx` を全面差し替え**

```tsx
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { daysUntilNextBilling, nextBillingFrom, toMonthly } from '@/lib/billing';
import type { Subscription } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { NextBillingBadge } from './NextBillingBadge';
import { ServiceIcon } from './ServiceIcon';

type Props = {
  sub: Subscription;
  today: string;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
};

function formatMmDd(ymd: string): string {
  const [, month, day] = ymd.split('-').map(Number);
  return `${month}/${day}`;
}

export function ServiceCard({ sub, today, onEdit, onDelete }: Props) {
  const colors = CATEGORY_COLORS[sub.category];
  const monthly = toMonthly(sub.price, sub.billingCycle);
  const nextDate = nextBillingFrom(sub.nextBillingDate, sub.billingCycle, today);
  const daysUntil = daysUntilNextBilling(sub.nextBillingDate, sub.billingCycle, today);

  return (
    <div className="group relative rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-200 hover:shadow-md">
      {/* 右上: バッジ + メニュー (バッジは常時表示、メニューは hover で出現) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <NextBillingBadge daysUntil={daysUntil} />
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

      {/* ヘッダー: アイコン + サービス名 */}
      <div className="mb-5 flex items-center gap-3">
        <ServiceIcon name={sub.name} category={sub.category} />
        <p className="min-w-0 flex-1 truncate pr-20 font-semibold text-sm text-stone-900">{sub.name}</p>
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
        <p className="text-[11px] text-stone-400">次回 {formatMmDd(nextDate)}</p>
        <span className={`rounded-full px-2.5 py-1 font-medium text-xs ${colors.bg} ${colors.text}`}>
          {sub.category}
        </span>
      </div>
    </div>
  );
}
```

変更ポイント:
- `today: string` props を追加
- `ServiceIcon` で頭文字 / ロゴを描画
- `formatDate` を `formatMmDd` にリネーム (アンカー日と「計算後の次回日」を取り違えないため)
- 右上にバッジ + メニューを横並びコンテナ化。サービス名の `pr-6` を `pr-20` に拡張してテキスト被り回避

- [ ] **Step 2: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: 後続タスクでも参照する props 整合エラーが出るが、本タスク内では `ServiceGrid` 経由の `today` props が未対応なため `ServiceGrid` 側の TS エラーが出る可能性あり。**この時点では `ServiceGrid` のエラーは無視してよい (Task 9 で解消)**。`ServiceCard.tsx` 単独のエラーは無いはず。

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ServiceCard.tsx
git commit -m "feat(dashboard): integrate ServiceIcon, NextBillingBadge, and billing.ts into ServiceCard"
```

---

## Task 10: `ServiceGrid` で `today` を伝搬

**Files:**
- Modify: `src/components/dashboard/ServiceGrid.tsx`

- [ ] **Step 1: `src/components/dashboard/ServiceGrid.tsx` を修正**

Props に `today: string` を追加し、各 `ServiceCard` に渡す。それ以外の挙動は変えない。

修正後の最低限の差分イメージ:

```tsx
type Props = {
  subs: Subscription[];
  today: string;
};

export function ServiceGrid({ subs, today }: Props) {
  // ... 既存ロジックそのまま ...

  // ServiceCard 呼び出し箇所を以下に変更
  // (filtered.map 内)
  // <ServiceCard key={sub.id} sub={sub} today={today} onEdit={handleEdit} onDelete={handleDelete} />
}
```

ファイル全体は以下になる。

```tsx
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
```

- [ ] **Step 2: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: `ServiceGrid` 側の `today` 整合は取れる。`page.tsx` 側で `today` 未指定の TS エラーが残る (Task 10 で解消)。

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ServiceGrid.tsx
git commit -m "refactor(dashboard): propagate today prop through ServiceGrid"
```

---

## Task 11: `page.tsx` を `billing.ts` ベースに刷新

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- `today` を Server 側で生成し props で配る
- 月額・年額合計を `toMonthly` / `toYearly` 集計に置換
- 一覧を計算後の次回課金日昇順でソート

- [ ] **Step 1: `src/app/dashboard/page.tsx` を全面差し替え**

```tsx
import { redirect } from 'next/navigation';
import { ServiceGrid } from '@/components/dashboard/ServiceGrid';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { formatYmd, nextBillingFrom, toMonthly, toYearly } from '@/lib/billing';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);
  const today = formatYmd(new Date());

  // 次回課金日 (計算結果) の昇順でソート
  const sorted = [...subs].sort((a, b) => {
    const an = nextBillingFrom(a.nextBillingDate, a.billingCycle, today);
    const bn = nextBillingFrom(b.nextBillingDate, b.billingCycle, today);
    return an.localeCompare(bn);
  });

  const monthlyTotal = sorted.reduce((acc, s) => acc + toMonthly(s.price, s.billingCycle), 0);
  const yearlyTotal = sorted.reduce((acc, s) => acc + toYearly(s.price, s.billingCycle), 0);
  const aiCount = sorted.filter((s) => s.category === 'AI').length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <SummaryCards monthlyTotal={monthlyTotal} yearlyTotal={yearlyTotal} count={sorted.length} aiCount={aiCount} />
        <ServiceGrid subs={sorted} today={today} />
      </main>

      <Footer />
    </div>
  );
}
```

ポイント:
- `formatYmd(new Date())` で UTC ベースの YYYY-MM-DD 取得。サーバー時計 = UTC でない環境でも `billing.ts` 内部は UTC で揃えているため一貫性が保たれる
- ソートは `localeCompare` で YYYY-MM-DD 文字列を辞書順 = 日付昇順とみなす (ISO 形式の特性)
- 月額合計は `toMonthly` を累積 (`Math.floor` は関数内部で実施済み)

- [ ] **Step 2: 型チェック / Lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: エラーなし (全体整合)

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "refactor(dashboard): use billing.ts for totals and lazy next-billing sort"
```

---

## Task 12: 動作確認 (dev サーバー目視)

**Files:** なし (実機検証)

実装を本物のブラウザで確認する。デプロイ前の最終ゲート。

- [ ] **Step 1: dev サーバー起動**

Run: `pnpm dev`
Expected: `http://localhost:3000` で起動。エラーログが無いこと。

- [ ] **Step 2: ログインしてダッシュボード表示**

ブラウザで `/login` からログインし、`/dashboard` を表示する。

- [ ] **Step 3: 検証項目チェック**

以下を上から順に確認する。

- [ ] アンカー日が過去のサブスクを編集フォームから 1 件作る (例: `nextBillingDate = 2026-01-15`、cycle = monthly)。今日が 2026-05-26 として、カードの「次回 M/D」が `5/15` または `6/15` になる (Task 11 実行日に依存)
- [ ] アンカー日を今日に設定したサブスクを 1 件作り、右上に「今日」の赤バッジが出る
- [ ] アンカー日を 3 日後に設定したサブスクを 1 件作り、右上に「あと3日」の赤バッジが出る
- [ ] アンカー日を 8 日後に設定したサブスクを 1 件作り、右上のバッジが**出ない**
- [ ] サービス名を「Netflix」「Spotify」「Amazon Prime」などにすると、頭文字バッジではなくブランドロゴが表示される
- [ ] サービス名を「Hoge」など登録外にすると、頭文字バッジが表示される
- [ ] 「今月の合計」「年額換算」が正しい値 (検算: monthly 1490 + yearly 5900 → 月額 1490+491=1981、年額 17880+5900=23780)
- [ ] カードの並びが「次回課金日が近い順」 (バッジが出ているカードが上に来る感覚)
- [ ] 編集モーダル・削除・追加が従来通り動作する
- [ ] DevTools コンソール / Network タブにエラーが無い

問題があればロールバックせず修正をその場で当て、再確認 → コミットする。

- [ ] **Step 4: dev サーバー停止**

`Ctrl + C`

- [ ] **Step 5: Lint / 型チェック / Test 最終確認**

Run: `pnpm tsc --noEmit && pnpm lint && pnpm test`
Expected: いずれもエラーなし

---

## Task 13: README とドキュメントの追従

**Files:**
- Modify: `README.md`

進捗欄を更新する。`docs/plan.md` 内の第3周チェックも一部該当 (3.6 アイコン) するため、必要なら合わせて更新する。

- [ ] **Step 1: `README.md` の「## 現状」を更新**

該当行を以下に差し替える。

```
## 現状
v1 仕上げパック (警告バッジ / 次回請求日の遅延評価 / 主要サービスのロゴアイコン) 実装完了。`docs/superpowers/plans/2026-05-26-v1-polish-pack.md` 参照。
```

- [ ] **Step 2: `README.md` の「## やったこと (新しい順)」に追記**

最上行に以下を追加 (日付は実装完了日。`2026-05-26` を仮置きするが、実際の完了日に置き換える)。

```
- 2026-05-26: v1 仕上げパック実装。`src/lib/billing.ts` で次回課金日の遅延評価を導入し、`nextBillingDate` をアンカー日として再解釈。7日以内の警告バッジ (`NextBillingBadge`) と主要サービスのロゴアイコン (`ServiceIcon` + `simple-icons`) を追加。DB スキーマは無変更
```

- [ ] **Step 3: `README.md` の「## 次やること」を更新**

該当行を以下に差し替える (次フェーズの方向性は未確定なので、空に近い状態でよい)。

```
## 次やること
v2 候補 (グラフ / 年額予想 / CSV / 通知 / PWA) のうち、次に着手するものを選定
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for v1 polish pack completion"
```

---

## 完了基準 (Definition of Done)

設計書「受け入れ基準」と Task 11 の検証項目をすべて満たしていること。具体的には:

1. 7日以内のカードに赤い丸バッジが出る (0日「今日」/1〜7日「あと◯日」/8日以上 非表示)
2. アンカー日が過去になっても「次回 M/D」は常に今日以降を表示
3. SummaryCards の月額・年額が `billing.ts` 経由で算出されている
4. 一覧が計算後の次回請求日昇順
5. Netflix / Spotify / Amazon Prime 等のマップ登録サービスはロゴ表示
6. マップに無いサービスは頭文字バッジ
7. `pnpm tsc --noEmit` と `pnpm lint` が通る
8. `pnpm test` で `billing.test.ts` の全ケースが pass する
9. ダークモード関連コード未追加
10. DB スキーマ / マイグレーション無変更
