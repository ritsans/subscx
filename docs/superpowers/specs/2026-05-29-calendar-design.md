# 日本のカレンダー機能 実装計画書

> このドキュメントは Claude Code 等の自律エージェントに渡して実装を委任することを想定しています。実装中に判断に迷ったら、まず本文書の **判断指針** セクションを参照してください。

> **本書は subscx プロジェクト (Next.js 16 / React 19 / Tailwind 4 / Better Auth / Turso + Drizzle / Biome / pnpm) に最適化された改訂版です。** プロジェクト共通ルールは `CLAUDE.md`、既存ロジックは `src/lib/billing.ts` / `src/lib/utils.ts` を参照すること。

---

## 0. ゴール

subscx (サブスク管理アプリ) に、ログインユーザー本人のサブスクリプションの「次回請求日」を月表示カレンダー上にバッジとして可視化する機能を追加する。日本の祝日 / 土日カラーリングに対応する。

外部依存は最小化し、カレンダー描画ロジックは標準 `Date` API で自前実装する。日付フォーマットは必ず `Asia/Tokyo` (= `APP_TIME_ZONE`) 基準とする。

---

## 1. 技術スタック (プロジェクト現行構成に追随)

| 領域 | 採用技術 | 状態 |
|---|---|---|
| フレームワーク | Next.js 16 (App Router) + React 19 + React Compiler | 既存 |
| 言語 | TypeScript 5.x | 既存 |
| スタイル | TailwindCSS 4 (`@tailwindcss/postcss`) | 既存 |
| Lint / Format | Biome 2 | 既存 (ESLint なし) |
| DB | Turso (libSQL) | 既存 |
| ORM | Drizzle ORM 0.45.x | 既存 |
| 認証 | Better Auth | 既存 |
| パッケージ管理 | pnpm | 既存 |
| データフェッチ | **Server Component + Server Actions** (SWR は使わない) | 既存方針踏襲 |
| 祝日判定 | `@holiday-jp/holiday_jp` | **新規追加** |

**追加する依存は `@holiday-jp/holiday_jp` の 1 つだけ。**日付計算ライブラリ (date-fns / dayjs / luxon) や SWR は導入しない。

> ライブラリのインストールは自分で実行しないこと (CLAUDE.md 準拠)。必要なコマンドをユーザーに提示する。

---

## 2. 機能要件

### 2.1 カレンダー UI

- **月表示のみ**。週表示・日表示は実装しない。
- グリッドは常に 6 週 × 7 日 = 42 セル固定 (月送りでレイアウトが揺れないため)。
- ヘッダに「YYYY年 M月」と「前月 / 今日 / 翌月」ボタン。
- 各セルに表示する情報:
  - 日付 (半角数字)
  - 祝日名 (祝日のみ。日本語)
  - 該当日に紐づくサブスク名 (最大 2 件、超過分は `+N` で省略)

### 2.2 色分けルール (ライトテーマ固定。ダークモード対応コードは追加しない)

| 対象 | 色 |
|---|---|
| 日曜の列 (背景) | 薄い赤 (`bg-red-50`) |
| 土曜の列 (背景) | 薄い青 (`bg-blue-50`) |
| 日曜・祝日の文字 | 赤 (`text-red-600`) |
| 土曜の文字 | 青 (`text-blue-600`) |
| 他月の日 | グレー (`text-gray-300`) |
| 今日 | リング (`ring-2 ring-blue-400 ring-inset`) |
| 予定タグ | アンバー系 (`bg-amber-100 text-amber-800`) |

### 2.3 サブスク請求日の表示

DB の `subscriptions` テーブル (本人分のみ) を取得し、表示中の月の請求日に展開してマーク表示する。

- 展開には `src/lib/billing.ts#nextBillingFrom()` を流用する。`nextBillingDate` を**アンカー日**として解釈し、`billingCycle` (`monthly` / `yearly`) と組み合わせて該当月の請求日を算出する。
- `monthly` は基本毎月該当日に発生。`yearly` はアンカー月のみ。
- アンカー日が「31 日」など対象月に存在しない日付の場合、`nextBillingFrom()` 既存仕様に従い**月末日に丸める**。
- 表示は「該当月の各日付ごとに、どのサブスクが請求発生するか」を表示する。同日複数 → 最大 2 件 + `+N` 表示。

---

## 3. データモデル

### 3.1 テーブル

**新規テーブルは追加しない。** 既存 `subscriptions` (`src/lib/schema.ts`) を流用する。参照するカラム:

- `userId`: 本人分のみ絞り込み
- `name`: 表示テキスト
- `nextBillingDate` (アンカー日, `YYYY-MM-DD`)
- `billingCycle` (`'monthly' | 'yearly'`)

