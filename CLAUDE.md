# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Notes (@README.md)

- `README.md` をProject To-Do Listとして運用する。会話開始時およびタスク着手前に必ず参照すること。
- 作業の進捗に応じて以下のセクションを更新する:
  - `## 現状`: 今取り組んでいることを1行で
  - `## 次やること`: 直近のTodoリスト
  - `## 詰まってる / 保留`: ブロッカーや判断保留事項
  - `## やったこと (新しい順)`: 完了した作業を日付付きで追記 (最新を上に)

プラン参照:
- 設計書  `docs/spec.md`
- 設計計画書  `docs/plan.md`

終了したタスクはチェックを入れること `e.g: [ ]  -> [x]`
 
## Commands

- Development: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type Check: `pnpm tsc --noEmit`
- DB Schema Push: `pnpm drizzle-kit push`
- DB Generate Migration: `pnpm drizzle-kit generate`

## Environment Variables (Required)

- `TURSO_DATABASE_URL` — Turso DB の接続 URL
- `TURSO_AUTH_TOKEN` — Turso 認証トークン
- `BETTER_AUTH_SECRET` — Better Auth セッション署名用シークレット

## Stack

- **Next.js 16** (App Router) with **React 19** and the **React Compiler** enabled.
- **Tailwind** via `@tailwindcss/postcss`
- **Biome** for linting and formatting. (No ESLint)
- **TypeScript**, **pnpm** as package manager

## Code Style

- single quote, semicolons on, indent 2 spaces, lineWidth 120
- JSX attributes use double quote
- imports auto-sorted (biome assist)

## Architecture

### Architecture & Files

- 以下のディレクトリ構造を厳守し、新しいディレクトリを増やす前に必ず人間に確認すること。
  `src/app/` (Pages/APIs), `src/components/` (UI Components), `src/lib/` (Utils/Hooks)
- コンポーネントは原則 `Server Components`（デフォルト）とし、インタラクティブ性が必要な場合のみ最末端で `use client` を付与する。
- 勝手に新規の外部ライブラリを追加することは禁止。必要な場合は提案だけする。installはユーザーに手動で実行してもらうこと。
- You tend to start writing and implementing code immediately after outlining a plan. During the planning phase, do not write any code until I explicitly say **"実装して**

## Environment Variables

- `process.env` を直接参照しないこと。必ず `src/lib/env.ts` の `env` オブジェクトを経由する。
- `src/lib/env.ts` は `import 'server-only'` を持つサーバー専用モジュール。Client component から import するとエラーになる。
- 新しい環境変数を追加する際は `env.ts` のオブジェクトに追記し、必須/任意を明示すること。

## Secure 

Access to sensitive files such as `.env.local` is prohibited. Do not perform any READ operations on these files. If interaction is required, instruct the user to perform the necessary steps manually.

## Approach

- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
