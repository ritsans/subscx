# subsc

自分用のサブスク管理アプリ。

## 現状
マイページ実装完了。次はサジェスト機能かカレンダー機能。

## 次やること
0. [x] [バグ修正] 次回支払日が未来アンカーで素通りする不具合 : `inferYear()` がアンカーを未来に倒す × `nextBillingFrom()` が未来アンカーを素通りする設計不整合。`nextBillingFrom` を周期直接算出に作り直し + `inferYear` 廃止 (保存年は今年固定、UIは不変) -> spec: `docs/superpowers/specs/2026-05-30-billing-anchor-future-fix-design.md`
1. [x] ソート機能 : サービスカードの並び順をドロップダウンを配置して動的に並び替える -> spec: `docs/superpowers/specs/2026-05-28-card-sort-design.md`
2. [x] マイページ実装 : ユーザーに関する情報と表示と変更 -> spec: `docs/plans/2026-05-26-mypage-minimum-design.md` / plan: `docs/plans/2026-05-29-mypage-implementation.md`
3. サジェスト機能 : サービス名の入力中, 厳選した有名サブスク (38件) を候補として表示。アイコンは simple-icons + Brandfetch SVG のハイブリッド構成 -> `docs/plans/2026-05-28-service-name-autocomplete.md`
4. カレンダー機能 : 月ごとのカレンダーにサブスク支払い日のバッジを付けて可視化 -> spec: `docs/superpowers/specs/2026-05-29-calendar-design.md` / plan: `docs/plans/2026-05-29-calendar-implementation.md`
5. アラートバッジ表示切替 : [新規ブランチ]サービスカードごとに「更新日までのアラート (あと◯日バッジ)」表示ON/OFFを選択可能に -> s
pec: `docs/plans/2026-05-29-alert-toggle-design.md`
6. UIまわりの細かい調整 : `temp/dashboard_campa.png`を参考に抜けているUIを実装。

v2 候補 (グラフ / 年額予想 / CSV / 通知 / PWA) のうち、次に着手するものを選定

## 詰まってる / 保留
- 既存の不正データ (ChatGPT `2026-07-19` / Claude `2027-05-12`) の DB 是正は任意。`nextBillingFrom` 修正で表示は自動的に直るため、アンカー値の手当ては実装後に判断。

## やったこと (新しい順)
- 2026-05-31: マイページ実装。`getMonthlyTotal()` を `subscriptions.ts` に追加し共通化。`UserMenu` (Client) を新規作成してアバタークリックで DropdownMenu を表示、マイページ遷移・ログアウト導線を集約。`Header` を `UserMenu` に差し替え `userEmail` prop を追加。`/mypage` でアカウント情報 (名前・メール・登録日) とサブスク (件数・月額合計) を表示。`sign-out-button.tsx` を削除
- 2026-05-31: ソート機能実装。`ServiceGrid` に `sortKey` state と `sortSubs` 関数を追加。shadcn `Select` をピル行左端に配置 (支払いが近い順/追加順/高い順/安い順)。サーバー側ソートを削除しクライアント側で一元管理
- 2026-05-31: 次回支払日バグ修正 (未来アンカー問題)。`nextBillingFrom()` を前進ループから today 基準の直接算出に作り直し。`inferYear()` を廃止し `anchorFromParts()` の保存年を今年固定に変更。テスト27件 (ChatGPT・Claude実例含む) 通過
- 2026-05-30: ブランドアイコンのハイブリッド対応。`icon-map.ts` を `SimpleIcon` 単独から `IconEntry` discriminated union に拡張し、simple-icons 非対応ブランド (Disney+, Slack, ChatGPT, Nintendo 等) を `public/brand-icons/` の SVG/JPEG で補完。`ServiceIcon` を `kind` で分岐し brand-image を `<img>` 描画 (`bgColor` 背景色適用)。`<img>` は固定 28px のため `biome-ignore` で許可。**注意**: `.gitignore` の `*.svg` により `public/brand-icons/` の SVG 10件は git 管理外 (別環境では `docs/brandfetch-icons-checklist.md` を見て手動再取得が必要、`prime-video.jpeg` のみコミット済み)
- 2026-05-30: ログイン時の `A "use server" file can only export async functions, found object` エラーを修正。原因は `src/app/auth-actions.ts` (`'use server'`) が async 関数以外 (`AuthFormState` 型 / `initialAuthFormState` オブジェクト) を export していたこと。型と定数を新規 `src/app/auth-form-state.ts` に切り出し、`auth-actions.ts` は関数のみ export に。`LoginForm.tsx` / `SignupForm.tsx` の import を分割。`pnpm dev` 再起動で Server Actions の制約チェックが厳格化され顕在化したと推定
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