### 3.2 アプリケーション型

既存 `src/lib/types.ts` には `Subscription` 等の型が定義済み。カレンダー用に以下を**同ファイルへ追記**する。

```typescript
// src/lib/types.ts に追記

// 表示用に展開された予定 (特定日付に紐づく)
export type CalendarEvent = {
  date: string;        // YYYY-MM-DD (Asia/Tokyo 基準)
  title: string;       // サブスク名
  sourceId: string;    // subscription.id
};

// カレンダーの 1 セル分
export type CalendarDay = {
  ymd: string;         // YYYY-MM-DD (Asia/Tokyo 基準, ソート/Map キー)
  year: number;        // ローカル年
  month: number;       // 0-11
  day: number;         // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number;   // 0=日, 6=土
  holidayName: string | null;
};
```

---

## 4. ディレクトリ構成 (既存規約準拠)

```
src/
├── app/
│   ├── calendar/
│   │   └── page.tsx                        # Server Component (新規ルート)
│   ├── dashboard/                          # 既存
│   ├── layout.tsx                          # 既存
│   └── ...
├── components/
│   ├── calendar/                           # カレンダー用コンポーネントをまとめる
│   │   ├── calendar.tsx                    # 親 (Client, 月状態管理)
│   │   ├── calendar-header.tsx             # 年月 + 月送りボタン (Client)
│   │   ├── calendar-grid.tsx               # 7x6 グリッド (Server 可)
│   │   └── calendar-cell.tsx               # 1 日分のセル (Server 可)
│   ├── dashboard/                          # 既存
│   ├── layout/                             # 既存
│   └── ui/                                 # 既存 (shadcn/ui)
├── lib/
│   ├── calendar.ts                         # 日付計算 (純粋関数, 新規)
│   ├── billing.ts                          # 既存。流用
│   ├── utils.ts                            # 既存。formatYmdInAppTimeZone 等
│   ├── types.ts                            # 既存に追記
│   ├── schema.ts                           # 既存。変更なし
│   ├── db.ts                               # 既存。変更なし
│   ├── subscriptions.ts                    # 既存。本人サブスク取得関数を流用 or 追加
│   ├── env.ts                              # 既存 (server-only)
│   └── get-session.ts                      # 既存
```

- ファイル名は **kebab-case** (`calendar-header.tsx` 等)。既存の `sign-out-button.tsx` などに合わせる。
- 既存の `src/lib/db.ts`, `src/lib/schema.ts` を使う。設計書旧版にあった `src/db/` ディレクトリは作らない。

---

## 5. 実装順序

各ステップは独立してテスト可能。

### Step 1: 依存パッケージの追加 (ユーザーに依頼)

ユーザーに以下のコマンドを提示して実行を委ねる:

```bash
pnpm add @holiday-jp/holiday_jp
```

> `drizzle-orm` / `@libsql/client` / `drizzle-kit` は既に導入済み。SWR は導入しない。

### Step 2: 型定義の追記 (`src/lib/types.ts`)

セクション 3.2 の `CalendarEvent` / `CalendarDay` を追記。

### Step 3: 日付計算ロジック (`src/lib/calendar.ts`)

以下の関数を **すべて純粋関数** として実装。React 非依存。

| 関数 | シグネチャ | 役割 |
|---|---|---|
| `formatDateKey` | `(date: Date) => string` | `Date` を `Asia/Tokyo` 基準の `YYYY-MM-DD` に。**実装は `utils.ts#formatYmdInAppTimeZone()` を再利用**。`toISOString()` 使用禁止 |
| `getLastDayOfMonth` | `(year: number, month: number) => number` | `new Date(y, m+1, 0).getDate()` を利用 |
| `buildMonthGrid` | `(year: number, month: number, today: Date) => CalendarDay[]` | 42 セル配列を返す。`isToday` は `today` を `formatYmdInAppTimeZone` でキー化して比較 |
| `expandSubscriptionsToMonth` | `(subs: Subscription[], year: number, month: number) => CalendarEvent[]` | 対象月に発生する請求日に展開。**内部で `nextBillingFrom()` を利用**。`yearly` の場合はアンカー月のみ展開 |
| `prevMonth` / `nextMonth` | `(year: number, month: number) => { year: number; month: number }` | 年跨ぎ考慮 |
| `groupEventsByDate` | `(events: CalendarEvent[]) => Map<string, CalendarEvent[]>` | グリッド描画前にセルへ配るためのインデックス |

**祝日判定**: `@holiday-jp/holiday_jp` の `holidays.between(from, to)` を使い、月初〜月末 (42 セル全範囲) の祝日マップを 1 回だけ作って `buildMonthGrid` に渡す。

