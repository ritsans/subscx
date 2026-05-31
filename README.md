# subsc

自分用のサブスク管理アプリ。

## 現状
カレンダー機能実装完了。次はサジェスト機能かアラートバッジ表示切替。

## 次やること
0. [x] [バグ修正] 次回支払日が未来アンカーで素通りする不具合 : `inferYear()` がアンカーを未来に倒す × `nextBillingFrom()` が未来アンカーを素通りする設計不整合。`nextBillingFrom` を周期直接算出に作り直し + `inferYear` 廃止 (保存年は今年固定、UIは不変) -> spec: `docs/superpowers/specs/2026-05-30-billing-anchor-future-fix-design.md`
1. [x] ソート機能 : サービスカードの並び順をドロップダウンを配置して動的に並び替える -> spec: `docs/superpowers/specs/2026-05-28-card-sort-design.md`
2. [x] マイページ実装 : ユーザーに関する情報と表示と変更 -> spec: `docs/plans/2026-05-26-mypage-minimum-design.md` / plan: `docs/plans/2026-05-29-mypage-implementation.md`
3. サジェスト機能 : サービス名の入力中, 厳選した有名サブスク (38件) を候補として表示。アイコンは simple-icons + Brandfetch SVG のハイブリッド構成 -> `docs/plans/2026-05-28-service-name-autocomplete.md`
4. [x] カレンダー機能 : 月ごとのカレンダーにサブスク支払い日のバッジを付けて可視化 -> spec: `docs/superpowers/specs/2026-05-29-calendar-design.md` / plan: `docs/plans/2026-05-29-calendar-implementation.md`
5. アラートバッジ表示切替 : [新規ブランチ]サービスカードごとに「更新日までのアラート (あと◯日バッジ)」表示ON/OFFを選択可能に -> s
pec: `docs/plans/2026-05-29-alert-toggle-design.md`
6. UIまわりの細かい調整 : `temp/dashboard_campa.png`を参考に抜けているUIを実装。

v2 候補 (グラフ / 年額予想 / CSV / 通知 / PWA) のうち、次に着手するものを選定

## 詰まってる / 保留
- 既存の不正データ (ChatGPT `2026-07-19` / Claude `2027-05-12`) の DB 是正は任意。`nextBillingFrom` 修正で表示は自動的に直るため、アンカー値の手当ては実装後に判断。

## やったこと (新しい順)

これより過去の履歴は `docs/history.md` を参照。

- 2026-05-31: カレンダー機能実装。`src/lib/calendar.ts` に純粋関数 (`buildMonthGrid` / `expandSubscriptionsToMonth` / `groupEventsByDate` 等) を実装し Vitest 22件通過。`src/components/calendar/` 配下に4コンポーネント作成。`/calendar` ルート追加、祝日対応、土日カラーリング、サブスク請求日バッジ表示。Header のナビゲーションリンクを実パスに変更。
- 2026-05-31: マイページ実装。`getMonthlyTotal()` を `subscriptions.ts` に追加し共通化。`UserMenu` (Client) を新規作成してアバタークリックで DropdownMenu を表示。`/mypage` でアカウント情報 (名前・メール・登録日) とサブスク (件数・月額合計) を表示。`sign-out-button.tsx` を削除。
- 2026-05-31: ソート機能実装。`ServiceGrid` に `sortKey` state と `sortSubs` 関数を追加。shadcn `Select` をピル行左端に配置 (支払いが近い順/追加順/高い順/安い順)。サーバー側ソートを削除しクライアント側で一元管理。
- 2026-05-31: 次回支払日バグ修正 (未来アンカー問題)。`nextBillingFrom()` を前進ループから today 基準の直接算出に作り直し。`inferYear()` を廃止し `anchorFromParts()` の保存年を今年固定に変更。テスト27件通過。
- 2026-05-30: ブランドアイコンのハイブリッド対応。`icon-map.ts` を `IconEntry` discriminated union に拡張し、simple-icons 非対応ブランドを `public/brand-icons/` の SVG/JPEG で補完。**注意**: `.gitignore` の `*.svg` により SVG 10件は git 管理外 (`docs/brandfetch-icons-checklist.md` 参照)。
- 2026-05-30: ログイン時の `use server` エラー修正。型と定数を `src/app/auth-form-state.ts` に切り出し、`auth-actions.ts` は関数のみ export に変更。

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
