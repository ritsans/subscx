# CLAUDE.md

<persona>
You are an excellent senior coding agent.
Your goal is to implement the requirements safely and report the changes concisely.
</persona>

## Project Notes (@README.md)

- `README.md` をProject To-Do Listとして運用する。会話開始時およびタスク着手前に必ず参照すること。
- 作業の進捗に応じて以下のセクションを更新する:
  - `## 現状`: 今取り組んでいることを1行で
  - `## 次やること`: 直近のTodoリスト
  - `## 詰まってる / 保留`: ブロッカーや判断保留事項
  - `## やったこと (新しい順)`: 完了した作業を日付付きで追記 (最新を上に)

プラン参照:
- 仕様書  `docs/spec.md`
- 設計書  `docs/plans/`

終了したタスクはチェックを入れること `e.g: [ ]  -> [x]`
 
## Commands

- Development: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Lint autofix: `pnpm lint --write ./src`
- Type Check: `pnpm tsc --noEmit`
- Test (single run): `pnpm test`
- Test (watch): `pnpm test:watch`
- DB Schema Push: `pnpm drizzle-kit push`
- DB Generate Migration: `pnpm drizzle-kit generate`

## Environment Variables

必須:
- `TURSO_DATABASE_URL` — Turso DB 接続 URL
- `TURSO_AUTH_TOKEN` — Turso 認証トークン
- `BETTER_AUTH_SECRET` — Better Auth セッション署名用シークレット

ルール:
- `process.env` を直接参照しない。必ず `src/lib/env.ts` の `env` オブジェクト経由。
- `src/lib/env.ts` は `import 'server-only'` 付きのサーバー専用。Client component から import 不可。
- 新規変数追加時は `env.ts` に追記し、必須/任意を明示する。

## Stack

- **Next.js 16** (App Router) with **React 19** and the **React Compiler** enabled.
- **Tailwind** via `@tailwindcss/postcss`
- **Biome** for linting and formatting. (No ESLint)
- **TypeScript**, **pnpm** as package manager

## Code Style

- single quote, semicolons on, indent 2 spaces, lineWidth 120
- JSX attributes は **double quote** 優先
- trailing comma: all、arrow function は常に括弧付き (`(x) => ...`)
- Tailwind クラスは `useSortedClasses` で自動ソート (warn)
- フォーマット/import 整列は `pnpm format` または `pnpm lint` に任せる

## Codebase

codebase全体を確認したい場合は、`temp/repomix-output.md`を参照すること。

## Architecture

ディレクトリ構造を厳守。
- `src/app/` — Pages / APIs / Server Actions (`actions.ts`)
- `src/components/` — UI Components
- `src/lib/` — Utils / Hooks。主要ファイル: `auth.ts` (Better Auth server), `auth-client.ts` (client), `db.ts` (Drizzle + libsql), `schema.ts` / `auth-schema.ts` (テーブル定義), `env.ts` (server-only), `get-session.ts`, `subscriptions.ts`
- `src/proxy.ts` — ルートガード (旧middleware.ts)。未認証ユーザーは `/login` へリダイレクト。

### 日付・課金ロジック

- DBの `next_billing_date` カラムはアンカー日 (これまでの請求日のいずれか1日) を格納する。「次回請求日」の実値は `src/lib/billing.ts#nextBillingFrom()` で毎回算出する。直接書き換えない。
- 日付処理はすべて `APP_TIME_ZONE = 'Asia/Tokyo'` 基準。`Date.now()` や `new Date()` を**直接使わずに必ず**、`formatYmdInAppTimeZone()` を経由する。

## Components / UI

- 原則 **Server Components**。インタラクティブ性が必要な最末端のみ `use client` を付与。
- UI 部品は **shadcn/ui** を採用 (設定: `components.json` / style: `radix-luma` / icon: `lucide`)。
  - 新規部品は独自実装する前に `pnpm dlx shadcn@latest add <component>` で追加できないかを検討する。
- ダークモードは非対応。
  - `dark:` クラス、`.dark` セレクタ、`prefers-color-scheme`、テーマ切替Provider、`next-themes` などのダークモード関連コードは追加しない。
  - 配色は**ライトテーマ固定**で実装し、必要な色変更はライトテーマの CSS 変数または Tailwind クラスだけで行う。

## Security

Access to sensitive files such as `.env.local` is prohibited. Do not perform any READ operations on these files. If interaction is required, instruct the user to perform the necessary steps manually.

## Approach

- 外部ライブラリは、必要なものが不足・見つからない場合にのみインストールを提案する。`pnpm add` 等の実行はユーザーに
委ね、自分では実行しない。
- プラン提示後、ユーザーが明示的に **「実装して」** と言うまでコードを書き始めない。
- 
- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
