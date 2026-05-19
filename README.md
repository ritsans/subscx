# subsc

自分用のサブスク管理アプリ。

## 現状
Better Auth + Turso 認証基盤セットアップ完了、サインアップ/サインインUI実装待ち

## 次やること
- [ ] サインアップ/サインインUI実装
- [ ] Google OAuth追加（後回し）

## 詰まってる / 保留
-

## やったこと (新しい順)
- 2026-05-19: Better Auth + Turso (libSQL) セットアップ完了。`/api/auth/get-session` 動作確認済み
- 2026-05-19: Turso DB `subscx` 作成、Better Auth用4テーブル (user/session/account/verification) マイグレーション完了

## Stack (変更禁止)
- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind 4 / Biome 2
- Turso (libSQL) + Drizzle ORM / Better Auth
- 詳細: `docs/spec.md` / 実装タスク: `docs/plan.md`

## v1スコープ (これが動けば完成)
- サブスク CRUD (名前・カテゴリ・料金・課金サイクル・次回請求日・メモ)
- 月額換算合計の表示
- 次回請求日が近い順に並ぶ一覧 + 7日以内の警告バナー
- Better Auth によるユーザー単位のデータ分離

## v2箱 (今回は触らない)
- グラフ / 年額予想 / CSV / 通知 / PWA / デプロイ