### Step 4: データ取得関数 (`src/lib/subscriptions.ts` に追記 or 既存流用)

`getSubscriptionsForUser(userId)` 相当の関数が既にあるはず。なければ最小限の取得関数を追加。**カレンダーは月送り時に再フェッチしないため、ページ初回ロード時のみ取得**して props で `Calendar` に渡す。

### Step 5: ページ実装 (`src/app/calendar/page.tsx`)

- **Server Component** として実装。
- `get-session.ts` で本人セッション取得 → 未認証なら `/login` リダイレクト (`src/proxy.ts` 既存ガードと整合)。
- `db` から本人サブスク全件取得 → `Calendar` に `initialSubscriptions` として渡す。
- 既存の `Header` / `Footer` (`src/components/layout/`) を組み込む。

### Step 6: プレゼンテーション層 (`src/components/calendar/`)

実装順:

1. `calendar-cell.tsx` (Server 可) — props だけで描画。背景クラスは親から渡す。
2. `calendar-grid.tsx` (Server 可) — 42 セルを並べる。`dayOfWeek` を見て `bg-red-50` / `bg-blue-50` を**明示的に**付与 (Tailwind JIT 安全策)。`groupEventsByDate` の結果を渡し、`O(N+M)` にする。
3. `calendar-header.tsx` (Client) — `'use client'`。前月 / 今月 / 翌月ボタン。
4. `calendar.tsx` (Client) — `'use client'`。`useState` で `(year, month)` を保持。`initialSubscriptions` を props で受け取り、月変更時は `expandSubscriptionsToMonth` の再計算のみ (再フェッチなし)。

### Step 7: ナビゲーション統合

`src/components/layout/` の Header にカレンダーへのリンクを追加。ダッシュボードからカレンダーへ遷移できるようにする。

### Step 8: 動作確認

```bash
pnpm tsc --noEmit
pnpm lint
pnpm dev
# http://localhost:3000/calendar で確認
```

---

## 6. 判断指針 (迷ったらここを見る)

### 6.1 タイムゾーン (最重要 / CLAUDE.md 準拠)

- 日付キー (`YYYY-MM-DD`) は **必ず `Asia/Tokyo` 基準**。実装は `src/lib/utils.ts#formatYmdInAppTimeZone()` を経由する。
- `Date#toISOString()` は **使用禁止** (UTC ベースで JST と日付がずれる)。
- `Date.now()` / `new Date()` をビジネスロジック中で**直接使わない**。テストしやすさのため、`buildMonthGrid` には `today: Date` を引数で渡す形にする。呼び出し側 (Client Component) で `new Date()` するのは可。

### 6.2 グリッドの行数

- 月によって 4 週・5 週・6 週と変動するため、**常に 6 週 = 42 セル** で固定。前月末・翌月頭で埋める。

### 6.3 月末クランプ

- `nextBillingFrom()` の既存仕様 (アンカー日 31 → 2 月は末日に丸める) をそのまま流用する。カレンダー独自のクランプロジックは書かない。

### 6.4 土日の背景色をどこで付けるか

- `calendar-cell` ではなく **`calendar-grid` 側**で `dayOfWeek` を見て**明示的に**クラスを付与する (Tailwind JIT 安全策, CLAUDE.md の `useSortedClasses` ともコンフリクトしない)。
- 動的クラス文字列補間 (`` `bg-${color}-50` ``) は **禁止**。

### 6.5 events のグルーピング

- セルごとに `events.filter(...)` を呼ぶと O(N×M) になる。`Map<string, CalendarEvent[]>` を 1 回作って各セルに渡す。

### 6.6 `'use client'` 境界 (CLAUDE.md「最末端のみ」準拠)

- Client: `calendar.tsx`, `calendar-header.tsx` (`useState` を使うため)
- Server 可: `calendar-grid.tsx`, `calendar-cell.tsx`, `page.tsx`
- ただし `calendar.tsx` が Client なので、その子である Grid / Cell も実質クライアントバンドルに入る点は許容する (純粋関数として書いておけば将来 RSC 化しやすい)。

### 6.7 「全件取得 vs 月ごと取得」

- 本人のサブスクは数件〜数十件のオーダーなので **全件取得**。月送りは `expandSubscriptionsToMonth()` の再計算だけで完結する。
- API Route や SWR は不要。

### 6.8 環境変数

- `process.env` を直接参照しない。`src/lib/env.ts` の `env` オブジェクト経由 (CLAUDE.md)。
- カレンダー機能では新規環境変数は追加しない。

---

## 7. 受け入れ基準 (Definition of Done)

### 7.1 機能

