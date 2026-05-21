# subscx MVP 実装計画

**参照仕様:** `docs/spec.md`  
**スタック:** Better Auth + Drizzle ORM + Turso


## ダッシュボード UI 実装 Todo (縦割り3周)

詳細手順: `docs/plans/2026-05-21-dashboard-impl-plan.md`
設計: `docs/plans/2026-05-21-dashboard-ui-design.md`

方針: 薄く一周させる縦割りにする。各周の末尾で `pnpm dev` 目視確認 → コミット。どこで力尽きても動くアプリが残る。

### 第1周: 歩く骨格 (動かす)

ゴール: フォーム送信 → DB保存 → カードが1枚出る、を目で見る。

- [ ] 1.1 `src/lib/types.ts` — Subscription / Category / BillingCycle 型と CATEGORIES 定数
- [ ] 1.2 `src/lib/schema.ts` — subscriptions テーブル + auth-schema 再エクスポート
- [ ] 1.3 `src/lib/db.ts` — Drizzle + Turso シングルトン
- [ ] 1.4 `drizzle.config.ts` — schema パスを `schema.ts` に変更
- [ ] 1.5 `pnpm drizzle-kit push` で subscriptions テーブルを Turso に反映
- [ ] 1.6 `src/lib/subscriptions.ts` — create と listAll の2関数だけ (全クエリ user_id 必須)
- [ ] 1.7 `src/app/actions.ts` — createSubscription のみ (zod なし、手書き検証)
- [ ] 1.8 `src/app/dashboard/page.tsx` — 素の `<ul>` 一覧 + ページ直置きの素HTML `<form>`
- [ ] 1.9 `pnpm tsc --noEmit` と `pnpm lint` が通る
- [ ] 1.10 目視確認: `pnpm dev` で 1件追加 → カード表示。OK ならコミット

### 第2周: CRUD完成 = 勝利ライン (v1完成)

ゴール: 追加・編集・削除すべてが動く。ここを越えたら v1完成。

- [ ] 2.1 `subscriptions.ts` に getOne / update / remove を追加 (id + user_id 両方を条件)
- [ ] 2.2 zod をインストール (`pnpm add zod` を提示)
- [ ] 2.3 `actions.ts` に update / remove を追加、3アクションを zod 検証に置き換え
- [ ] 2.4 フォームを追加 / 編集 共用に拡張 (subscription prop で出し分け)
- [ ] 2.5 編集モードに削除ボタンを追加
- [ ] 2.6 カードクリックで編集フォームが出る出し分け (モーダルなし、同ページ)
- [ ] 2.7 `pnpm tsc --noEmit` と `pnpm lint` が通る
- [ ] 2.8 目視確認 = 勝利ライン: 追加 → 編集 → 削除 を一通り実行。コミット → v1完成

### 第3周: 装飾 (諦めても v1 は壊れない / 各項目ごとにコミット)

- [ ] 3.1 shadcn/ui 初期化 + dialog / button / input / label / select / textarea 追加
- [ ] 3.2 共用フォームを shadcn Dialog に移しモーダル化
- [ ] 3.3 `src/lib/billing.ts` — 月額 / 年額換算の純粋関数
- [ ] 3.4 `summary-cards.tsx` — 月額合計 / 年額換算 / 登録件数の3枚
- [ ] 3.5 `category-pill.tsx` + 一覧のクライアント側カテゴリ絞り込み
- [ ] 3.6 simple-icons + `icon-map.ts` + `service-icon.tsx` (未知名は頭文字バッジ)
- [ ] 3.7 `app-header.tsx` — ロゴ / ナビ / アバター
- [ ] 3.8 仕上げ: Frontend Design skill で AI-slop 排除。最終目視確認 → コミット
