# subscx MVP 実装計画

**参照仕様:** `docs/spec.md`  
**スタック:** Better Auth + Drizzle ORM + Turso


## ダッシュボード UI 実装 Todo

詳細手順: `docs/plans/2026-05-21-dashboard-impl-plan.md`
設計: `docs/plans/2026-05-21-dashboard-ui-design.md`

- [ ] Task 1: 依存追加 (zod / simple-icons / shadcn) と shadcn 初期化
- [ ] Task 2: 型定義とカテゴリ定数 (`src/lib/types.ts`)
- [ ] Task 3: subscriptions スキーマと DB クライアント (`schema.ts` / `db.ts`)
- [ ] Task 4: 集計ロジック (`src/lib/billing.ts`)
- [ ] Task 5: アイコン解決 (`src/lib/icon-map.ts`)
- [ ] Task 6: CRUD クエリ (`src/lib/subscriptions.ts`)
- [ ] Task 7: Server Actions (`src/app/actions.ts`)
- [ ] Task 8: カテゴリチップ部品 (`category-pill.tsx`)
- [ ] Task 9: サービスアイコン部品 (`service-icon.tsx`)
- [ ] Task 10: 追加・編集共用フォーム (`subscription-form.tsx`)
- [ ] Task 11: サービスカード (`subscription-card.tsx`)
- [ ] Task 12: 一覧 + カテゴリフィルタ + モーダル (`subscription-list.tsx`)
- [ ] Task 13: サマリーカード (`summary-cards.tsx`)
- [ ] Task 14: ヘッダー (`app-header.tsx`)
- [ ] Task 15: ダッシュボード画面の組み立て (`dashboard/page.tsx`)
- [ ] Task 16: 旧フォームページ廃止確認 (`/new` `/edit` を作らない)
- [ ] Task 17: README / 状態セクション更新


## 目視動作確認 (人間タスク)

- [ ] `pnpm dev` → 手動シナリオ確認
  - Google OAuth でサインイン
  - 「+ 追加」→ 入力 → 一覧表示
  - 月額合計計算 (yearly は /12 四捨五入)
  - 7日以内の警告バナー
  - 編集・削除機能
  - 別ユーザーでデータ分離確認
- [ ] 人間に完了報告
