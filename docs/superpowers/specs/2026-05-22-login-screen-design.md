# ログイン画面 刷新 設計書

作成日: 2026-05-22

## 目的

デザインカンプ (`temp/Login.png`) に基づき `/login` ページを刷新する。
既存の `auth-form.tsx` (インラインスタイルのタブ切替フォーム) を置き換える。

## スコープ

### やること
- `/login` ページを2カラムレイアウトに刷新
- ログイン専用フォームの実装 (メール/パスワード)
- 「ログイン状態を保持」チェックボックスを機能させる
- 左パネル (ブランド紹介) をカンプ忠実に再現

### やらないこと
- 新規登録ページ (`/signup`) の実装 — 別タスク
- Google OAuth の実装 — ボタンUIのみ、クリック無効
- 「パスワードを忘れた」のリンク先ページ — リンクは無効
- 既存 `auth-form.tsx` の削除 — `/signup` 未整備のため一旦残す

## レイアウト

`min-h-screen` のフルハイト。`lg` ブレークポイントで2カラム化。

```
lg未満:  右パネル (フォーム) のみ 1カラム
lg以上:  [ 左: ブランドパネル | 右: ログインフォーム ]  grid-cols-2
```

### 左パネル (BrandPanel) — lg以上のみ表示

カンプ忠実再現。violet系の薄い背景。

- 円形シェイプ装飾 (右上、半透明の円)
- ロゴ: 角丸正方形に "s" + "subscx" テキスト
- 小見出し: "SUBSCRIPTIONS, SIMPLIFIED" (violet、トラッキング広め)
- キャッチコピー: 「毎月の / サブスクを、/ ひと目で。」 (大きく太字)
- 説明文: 3行のサブテキスト
- プレビューカード: 左下に浮かぶ白カード。カテゴリアイコン (a/N/S/Ai のチップ重ね) + 「今月の合計 ¥18,450」

### 右パネル (LoginForm)

縦中央寄せ。最大幅 ~400px。

- 見出し「ログイン」
- サブテキスト「続けるにはアカウントにサインインしてください」
- メールアドレス入力 (Label + Input)
- パスワード入力 (Label + Input、右端に「表示」トグル)
- 「ログイン状態を保持」チェックボックス + 「パスワードを忘れた」リンク (横並び)
- エラー表示領域
- 「ログイン」送信ボタン (黒、フル幅)
- 区切り線「または」
- 「Googleで続ける」ボタン (白、アウトライン、Googleロゴ)
- 「アカウントをお持ちでない? 新規登録」リンク (`/signup` へ)

## コンポーネント構成

| ファイル | 種別 | 役割 |
|---|---|---|
| `src/app/login/page.tsx` | Server Component | 2カラムレイアウトを構成、左右パネルを配置 |
| `src/components/auth/BrandPanel.tsx` | Server Component | 左の紹介パネル (装飾・キャッチ・プレビューカード) |
| `src/components/auth/LoginForm.tsx` | Client Component | フォーム入力・状態管理・送信処理 |

`src/components/auth/` ディレクトリを新設 (ユーザー承認済み)。

## 状態とロジック (LoginForm)

`use client`。`useState` で管理:

- `email`, `password` — 入力値
- `showPassword` — パスワード表示トグル
- `rememberMe` — ログイン状態保持 (初期値 true、カンプでチェック済み)
- `error` — エラーメッセージ
- `pending` — 送信中フラグ

### 送信処理

```
authClient.signIn.email({ email, password, rememberMe })
```

- 成功: `router.push('/dashboard')` + `router.refresh()`
- 失敗: `error` にメッセージをセット
- `finally` で `pending` 解除

`rememberMe` は Better Auth の `signIn.email` がサポートするパラメータ。

## スタイル

既存テーマ (`docs/theme.md`) に準拠。

- アクセント: violet-600
- shadcn `Button` / `Input` / `Label` を流用
- 送信ボタンは黒 (`bg-stone-900` 系)、Googleボタンは白アウトライン
- 左パネル背景: violet系の薄いグラデーション

## エラーハンドリング

- 認証失敗: Better Auth のエラーメッセージを表示。無ければ「ログインに失敗しました」
- 入力必須: `required` 属性でブラウザ標準バリデーション

## 動作確認

- `pnpm dev` で `/login` を開きカンプとの見た目を比較
- lg未満/以上でレイアウト切替を確認
- パスワード表示トグルの動作
- 実アカウントでログイン成功 → `/dashboard` 遷移
- 誤った認証情報でエラー表示
- `pnpm lint` / `pnpm tsc --noEmit` を通す
