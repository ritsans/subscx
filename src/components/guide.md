# UIコンポーネント修正ガイド

UIの見た目を変えたいとき、どのファイルを編集すればよいかを画面・部位ごとにまとめたドキュメント。

## 全体共通

| 修正したいもの | ファイル |
|---|---|
| デフォルトフォント / グローバルCSS変数 / Tailwindテーマ | `src/app/globals.css` |
| Webフォント読み込み (Noto Sans JP / Inter) | `src/app/layout.tsx` |
| HTMLメタ情報 (title / description) | `src/app/layout.tsx` |
| カテゴリの色 (AI / エンタメ / 仕事 / 音楽 / 買い物) | `src/lib/types.ts` の `CATEGORY_COLORS` |

ダークモードは非対応。`dark:` クラス、`.dark` セレクタ、`prefers-color-scheme`、テーマ切替用 Provider、`next-themes` などのダークモード関連コードは追加しない。

## ページ単位

| ページ | URL | エントリファイル |
|---|---|---|
| ランディング (トップ) | `/` | `src/app/page.tsx` |
| ログイン | `/login` | `src/app/login/page.tsx` |
| 新規登録 | `/signup` | `src/app/signup/page.tsx` |
| ダッシュボード | `/dashboard` | `src/app/dashboard/page.tsx` |
| マイページ | `/mypage` | `src/app/mypage/page.tsx` |

## 認証画面 (ログイン / サインアップ)

| 修正したいもの | ファイル |
|---|---|
| ログインフォーム本体 (入力欄・ボタン・バリデーション) | `src/components/auth/LoginForm.tsx` |
| 新規登録フォーム本体 | `src/components/auth/SignupForm.tsx` |
| 左側のブランドパネル (ロゴ・キャッチコピー・装飾) | `src/components/auth/BrandPanel.tsx` |

## ダッシュボード

### ヘッダー / 全体レイアウト

| 修正したいもの | ファイル |
|---|---|
| 上部ナビゲーション (subscx ロゴ / メニュー / ユーザーアバター) | `src/components/layout/Header.tsx` |
| フッター (コピーライト / 補助リンク) | `src/components/layout/Footer.tsx` |
| ページ全体の構造 (見出し・配置順) | `src/app/dashboard/page.tsx` |

### サマリーカード (上段の3つのカード)

`src/components/dashboard/SummaryCards.tsx`

| 修正したいもの | 該当箇所 |
|---|---|
| 「今月の合計」カード (紫グラデーション・装飾円) | 1つ目の `<div>` ブロック |
| 「年額換算」カード | 2つ目の `<div>` ブロック |
| 「登録サービス」カード | 3つ目の `<div>` ブロック |
| 数字のフォントサイズ | `text-3xl` / `text-4xl` などの Tailwind クラス |
| 装飾円 (右上の薄い丸) | `absolute -right-6 -top-6 ...` の `<div>` |

### サービス一覧 (下段のグリッド)

| 修正したいもの | ファイル |
|---|---|
| カテゴリフィルターのタブ (すべて / AI / エンタメ etc.) | `src/components/dashboard/ServiceGrid.tsx` |
| グリッドの列数・間隔 | `src/components/dashboard/ServiceGrid.tsx` の `grid` クラス |
| サービスカード1枚の見た目 | `src/components/dashboard/ServiceCard.tsx` |
| 「新しいサービス」追加ボタン (点線カード) | `src/components/dashboard/AddServiceButton.tsx` |

### サービスカード詳細 (`ServiceCard.tsx`)

| 修正したいもの | 該当箇所 |
|---|---|
| カード枠 (border / 角丸 / 影 / hover) | ルートの `<div>` のクラス |
| 左上アイコン (頭文字・色) | `flex h-10 w-10 ...` の `<div>` |
| 「···」メニュー (編集・削除) | `<DropdownMenu>` 配下 |
| 料金の表示位置 (左・中央・右寄せ) | 「料金」コメント下の `<div>` に `text-center` / `text-right` を追加 |
| 料金の数字サイズ | `font-numeric` の `<span>` に `text-2xl` 等 |
| カテゴリバッジ (右下) | 「フッター」コメント下の `<span>` |
| 「次回 x/xx」の表示 | 「フッター」コメント下の左側 `<p>` |

### 追加 / 編集モーダル

| 修正したいもの | ファイル |
|---|---|
| モーダルダイアログ本体 (フォーム・サービス追加/編集UI) | `src/components/dashboard/ServiceModal.tsx` |

これらの**全体的なデザインルール**を変えたい場合のみ編集する (例: 全ボタンの角丸を変える)。

## フォント運用ルール

- 通常テキスト: 自動で Noto Sans JP が当たる (body 全体に適用済み)
- 金額の数字部分のみ: `<span className="font-numeric">{数字}</span>` で Inter Bold が当たる
- `¥` 記号は Inter が非対応なので Noto Sans JP のままにすること

## 修正フローの目安

1. **特定のページの見た目** → `src/app/<route>/page.tsx` から辿る
2. **ダッシュボードの一部分** → `src/components/dashboard/` 内の該当ファイル
3. **認証画面の一部分** → `src/components/auth/` 内の該当ファイル
4. **全画面共通の色やフォント** → `src/app/globals.css` / `src/app/layout.tsx` / `src/lib/types.ts`
