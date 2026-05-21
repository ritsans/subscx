# subsc

自分用のサブスク管理アプリ。

## 現状
第1周 (walking skeleton) 完了。フォーム送信 → DB保存 → 一覧表示の最小サイクルが動作する状態。

## 次やること
- [ ] 第2周: CRUD完成 (getOne / update / remove + zod + 編集UI)
~~- [ ] Google OAuth追加（後回し）~~

## 詰まってる / 保留


## やったこと (新しい順)
- 2026-05-21: 第1周完了。types / schema / db / subscriptions / actions / dashboard を実装。フォーム→DB保存→一覧表示の動作確認済み
- 2026-05-20: login / signup / logout の動作確認完了（実アカウント作成で検証済み）
- 2026-05-20: 認証フロー UI 実装完了。`/login` (タブ切替フォーム)・`/dashboard`・`/mypage`・proxy による保護を追加
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
