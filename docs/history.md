# 作業履歴アーカイブ

README.md の「やったこと」から古い履歴を移管。

## 2026-05-27

- **Asia/Tokyo 固定**: `formatYmdInAppTimeZone()` を追加し、dashboard の次回請求日ソート / 残日数表示 / サービス追加モーダルの初期日付が UTC で 1 日ずれないよう修正。Vitest に日本時間境界のテスト追加。`pnpm test` / `pnpm lint` / `pnpm tsc --noEmit` 通過。
- **v1 仕上げパック**: `src/lib/billing.ts` で次回課金日の遅延評価を導入し `nextBillingDate` をアンカー日として再解釈。7日以内の警告バッジ (`NextBillingBadge`) と主要サービスのロゴアイコン (`ServiceIcon` + `simple-icons`) を追加。モーダルの日付入力を月/日セレクトに変更。DB スキーマは無変更。

## 2026-05-25

- **共通レイアウト整理**: `Header` / `Footer` を `src/components/layout/` に配置しダッシュボードへ組み込み。ダークモード非対応方針を `AGENTS.md` / `docs/theme.md` / `src/components/guide.md` に明文化。

## 2026-05-22

- **新規登録画面**: `/signup` 追加、旧 `auth-form.tsx` 削除。
- **ログイン画面 UI 刷新**: デザインカンプ基づき 2 カラムレイアウト (BrandPanel + LoginForm)、rememberMe・パスワード表示トグル実装。
- **第3周完了**: shadcn/ui 導入、ダッシュボード UI 全面刷新 (カードグリッド・モーダル CRUD・カテゴリ絞り込み・サマリー 3 カード)。テーマ設定を `docs/theme.md` に文書化。
- **第2周実装完了**: getOne / update / remove + zod v4 + SubscriptionForm + searchParams inline edit UI。

## 2026-05-21

- **第1周完了**: types / schema / db / subscriptions / actions / dashboard を実装。フォーム→DB 保存→一覧表示の動作確認済み。

## 2026-05-20

- **認証フロー**: login / signup / logout の動作確認完了 (実アカウント作成で検証済み)。
- **認証フロー UI**: `/login` (タブ切替フォーム)・`/dashboard`・`/mypage`・proxy による保護を追加。

## 2026-05-19

- **Better Auth + Turso セットアップ完了**: `/api/auth/get-session` 動作確認済み。
- **Turso DB 作成**: `subscx` 作成、Better Auth 用 4 テーブル (user / session / account / verification) マイグレーション完了。