- [ ] `/calendar` にアクセスすると本人のカレンダーが表示される (未認証は `/login` リダイレクト)
- [ ] 月送り (前月・翌月・今日) が動作する
- [ ] 年跨ぎ (12月 ↔ 1月) が正しく動作する
- [ ] 今日 (`Asia/Tokyo` 基準) の日付にリングが表示される
- [ ] 日曜列・土曜列の背景色が表示される
- [ ] 祝日が赤字で表示され、祝日名がセル内に表示される (例: 5/3 に「憲法記念日」)
- [ ] 本人のサブスクが、該当月の請求日にバッジ表示される
- [ ] `monthly` は毎月、`yearly` はアンカー月のみ表示される
- [ ] アンカー日 31 の `monthly` サブスクは、2 月では 28 / 29 日に表示される (`nextBillingFrom()` 仕様)
- [ ] 1 日に 3 件以上の予定がある場合、`+N` で省略表示される

### 7.2 技術

- [ ] `src/lib/calendar.ts` の関数がすべて純粋関数 (副作用なし, React 非依存)
- [ ] 日付キーが `formatYmdInAppTimeZone()` 経由で生成されている (`toISOString()` 不使用)
- [ ] `'use client'` ディレクティブが必要な箇所のみに付与されている
- [ ] `pnpm tsc --noEmit` でエラーなし
- [ ] `pnpm lint` でエラーなし
- [ ] `pnpm build` が成功する
- [ ] ダークモード関連コード (`dark:` クラス, `next-themes` 等) が追加されていない

### 7.3 ファイル

- [ ] セクション 4 のディレクトリ構成と一致している (`src/components/calendar/` 配下に kebab-case)
- [ ] `package.json` の追加依存が `@holiday-jp/holiday_jp` のみ (SWR・date-fns 等は未追加)
- [ ] 新規テーブルは追加されていない (`src/lib/schema.ts` 変更なし)

---

## 8. 拡張の余地 (今回は実装しない)

- 単発予定 (特定の日付のみ) 用の新規テーブル `one_time_events`
- カレンダーセルクリックで詳細モーダル
- 月合計金額の表示 (`subscription.price` から算出可能)
- 週表示・日表示
- ICS エクスポート

---

## 9. 参考

- holiday_jp: https://github.com/holiday-jp/holiday_jp-js
- Next.js App Router: https://nextjs.org/docs/app
- 既存ロジック: `src/lib/billing.ts` (`nextBillingFrom`), `src/lib/utils.ts` (`formatYmdInAppTimeZone`, `APP_TIME_ZONE`)
- プロジェクト規約: `CLAUDE.md`

---

## 付録 A: 重要な落とし穴

### A.1 タイムゾーン

```typescript
// NG: UTC ベースなので JST 早朝の日付がずれる
const key = date.toISOString().slice(0, 10);

// NG: ローカル TZ 依存 (サーバーが UTC だと壊れる)
const key = `${date.getFullYear()}-${...}`;

// OK: APP_TIME_ZONE (Asia/Tokyo) 固定
import { formatYmdInAppTimeZone } from '@/lib/utils';
const key = formatYmdInAppTimeZone(date);
```

### A.2 Tailwind の動的クラス

```typescript
// NG: JIT が文字列を解析できず、クラスが効かないことがある
const bg = `bg-${color}-50`;

// OK: 完全なクラス名を分岐で書く
const bg = dayOfWeek === 0 ? 'bg-red-50' : dayOfWeek === 6 ? 'bg-blue-50' : 'bg-white';
```

Biome の `useSortedClasses` が自動ソートするので、`pnpm lint --write ./src` を最後に流す。

### A.3 月の繰り上がり

```typescript
new Date(2025, 0, 32)   // → 2025-02-01
new Date(2025, 1, 30)   // → 2025-03-02 (2月に30日はないので翌月扱い)
new Date(2025, 2, 0)    // → 2025-02-28 (2月末日)
```

`buildMonthGrid` と `getLastDayOfMonth` はこの仕様を活用する。手動で月の日数判定をしない。

### A.4 `'use client'` を付けすぎない

- `calendar-grid` と `calendar-cell` は純粋に props を受け取って描画するだけ。`'use client'` を付けない。
- 必要最小限に。

### A.5 Server Component で hooks を呼ばない

- `useState` / `useEffect` を含む `calendar` / `calendar-header` だけ Client。
- `page.tsx` (Server Component) では `db` から直接取得して `initialSubscriptions` として props で渡す。

### A.6 ライブラリ追加コマンドを自分で実行しない

- CLAUDE.md 準拠: `pnpm add @holiday-jp/holiday_jp` はユーザーに提示して実行を委ねる。
- 自分で `Bash` 実行しない。

---

**実装に着手する前に、本ドキュメントの全セクションと `CLAUDE.md` を読み通すこと。**
