# ダッシュボード UI 刷新 設計書

- 日付: 2026-05-22
- 対象: `/dashboard` ページの UI 全面刷新
- カンプ: `temp/dashboard_campa.png`

## 1. 目的とスコープ

現状の `/dashboard` は最小限のインラインフォーム + リスト表示。これをカンプデザインに沿った
カードグリッド + モーダル UI に刷新する。

### スコープに含む (実機能)

- 上部サマリー 3 カード: 今月の合計 (月額換算)・年額換算・登録サービス件数 (うち AI 件数)
- 登録中サービスのカードグリッド表示
- カテゴリ絞り込み (すべて / AI / エンタメ / 仕事 / 音楽 / 買い物)
- サービスの追加・編集・削除をモーダルで実現
- カード右上「···」メニューから編集 / 削除

### スコープに含まない (カンプ上の参考要素)

カンプには現データモデルに無い要素が含まれる。これらは見た目の参考に留め、
ダミー静的表示または省略とする。

- ヘッダーナビ「サービス / カレンダー / 設定」: ダミーリンク (`#`)
- 通知ベル・アバター: 静的表示
- 「先月比 +¥1,490 (Netflix を追加)」: 履歴データが無いため静的ダミー文言、または非表示
- カレンダーページ等の他ページ: 作らない

## 2. 全体構成とコンポーネント分割

方針: ダッシュボードはサーバーコンポーネントのままデータ取得と集計を担う。
インタラクティブ要素 (モーダル・「···」メニュー・カテゴリ絞り込み・追加ボタン) のみ
最末端で `use client` に切り出す (CLAUDE.md の方針に準拠)。

### ファイル構成

`src/components/dashboard/` を新設する (人間に確認済み)。

```
src/app/dashboard/page.tsx        サーバー: セッション確認・データ取得・集計
src/components/dashboard/
  Header.tsx                   サーバー: ロゴ・ナビ(ダミー)・通知・アバター
  SummaryCards.tsx                サーバー: 上部3カード(合計/年額/件数)
  ServiceGrid.tsx                 client: カテゴリ絞り込み + カードグリッド
  ServiceCard.tsx                 client: 個別カード + 「···」メニュー
  ServiceModal.tsx                client: 追加/編集モーダル(<dialog>)
  AddServiceButton.tsx            client: 「+ サービスを追加」ボタン
```

既存 `SubscriptionForm.tsx` はモーダル内フォームとして流用する。
インライン `style` を Tailwind に置換し、ServiceModal 内で使う前提に調整する。

### データフロー

1. `page.tsx` が `listAll()` で全件取得し、月額換算合計・年額・件数を算出
2. 集計値を `SummaryCards` へ、配列を `ServiceGrid` へ props で渡す
3. `ServiceGrid` がカテゴリ state を持ち、クライアント側でフィルタ
4. 追加 / 編集 / 削除は既存 Server Action をそのまま使用 (`revalidatePath` で再描画)

## 3. モーダルとインタラクション

### ServiceModal (shadcn/ui `Dialog` 利用)

- shadcn/ui の `Dialog` / `DialogContent` / `DialogHeader` を使用。Esc・backdrop クリックで閉じる (標準挙動)
- 1 つのモーダルで「追加」「編集」両モードを兼ねる。`subscription` prop の有無で
  タイトル (サービスを追加 / サービスを編集) とフォーム動作を切り替え
- 状態は `ServiceGrid` (またはその親 client コンポーネント) が保持:
  `modalState: { mode: 'add' } | { mode: 'edit', sub: Subscription } | null`
- Server Action 成功後 `revalidatePath('/dashboard')` で一覧更新。
  モーダルを閉じる処理は `useActionState` または form の `onSubmit` でハンドリング

### 「···」メニュー (ServiceCard 内)

- shadcn/ui の `DropdownMenu` / `DropdownMenuContent` / `DropdownMenuItem` を使用
- カード右上「···」ボタンクリックで編集 / 削除メニューを表示
- カード本体クリックは無効
- 「編集」→ 親に編集モーダルを開かせる / 「削除」→ 確認の上 `removeSubscriptionAction`

### カテゴリ絞り込み (ServiceGrid 内)

- ピル型ボタン: すべて / AI / エンタメ / 仕事 / 音楽 / 買い物
- `useState<Category | 'all'>` でアクティブ状態を保持、クライアント側で `filter`
- 選択中ピルは黒背景・白文字、非選択は白背景・枠線 (カンプ準拠)

## 4. スタイリングとデータ集計

### カラー・トークン (Tailwind ユーティリティで表現)

- 背景: ベージュ系オフホワイト / カード: 白・角丸大 (`rounded-2xl`)・淡いシャドウ
- アクセント: 青紫 (今月の合計カードの塗り、追加ボタン)
- カテゴリバッジ色: AI=青紫 / エンタメ=赤 / 仕事=オレンジ / 音楽=紫 / 買い物=緑。
  `types.ts` に `CATEGORY_COLORS` マップを追加して一元管理
- サービスアイコン: 頭文字を淡色背景の角丸ボックスに表示 (実ロゴは持たない)

### レイアウト

- ヘッダー: 横並び。ロゴ左・ナビ中央・通知/アバター右。ナビはダミーリンク
- 上部サマリー: 3 カラムグリッド (モバイルは 1 カラム)
- サービスグリッド: 3 カラム (`md` 以上)、末尾に破線枠の「新しいサービス」追加カード
- 全体は `max-w` でセンタリング

### データ集計 (page.tsx 内、サーバー側)

```
monthlyTotal = Σ (billingCycle==='monthly' ? price : price/12)   // 切り捨て
yearlyTotal  = Σ (billingCycle==='yearly'  ? price : price*12)
count        = subs.length
aiCount      = subs.filter(s => s.category==='AI').length
```

- 「先月比」は履歴データなしのため静的ダミー文言、または非表示
- カード内「次回 6/2」は `nextBillingDate` を `M/D` 形式に整形

## 5. 既存ファイルへの影響

| ファイル | 変更内容 |
|---|---|
| `types.ts` | `CATEGORY_COLORS` 追加 |
| `SubscriptionForm.tsx` | インライン style → Tailwind + shadcn/ui (`Input`/`Select`/`Label`/`Button`) に置換、ServiceModal 内で使う前提に調整 |
| `dashboard/page.tsx` | 全面書き換え (集計 + 新コンポーネント呼び出し) |
| `actions.ts` / `subscriptions.ts` | 変更なし (既存 Server Action をそのまま利用) |

## 6. セットアップ手順

実装開始前に以下をinitを手動で実行すること。

```bash
pnpm dlx shadcn@latest init
```

Example:
```pnpm dlx shadcn@latest init --preset b2D1F0Ops --template next --pointer
```

- Style: **Default**
- Base color: 任意 (後でカスタマイズ)
- CSS variables: Yes

その後、使用するコンポーネントを個別追加:

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu button input select label card
```

## 7. 確定した設計判断

- カンプは見た目の参考。未実装要素はダミー静的表示
- shadcn/ui (Default テーマ) を導入。テーマカスタマイズは後回し
  - `Dialog`: ServiceModal
  - `DropdownMenu`: 「···」メニュー
  - `Input` / `Select` / `Label` / `Button`: SubscriptionForm フォーム部品
  - `Card`: SummaryCards およびサービスカード (必要に応じて)
- モーダル開閉はクライアント state で制御 (URL searchParams は使わない)
- 「···」クリックで編集/削除の小メニュー。カード本体クリックは無効
- 今月の合計は年払いも月額換算して合算
