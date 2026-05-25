# ダッシュボード テーマ・配色ガイド

作成日: 2026-05-22

## 基本コンセプト

ベージュ系オフホワイトを地色とした、落ち着きのある管理画面。
白カードを浮かせる構成で、情報の階層をシャドウと余白で表現する。
アクセントは violet-600 に統一し、金額など重要データを視覚的に強調する。

## ページ背景

```
bg-[#f7f5f2]   // ウォームホワイト (石灰岩系ベージュ)
```

ヘッダーはスクロール追従のため `bg-[#f7f5f2]/80 backdrop-blur-md` で半透明化。

## shadcn/ui CSS変数 (globals.css)

stone ベーステーマ。oklch 色空間で定義。

| 変数 | 値 | 用途 |
|---|---|---|
| `--background` | `oklch(1 0 0)` | ページ背景 (shadcn内部用) |
| `--foreground` | `oklch(0.147 0.004 49.25)` | 本文テキスト |
| `--popover` | `oklch(1 0 0)` | モーダル・ポップオーバー背景 |
| `--popover-foreground` | `oklch(0.147 0.004 49.25)` | モーダル内テキスト |
| `--primary` | `oklch(0.216 0.006 56.043)` | プライマリボタン背景 |
| `--primary-foreground` | `oklch(0.985 0.001 106.423)` | プライマリボタンテキスト |
| `--secondary` | `oklch(0.97 0.001 106.424)` | セカンダリ背景 |
| `--muted` | `oklch(0.97 0.001 106.424)` | ミュートされた背景 |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | サブテキスト・ラベル |
| `--border` | `oklch(0.923 0.003 48.717)` | ボーダー |
| `--ring` | `oklch(0.709 0.01 56.259)` | フォーカスリング |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 削除・エラー色 |

ダークモードは非対応。`dark:` クラス、`.dark` セレクタ、`prefers-color-scheme`、テーマ切替用 Provider、`next-themes` などのダークモード関連コードは追加しない。
配色はライトテーマ固定で運用し、必要な色変更はライトテーマの CSS 変数または Tailwind クラスだけで行う。

## カードシステム

| 要素 | クラス |
|---|---|
| サービスカード | `bg-white rounded-2xl border border-stone-100 shadow-sm` |
| ホバー時 | `hover:shadow-md hover:border-stone-200` |
| サマリーカード (強調) | `bg-violet-600 rounded-2xl` (今月の合計) |
| サマリーカード (通常) | `bg-white rounded-2xl border border-stone-100 shadow-sm` |
| 追加ボタンカード | `border-2 border-dashed border-stone-200 rounded-2xl` |

## アクセントカラー

violet-600 (`#7c3aed` 相当) をメインアクセントとして全体で統一。

- 今月の合計カード背景
- アバター背景
- 追加カードホバー (`hover:border-violet-400 hover:bg-violet-50/50`)
- テキストリンク系 (`text-violet-600`)

## カテゴリバッジカラー

`src/lib/types.ts` の `CATEGORY_COLORS` で一元管理。
アイコン初期文字ボックスとバッジで同じ色を共有する。

| カテゴリ | 背景 | テキスト |
|---|---|---|
| AI | `bg-violet-100` | `text-violet-700` |
| エンタメ | `bg-red-100` | `text-red-700` |
| 仕事 | `bg-orange-100` | `text-orange-700` |
| 音楽 | `bg-purple-100` | `text-purple-700` |
| 買い物 | `bg-green-100` | `text-green-700` |

カテゴリを追加する場合は `CATEGORIES` 配列と `CATEGORY_COLORS` の両方に追記する。

## カテゴリピル (絞り込みUI)

```
選択中: bg-stone-900 text-white border-stone-900
非選択: bg-white text-stone-600 border-stone-200 (hover: border-stone-400)
形状: rounded-full px-3.5 py-1.5 text-xs
```

## タイポグラフィ

Next.js デフォルトの Geist フォントをそのまま使用。
フォントを変更する場合は `src/app/layout.tsx` の `localFont` 設定を差し替える。

| 用途 | クラス |
|---|---|
| 金額 (大) | `text-3xl font-bold tracking-tight` |
| 金額 (カード内) | `text-xl font-bold` |
| ラベル・サブテキスト | `text-xs font-medium text-stone-400` |
| カード名 | `text-sm font-semibold text-stone-900` |
| ナビリンク | `text-xs font-medium text-stone-500` |

## ヘッダー

```
sticky top-0 z-40
bg-[#f7f5f2]/80 backdrop-blur-md
border-b border-stone-200/60
高さ: h-14
コンテンツ幅: max-w-5xl mx-auto px-6
```

## 全体レイアウト

```
コンテンツ最大幅: max-w-5xl
横パディング: px-6
縦パディング: py-8
セクション間ギャップ: gap-8

サマリーグリッド: grid-cols-1 → sm:grid-cols-3
サービスグリッド: grid-cols-1 → sm:grid-cols-2 → md:grid-cols-3
カード間ギャップ: gap-4
```

## 今後のカスタマイズポイント

- **テーマ色変更**: `globals.css` の `--primary` を差し替えると shadcn コンポーネント全体に反映
- **アクセント変更**: `violet-600` を grep して一括置換 (`Header`, `SummaryCards`, `AddServiceButton`, `ServiceGrid`)
- **カテゴリ追加**: `src/lib/types.ts` の `CATEGORIES` と `CATEGORY_COLORS` に追記
- **背景色変更**: `#f7f5f2` を grep して一括置換 (`globals.css` は不要、`page.tsx` と `Header.tsx` のみ)
