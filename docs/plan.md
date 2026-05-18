# subscx MVP 実装計画

**参照仕様:** `docs/spec.md`

## Task 0: 依存追加の人間承認
- [ ] `postgres` + `@clerk/nextjs` の追加をユーザーに承認申請
- [ ] 承認後 `pnpm add postgres @clerk/nextjs`

## Task 1: 環境変数テンプレート + スキーマ
- [ ] `.env.example` 作成
- [ ] `schema.sql` 作成

## Task 2: 型定義
- [ ] `src/lib/types.ts` — `BillingCycle`, `Subscription`, `SubscriptionInput`

## Task 3: DB クライアント
- [ ] `src/lib/db.ts` — postgres シングルトン (`prepare: false`)

## Task 4: 認証ヘルパ
- [ ] `src/lib/auth.ts` — `requireUserId()` (未認証時は throw)

## Task 5: CRUD クエリ
- [ ] `src/lib/subscriptions.ts` — `listAll`, `getOne`, `create`, `update`, `remove` (全関数 `userId` 必須)

## Task 6: Clerk middleware
- [ ] `src/middleware.ts` — `/sign-in` `/sign-up` のみ公開

## Task 7: ClerkProvider
- [ ] `src/app/layout.tsx` を `ClerkProvider` でラップ

## Task 8: 認証ページ
- [ ] `src/app/sign-in/[[...rest]]/page.tsx`
- [ ] `src/app/sign-up/[[...rest]]/page.tsx`

## Task 9: Server Actions
- [ ] `src/app/actions.ts` — `createSubscription`, `updateSubscription`, `removeSubscription` (FormData バリデーション + `revalidatePath`)

## Task 10: フォームコンポーネント
- [ ] `src/components/SubscriptionForm.tsx` — 新規/編集共用フォーム

## Task 11: 一覧コンポーネント
- [ ] `src/components/SubscriptionList.tsx` — 一覧テーブル + 編集/削除ボタン

## Task 12: 一覧ページ
- [ ] `src/app/page.tsx` — 月額換算合計 + 7日以内警告バナー + UserButton

## Task 13: 追加ページ
- [ ] `src/app/new/page.tsx` — SubscriptionForm に createSubscription 渡す

## Task 14: 編集ページ
- [ ] `src/app/edit/[id]/page.tsx` — `updateSubscription.bind(null, id)` で共用フォーム利用
- [ ] **人間確認**: `src/app/edit/` 新規ディレクトリ作成可否

## Task 15: Lint/Type/Build 検証
- [ ] `pnpm lint` — エラー 0
- [ ] `pnpm exec tsc --noEmit` — エラー 0
- [ ] `pnpm build` — 成功

## Task 16: 動作確認 (人間タスク)
- [ ] Neon プロジェクト作成 → `DATABASE_URL` を `.env.local` に設定
- [ ] Clerk アプリ作成 → キーを `.env.local` に設定
- [ ] `psql "$DATABASE_URL" -f schema.sql` でスキーマ適用
- [ ] `pnpm dev` → 手動シナリオ確認
  - 未ログイン → `/sign-in` リダイレクト
  - `/sign-up` でユーザー作成 → `/` に到達
  - 「+ 追加」→ 入力 → 一覧表示
  - 月額合計計算 (yearly は /12 四捨五入)
  - 7日以内の警告バナー
  - 編集・削除機能
  - 別ユーザーでデータ分離確認
- [ ] 人間に完了報告
