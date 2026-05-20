# subscx MVP 設計書

**作成日:** 2026-05-18  
**更新日:** 2026-05-20

## 目的
個人のサブスクリプション管理 Web ツール MVP。追加・一覧・編集・削除ができる最小限のアプリ。

## ゴール
- CRUD 機能 (追加・一覧・編集・削除)
- 月額換算合計を表示
- 次回請求日の近い順に表示
- Better Auth で認証・ユーザー単位管理
- Server Components + Server Actions のみで実装

## スタック
| 項目 | 採用 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + React 19 |
| スタイリング | Tailwind CSS 4 |
| Lint | Biome 2 |
| DB | Turso (libSQL/SQLite) |
| ORM | Drizzle ORM (`drizzle-orm`) |
| DB クライアント | `@libsql/client` |
| 認証 | Better Auth (`better-auth`) |
| 認証 DB アダプタ | `@better-auth/drizzle-adapter` |
| 認証方式 | Email + Password、Google OAuth |

## スキーマ

Drizzle ORM で管理する。`schema.sql` は不要。

### subscriptions テーブル

```typescript
// src/lib/schema.ts
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).notNull(),
  nextBillingDate: text('next_billing_date').notNull(), // ISO date string (YYYY-MM-DD)
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_user_next_billing_idx').on(table.userId, table.nextBillingDate),
});
```

### Better Auth テーブル

`src/lib/auth.ts` に Drizzle アダプタ設定を作成した後、`npx auth@latest generate --output src/lib/auth-schema.ts` で `src/lib/auth-schema.ts` を生成。
`schema.ts` から re-export することで `drizzle-kit push` が一括作成する。

## ファイル構成

凡例: ✅ 実装済み / 🔜 未実装

```
src/
  proxy.ts                   ✅ ルート保護 (Next.js 16: middleware.ts ではなく proxy.ts)
  app/
    layout.tsx               ✅ メタデータのみ (Better Auth は Provider 不要)
    page.tsx                 ✅ トップページ (現状はリダイレクト等)
    login/page.tsx           ✅ ログイン/新規登録タブ切替フォーム (sign-in・sign-up を統合)
    dashboard/page.tsx       ✅ ダッシュボード (一覧 + 月額合計 + 警告バナー、CRUD実装前のスケルトン)
    mypage/page.tsx          ✅ マイページ (ログアウト等)
    actions.ts               🔜 Server Actions (create/update/remove)
    new/page.tsx             🔜 追加フォーム
    edit/[id]/page.tsx       🔜 編集フォーム
    api/auth/[...all]/route.ts  ✅ Better Auth ルートハンドラ
  components/
    auth-form.tsx            ✅ ログイン/新規登録フォーム UI (use client、タブ切替)
    sign-out-button.tsx      ✅ サインアウトボタン (use client)
    SubscriptionForm.tsx     🔜 フォーム UI (追加/編集共用)
    SubscriptionList.tsx     🔜 一覧 UI
  lib/
    env.ts                   ✅ 環境変数ラッパー (server-only)
    auth-schema.ts           ✅ Better Auth 生成テーブル (CLI 生成、手編集しない)
    schema.ts                ✅ auth-schema re-export + subscriptions テーブル
    db.ts                    ✅ Drizzle + Turso クライアントシングルトン
    auth.ts                  ✅ Better Auth サーバー設定 (Drizzle adapter + nextCookies)
    auth-client.ts           ✅ Better Auth クライアント (use client コンポーネント専用)
    get-session.ts           ✅ `auth.api.getSession` のサーバー向けラッパー
    types.ts                 🔜 型定義 (Subscription, BillingCycle)
    subscriptions.ts         🔜 CRUD クエリ (listAll/getOne/create/update/remove)

drizzle.config.ts            ✅ Drizzle Kit 設定 (プロジェクトルート)
.env.example                 ✅ 環境変数テンプレート
```

## 制約
- **3 ディレクトリ構造厳守**: `src/app` `src/components` `src/lib` のみ。ただし Next.js 16 のルート保護用に `src/proxy.ts` は例外として許可する
- **認可**: 全クエリで `WHERE user_id = ?` を必須化
- `src/lib/auth-schema.ts` は CLI 生成ファイル。手編集しない

## データフロー
- **認証**: `src/proxy.ts` で公開パス (`/sign-in`, `/sign-up`, `/api/auth`) 以外を保護。Proxy matcher では `/_next/static`, `/_next/image`, `/favicon.ico`, public assets を除外する
- **読み取り**: Server Component → `auth.api.getSession({ headers })` で userId 取得 → `lib/subscriptions.ts` で DB 読み込み → レンダリング
- **書き込み**: `<form action={serverAction}>` → Server Action → DB 更新 → `revalidatePath('/')` → `redirect('/')`
- **認可**: update/remove では `WHERE id = ? AND user_id = ?` で他人レコード操作を防止

## 環境変数

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
BETTER_AUTH_SECRET=generate_with_openssl_rand_-base64_32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```
