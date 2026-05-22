# subsc

自分用のサブスク管理アプリ。

## 現状
認証画面 UI 刷新完了。`/login` と `/signup` が同一2カラムレイアウトで実装済み。

## 次やること
- BrandPanel プレビューカードを実データで復活 (任意)

## 詰まってる / 保留


## やったこと (新しい順)
- 2026-05-22: 新規登録画面 `/signup` 追加、旧 `auth-form.tsx` 削除
- 2026-05-22: ログイン画面 UI 刷新。デザインカンプ基づき2カラムレイアウト (BrandPanel + LoginForm)、rememberMe・パスワード表示トグル実装
- 2026-05-22: 第3周完了。shadcn/ui導入、ダッシュボードUI全面刷新 (カードグリッド・モーダルCRUD・カテゴリ絞り込み・サマリー3カード)。テーマ設定を `docs/theme.md` に文書化
- 2026-05-22: 第2周実装完了。getOne/update/remove + zod v4 + SubscriptionForm + searchParams inline edit UI
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
