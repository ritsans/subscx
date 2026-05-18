# subscx MVP 設計書

**作成日:** 2026-05-18

## 目的
個人のサブスクリプション管理 Web ツール MVP。追加・一覧・編集・削除ができる最小限のアプリ。

## ゴール
- CRUD 機能 (追加・一覧・編集・削除)
- 月額換算合計を表示
- 次回請求日の近い順に表示
- Clerk で認証・ユーザー単位管理
- Server Components + Server Actions のみで実装
- 過剰な ORM / マイグレーションツール不要

## スタック
| 項目 | 採用 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + React 19 |
| スタイリング | Tailwind CSS 4 |
| Lint | Biome 2 |
| DB | Neon (Postgres) |
| DB クライアント | `postgres` (porsager) |
| 認証 | Clerk (`@clerk/nextjs`) |

## スキーマ

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL,
  name              text NOT NULL,
  category          text NOT NULL,
  price             integer NOT NULL,
  billing_cycle     text NOT NULL,     -- 'monthly' | 'yearly'
  next_billing_date date NOT NULL,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
```

## ファイル構成

```
src/
  middleware.ts              Clerk ルート保護
  app/
    layout.tsx               ClerkProvider でラップ
    page.tsx                 一覧 + 月額合計 + 警告バナー
    actions.ts               Server Actions (create/update/remove)
    new/page.tsx             追加フォーム
    edit/[id]/page.tsx       編集フォーム
    sign-in/[[...rest]]/     Clerk SignIn
    sign-up/[[...rest]]/     Clerk SignUp
  components/
    SubscriptionForm.tsx     フォーム UI (追加/編集共用)
    SubscriptionList.tsx     一覧 UI
  lib/
    types.ts                 型定義 (Subscription, BillingCycle)
    db.ts                    postgres シングルトン
    auth.ts                  Clerk userId 取得
    subscriptions.ts         CRUD クエリ (listAll/getOne/create/update/remove)

.env.example
schema.sql
```

## 制約
- **3 ディレクトリ構造厳守**: `src/app` `src/components` `src/lib` のみ
- **1 関数 50 行以内**、**1 ファイル 150 行以内**
- **全 TS/TSX ファイル冒頭**: 50〜120字の日本語説明コメント
- **認可**: 全クエリで `WHERE user_id = ?` を必須化

## データフロー
- **認証**: middleware で `/sign-in` `/sign-up` 以外を保護
- **読み取り**: Server Component → `lib/auth.ts` で userId 取得 → `lib/subscriptions.ts` で DB 読み込み → レンダリング
- **書き込み**: `<form action={serverAction}>` → Server Action → DB 更新 → `revalidatePath('/')` → リダイレクト
- **認可**: update/remove では `WHERE id = ? AND user_id = ?` で他人レコード非表示化

## 環境変数
```
DATABASE_URL=postgres://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
