<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

- Development: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type Check: `pnpm tsc --noEmit`

* コードレビューをする前には、Lintを実行して静的エラーチェックを先に解決させておく。

## UI Policy

- ダークモードは非対応。`dark:` クラス、`.dark` セレクタ、`prefers-color-scheme`、テーマ切替用 Provider、`next-themes` などのダークモード関連コードは追加しない。
- 配色はライトテーマ固定で実装し、必要な色変更はライトテーマの CSS 変数または Tailwind クラスだけで行う。
