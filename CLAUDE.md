# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # Biome check (lint + format check)
pnpm format       # Biome format --write (auto)
```

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
