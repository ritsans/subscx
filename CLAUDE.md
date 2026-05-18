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

## Commands

- Development: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type Check: `pnpm tsc --noEmit`

## Stack

- **Next.js 16** (App Router) with **React 19** and the **React Compiler** enabled.
- **Tailwind** via `@tailwindcss/postcss`
- **Biome** for linting and formatting. (No ESLint)
- **TypeScript**, **pnpm** as package manager

## Architecture

### Architecture & Files

- 以下のディレクトリ構造を厳守し、新しいディレクトリを増やす前に必ず人間に確認すること。
  `src/app/` (Pages/APIs), `src/components/` (UI Components), `src/lib/` (Utils/Hooks)
- コンポーネントは原則 `Server Components`（デフォルト）とし、インタラクティブ性が必要な場合のみ最末端で `use client` を付与する。
- 1関数は50行以内、1ファイルは150行以内とする。
- 新規の外部ライブラリを追加することは禁止（まずは標準APIや既存の仕組みで代替案を提案すること）。

## Approach

- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
