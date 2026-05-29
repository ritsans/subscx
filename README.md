# subsc

自分用のサブスク管理アプリ。

## 現状
マイページ・カレンダー機能の実装計画書を作成完了。

## 次やること
1. ソート機能 : サービスカードの並び順をドロップダウンを配置して動的に並び替える -> spec: `docs/superpowers/specs/2026-05-28-card-sort-design.md`
2. マイページ実装 : ユーザーに関する情報と表示と変更 -> spec: `docs/plans/2026-05-26-mypage-minimum-design.md` / plan: `docs/plans/2026-05-29-mypage-implementation.md`
3. サジェスト機能 : サービス名の入力中, 厳選した有名サブスク (38件) を候補として表示。アイコンは simple-icons + Brandfetch SVG のハイブリッド構成 -> `docs/plans/2026-05-28-service-name-autocomplete.md`
4. カレンダー機能 : 月ごとのカレンダーにサブスク支払い日のバッジを付けて可視化 -> spec: `docs/superpowers/specs/2026-05-29-calendar-design.md` / plan: `docs/plans/2026-05-29-calendar-implementation.md`
5. アラートバッジ表示切替 : [新規ブランチ]サービスカードごとに「更新日までのアラート (あと◯日バッジ)」表示ON/OFFを選択可能に -> s
pec: `docs/plans/2026-05-29-alert-toggle-design.md`
6. UIまわりの細かい調整 : `temp/dashboard_campa.png`を参考に抜けているUIを実装。

v2 候補 (グラフ / 年額予想 / CSV / 通知 / PWA) のうち、次に着手するものを選定

## 詰まってる / 保留


## やったこと (新しい順)
- 2026-05-27: 日本国内向けに日付基準を `Asia/Tokyo` へ固定。`formatYmdInAppTimeZone()` を追加し、dashboard の次回請求日ソート / 残日数表示 / サービス追加モーダルの初期日付が UTC で 1 日ずれないよう修正。Vitest に日本時間境界のテストを追加し、`pnpm test` / `pnpm lint` / `pnpm tsc --noEmit` 通過
- 2026-05-27: v1 仕上げパック実装。`src/lib/billing.ts` で次回課金日の遅延評価を導入し、`nextBillingDate` をアンカー日として再解釈。7日以内の警告バッジ (`NextBillingBadge`) と主要サービスのロゴアイコン (`ServiceIcon` + `simple-icons`) を追加。モーダルの日付入力を月/日セレクトに変更。DB スキーマは無変更
- 2026-05-25: 共通レイアウト整理。`Header` / `Footer` を `src/components/layout/` に配置し、ダッシュボードへ組み込み。ダークモード非対応方針を `AGENTS.md` / `docs/theme.md` / `src/components/guide.md` に明文化
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
- 詳細: `docs/spec.md`

## v1スコープ (これが動けば完成)
- サブスク CRUD (名前・カテゴリ・料金・課金サイクル・次回請求日・メモ)
- 月額換算合計の表示
- 次回請求日が近い順に並ぶ一覧 + 7日以内の警告バナー
- Better Auth によるユーザー単位のデータ分離

## v2箱 (今回は触らない)
- グラフ / 年額予想 / CSV / 通知 / PWA / デプロイ
