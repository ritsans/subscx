# subscx MVP 実装計画

**参照仕様:** `docs/spec.md`  
**スタック:** Better Auth + Drizzle ORM + Turso

## Task 0: 依存パッケージ変更

- [ ] `pnpm add better-auth @better-auth/drizzle-adapter drizzle-orm @libsql/client`
- [ ] `pnpm add -D drizzle-kit`

## Task 1: 環境変数テンプレート

- [ ] `.env.example` 作成 (ユーザーが `.env.local` にコピーして値を入力)

## Task 2: Drizzle Kit 設定

- [ ] `drizzle.config.ts` 作成 (プロジェクトルート)
  - `dialect: 'turso'`、`schema: './src/lib/schema.ts'`
  - `dbCredentials: { url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! }`
  - Drizzle Kit 実行時に `.env.local` を読み込めるよう `dotenv/config` を import

## Task 3: 型定義

- [ ] `src/lib/types.ts` — `BillingCycle`, `Subscription`, `SubscriptionInput`

## Task 4: DB クライアント

- [ ] `src/lib/db.ts` — Drizzle + `@libsql/client` シングルトン
  - Task 6 で `auth-schema.ts` を生成するまでは `schema.ts` が未完成のため、初期作成時は schema import なしで Drizzle インスタンスを作成
  - Task 7 完了後に `schema.ts` を import する typed Drizzle に更新

## Task 5: Better Auth サーバー設定

- [ ] `src/lib/auth.ts` — Email/Password + Google OAuth + Drizzle アダプタ
  - `@better-auth/drizzle-adapter` の `drizzleAdapter(db, { provider: 'sqlite' })` を使用
  - Server Actions で Email/Password 認証の Cookie を保存できるよう、`plugins: [nextCookies()]` を設定

## Task 6: Better Auth スキーマ生成

- [ ] Task 5 の `src/lib/auth.ts` 作成後に `npx auth@latest generate --output src/lib/auth-schema.ts` を実行
- [ ] 生成ファイルを確認 (手編集しない)

## Task 7: Drizzle スキーマ

- [ ] `src/lib/schema.ts` — `auth-schema.ts` の re-export + `subscriptions` テーブル定義
  - `subscriptions` に `userId` index と `(userId, nextBillingDate)` 複合 index を追加

## Task 8: Better Auth クライアント

- [ ] `src/lib/auth-client.ts` — `createAuthClient()` (use client 専用)

## Task 9: CRUD クエリ

- [ ] `src/lib/subscriptions.ts` — `listAll`, `getOne`, `create`, `update`, `remove`
  - 全関数で `userId` フィルタ必須
  - Drizzle operators: `eq`, `and`, `asc`
  - `listAll` は `nextBillingDate` の昇順で返す
  - 月額換算は `monthly = price`、`yearly = Math.round(price / 12)`

## Task 10: Better Auth ルートハンドラ

- [ ] `src/app/api/auth/[...all]/route.ts` — `export const { GET, POST } = toNextJsHandler(auth)`

## Task 11: Proxy (ルート保護)

- [ ] `src/proxy.ts` — 未認証ユーザーを `/sign-in` へリダイレクト
  - Next.js 16 では `proxy.ts` + `export function proxy()` (middleware.ts ではない)
  - 公開パス: `/sign-in`, `/sign-up`, `/api/auth`
  - Proxy matcher で `/_next/static`, `/_next/image`, `/favicon.ico`, public assets を除外
  - Proxy では DB セッション検証を行わず、Better Auth の session cookie 存在確認だけでリダイレクト判定する
  - 実データの認証・認可は page / Server Action / CRUD クエリ側で必ず `auth.api.getSession` と `userId` 条件により再検証する

## Task 12: Server Actions

- [ ] `src/app/actions.ts` — 認証 Action と Subscription CRUD Action を作成
  - `signInEmail`, `signUpEmail`
    - `auth.api.signInEmail` / `auth.api.signUpEmail` を呼び出す
    - Better Auth の Cookie 保存は Task 5 の `nextCookies()` に任せる
    - 成功後 `redirect('/')`
  - `createSubscription`, `updateSubscription`, `removeSubscription`
    - 各アクションで `auth.api.getSession` → userId → CRUD → `revalidatePath('/')` → `redirect('/')`
    - FormData を server-side validation する
      - `name`: 必須、trim 後 1 文字以上
      - `category`: 必須、自由入力、trim 後 1 文字以上
      - `price`: 必須、整数、0 以上、日本円
      - `billingCycle`: `monthly` または `yearly`
      - `nextBillingDate`: 必須、`YYYY-MM-DD` 形式
      - `note`: 任意、空文字は `null`

## Task 13: Google サインインボタン

- [ ] `src/components/GoogleSignInButton.tsx` — `'use client'` + `authClient.signIn.social({ provider: 'google' })`

## Task 14: フォームコンポーネント

- [ ] `src/components/SubscriptionForm.tsx` — Server Component。新規/編集共用。`action` prop で Server Action 受取

## Task 15: 一覧コンポーネント

- [ ] `src/components/SubscriptionList.tsx` — Server Component。一覧表示のみ
  - 集計済みの月額合計・警告バナーは受け持たない

## Task 16: 認証ページ

- [ ] `src/app/sign-in/page.tsx` — Email/Pass フォーム + GoogleSignInButton
- [ ] `src/app/sign-up/page.tsx` — Email/Pass フォーム + GoogleSignInButton

## Task 17: レイアウト更新

- [ ] `src/app/layout.tsx` — メタデータを "subscx" に更新 (Clerk Provider の代わりに何も不要)

## Task 18: 一覧ページ

- [ ] `src/app/page.tsx` — セッション取得 → 一覧取得 → 月額合計 + 警告バナー + SubscriptionList
  - 月額合計は page 側で算出
  - 7日以内警告バナーは page 側で算出・表示
  - 7日以内は `nextBillingDate` が「今日以上、今日 + 7日以下」のものを対象にする
  - 日付比較は `YYYY-MM-DD` 文字列をローカル日付として扱い、時刻は持たない

## Task 19: 追加ページ

- [ ] `src/app/new/page.tsx` — SubscriptionForm に createSubscription を渡す

## Task 20: 編集ページ

- [ ] `src/app/edit/[id]/page.tsx` — getOne → SubscriptionForm に `updateSubscription.bind(null, id)`
  - `getOne` が `null` の場合は `notFound()` を返す

## Task 21: Lint / Type / Build 検証

- [ ] `pnpm lint` — エラー 0
- [ ] `pnpm exec tsc --noEmit` — エラー 0
- [ ] `pnpm build` — 成功

## Task 22: 動作確認 (人間タスク)

- [ ] Turso プロジェクト作成 → `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` を `.env.local` に設定
- [ ] Google Cloud Console で OAuth クライアント作成
  - Redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] `BETTER_AUTH_SECRET` を `openssl rand -base64 32` で生成、`.env.local` に設定
- [ ] `npx drizzle-kit push` でスキーマを Turso に適用
- [ ] `pnpm dev` → 手動シナリオ確認
  - 未ログイン → `/sign-in` リダイレクト
  - Email でサインアップ → `/` に到達
  - Google OAuth でサインイン
  - 「+ 追加」→ 入力 → 一覧表示
  - 月額合計計算 (yearly は /12 四捨五入)
  - 7日以内の警告バナー
  - 編集・削除機能
  - 別ユーザーでデータ分離確認
- [ ] 人間に完了報告
