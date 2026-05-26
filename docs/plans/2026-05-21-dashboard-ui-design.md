# ダッシュボード UI 設計

作成日: 2026-05-21
参照: `docs/spec.md` / `docs/plan.md`

## 目的

サブスク管理のコア画面を作る。ダッシュボード1画面と、サービスの追加・編集モーダルを完成させる。

## スコープ

v1 で作るもの:

- ダッシュボード画面
- サービス追加 / 編集モーダル
- サービスの CRUD
- 月額換算合計と年額換算の表示
- カテゴリフィルタ

v2 に回すもの:

- カレンダー画面、設定画面
- 通知ベル
- 先月比、AI 内訳などの派生指標
- 7日以内の請求警告

## ページ構成

| パス | 内容 |
|------|------|
| `/dashboard` | メイン画面。Server Component。集計はサーバーで計算する |
| `/` `/login` `/mypage` | 既存のまま変更しない |

サービスの追加・編集は独立ページを作らない。shadcn/ui の Dialog でモーダル表示する。
`/new` と `/edit/[id]` は廃止する。

ナビの「サービス」「カレンダー」「設定」は項目を表示するが、グレーアウトして
クリック不可にする。有効なのは「ダッシュボード」のみ。

## 画面レイアウト

```
ヘッダー       ロゴ / ナビ / 通知ベル(飾り) / アバター
あいさつ       2026年5月 / こんにちは、◯◯さん / [+ サービスを追加]
サマリーカード  今月の合計 / 年額換算 / 登録件数
サービス一覧    カテゴリフィルタ + サービスカードのグリッド
```

## コンポーネント

3ディレクトリ構造を守る。Server Component をデフォルトとし、
`use client` は操作が必要な末端だけに付ける。

### `src/app/`

| ファイル | 役割 |
|----------|------|
| `dashboard/page.tsx` | セッション取得 → DB 読込 → 集計 → 描画 |
| `actions.ts` | Server Actions。create / update / remove |

### `src/components/`

| ファイル | 種別 | 役割 |
|----------|------|------|
| `app-header.tsx` | client | ヘッダー。ナビの active 判定 |
| `summary-cards.tsx` | server | サマリーカード3枚 |
| `subscription-list.tsx` | client | 一覧セクション。カテゴリフィルタの state |
| `subscription-card.tsx` | server | サービスカード1枚 |
| `subscription-form.tsx` | client | 追加・編集の共用フォーム。モーダルの中身 |
| `service-icon.tsx` | server | ブランドアイコン解決と頭文字バッジ |
| `category-pill.tsx` | server | フィルタチップとカテゴリラベルの共用部品 |
| `ui/` | - | shadcn/ui の生成コンポーネント |

### `src/lib/`

| ファイル | 役割 |
|----------|------|
| `schema.ts` | `subscriptions` テーブル定義 |
| `types.ts` | `Subscription` / `BillingCycle` / `Category` 型 |
| `subscriptions.ts` | CRUD クエリ。全クエリで `user_id` を必須にする |
| `billing.ts` | 月額換算・年額換算の純粋関数 |
| `icon-map.ts` | サービス名から simple-icons のブランドを解決する |

## データモデル

カテゴリは固定5種の enum にする。

```
AI / エンタメ / 仕事 / 音楽 / 買い物
```

spec.md では自由 text だったが、フィルタチップが固定なので enum に変更する。
フォームはセレクトボックスで選ばせる。

一覧の並び順は次回請求日の昇順。`listAll` の `ORDER BY` で指定する。

## 集計ロジック

`src/lib/billing.ts` に純粋関数として置く。

| 関数 | 内容 |
|------|------|
| `toMonthly(price, cycle)` | yearly は `/12` して四捨五入。monthly はそのまま |
| `monthlyTotal(subs)` | 全件を月額換算して合計する |
| `yearlyTotal(subs)` | `monthlyTotal` を12倍する |

## アイコン

ブランドアイコンは `simple-icons` を使う。

1. サービス名を正規化する(小文字化・空白除去)
2. simple-icons の slug と照合する
3. 見つかればブランドの SVG とカラーを使う
4. 見つからなければ頭文字バッジにフォールバックする

頭文字バッジはサービス名の1文字目を、カテゴリ色の背景で表示する。
未知のサービスでも必ず表示が成立する。

UI のアイコン(ベル・三点・プラスなど)は shadcn 同梱の `lucide-react` を使う。

## カテゴリフィルタ

クライアント側で絞り込む。`subscription-list.tsx` を `use client` にして、
選択中カテゴリを `useState` で持ち、取得済みの配列を `filter` する。

サービス数は数十件程度なので、サーバー往復は不要。チップ操作は即座に反映される。

## 書き込みフロー

```
<form action={serverAction}>
  → Server Action 内で getSession() し userId を取得
  → zod でバリデーション
  → DB を insert / update / delete
  → revalidatePath('/dashboard')
  → モーダルを閉じる
```

Server Actions は3つ。

| 関数 | 用途 |
|------|------|
| `createSubscription` | 追加モーダルから |
| `updateSubscription` | 編集モーダルから。`WHERE id=? AND user_id=?` |
| `removeSubscription` | 編集モーダル内の削除ボタンから |

update と remove は `user_id` を条件に含め、他人のレコードを操作できないようにする。

## バリデーション

`zod` を使う。Server Action 内でスキーマ検証する。

- `name` は必須
- `price` は正の整数
- `category` は5種のいずれか
- `nextBillingDate` は有効な日付

エラーは `useActionState` でフォームに返す。

## 追加するもの

UI 実装のための追加を承認済み。

- 新ディレクトリ `src/components/ui/`(shadcn 生成物)
- npm: `simple-icons` `zod` および shadcn 依存群
  (radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react)
- `globals.css` に shadcn のテーマ CSS 変数を追記
