# subsc

自分用のサブスク管理アプリ。

## 現状
(1行で。e.g: 編集モーダルのバリデーション実装中)

## 次やること
- [ ]
- [ ]

## 詰まってる / 保留
-

## やったこと (新しい順)
- YYYY-MM-DD:

## Stack (変更禁止)
- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind 4 / Biome 2
- Neon (Postgres) + `postgres` (porsager) / Clerk 認証
- 詳細: `docs/spec.md` / 実装タスク: `docs/plan.md`

## v1スコープ (これが動けば完成)
- サブスク CRUD (名前・カテゴリ・料金・課金サイクル・次回請求日・メモ)
- 月額換算合計の表示
- 次回請求日が近い順に並ぶ一覧 + 7日以内の警告バナー
- Clerk によるユーザー単位のデータ分離

## v2箱 (今回は触らない)
- グラフ / 年額予想 / CSV / 通知 / PWA / デプロイ
