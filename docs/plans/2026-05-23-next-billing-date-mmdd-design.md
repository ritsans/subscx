# 次回請求日を「日付のみ (MM-DD)」で保存する

## Context

現状、`subscriptions.next_billing_date` は ISO 形式 (`YYYY-MM-DD`) の絶対日付として保存されている。これは「次回の請求日が来たら、ユーザーが手で次の月の日付に書き換えないと一覧が陳腐化する」運用上の負債を抱えている。

申し込み日が 6/26 のサブスクリプションは、来月以降も毎月 26 日に請求が来る、という業務実態に合わせて、保存値を「請求の繰り返しパターン」に変更する。具体的には `MM-DD` 形式 (例: `06-26`) のみを保存し、実際に画面へ表示・ソートする「次回請求日」は今日を基準にサーバ側で算出する。

これにより:
- ユーザーは一度入力すれば自動で「次の請求日」が常に未来日として表示される
- 月次サブスクは「日 (MM 部分は表示時に無視)」、年次サブスクは「月+日」を同じカラムで扱える

## 方針サマリ

- 保存形式: 月次・年次とも `MM-DD` (TEXT, NOT NULL) で統一
- ソート/表示用の「実次回請求日」は読み出し側で算出
- 月の末尾を超える日 (例: 1/31 指定で 2 月) は **その月の末日に丸める**
- 入力 UI は `<input type="date">` をやめて **月 (1-12) と 日 (1-31) の数値 Select** にする
- 年次は月 + 日、月次は日のみ入力させ、Server Action で `MM-DD` に正規化

---

## 変更ファイル

### 1. スキーマ

`src/lib/schema.ts`

- `nextBillingDate: text('next_billing_date').notNull()` のコメントを「`MM-DD` 形式」に更新。
- カラム名・型は変更しない (既存データは後述のマイグレーションで変換)。

マイグレーション運用 (現状 `drizzle/` ディレクトリ未作成):

- `pnpm drizzle-kit generate` を走らせる必要は **ない** (型は変えない)。
- ただし既存行の値変換が必要なので、`drizzle/0001_normalize_next_billing_date.sql` を手動作成して `UPDATE subscriptions SET next_billing_date = substr(next_billing_date, 6) WHERE length(next_billing_date) = 10` のような SQL で `YYYY-MM-DD` → `MM-DD` に縮める。ユーザーに `pnpm drizzle-kit push` (またはコンソール経由) で適用してもらう。

### 2. 日付ユーティリティ (新規)

`src/lib/billing-date.ts` を新設し、依存ライブラリなしで以下を提供:

- `BILLING_DATE_REGEX = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`
- `parseBillingDate(value: string): { month: number; day: number }`
- `computeNextBillingDate(billingDate: string, cycle: BillingCycle, today = new Date()): Date`
  - `cycle === 'monthly'`: 今月の `day` (末日丸め) が今日以前なら翌月、未来なら今月。
  - `cycle === 'yearly'`: 今年の `month`/`day` (末日丸め) が今日以前なら翌年、未来なら今年。
  - 末日丸め: `new Date(year, month, 0).getDate()` で当該月の末日を求め、指定日 > 末日なら末日に置換。
- `formatBillingDateShort(d: Date): string` で `M/D` 表示。
- いずれも JST 想定だが、`new Date()` をローカルタイムで扱う (既存 `formatDate` と同じ前提)。

タイムゾーン補足: Next.js の Server Component で `new Date()` を使うとサーバのローカルタイムになる。本プロジェクトは個人向け国内サービスのため JST 固定で問題なし。後で TZ 対応が必要になったら `Intl.DateTimeFormat` に切り替える。

### 3. 型

`src/lib/types.ts`

- `Subscription.nextBillingDate: string` のコメントに「`MM-DD` 形式 (繰り返しパターン)」を追記。
- 別途 `nextBillingDateActual?: Date` のような計算済みフィールドは型に **追加しない** (画面側でその都度計算する)。

### 4. Server Action / 入力バリデーション

`src/app/actions.ts`

- `subscriptionSchema` の `nextBillingDate` フィールドを以下に置換:
  ```ts
  billingMonth: z.coerce.number().int().min(1).max(12).optional(),
  billingDay: z.coerce.number().int().min(1).max(31),
  ```
  そのあと `.transform((v) => ({ ...v, nextBillingDate: toMMDD(v) }))` で `MM-DD` に正規化する (`monthly` の場合は `01-DD` のような暫定値ではなく、入力された任意月。月次でも MM を必ず保存するため、フォームから常に month を送る方針)。
- `billingCycle` が `'monthly'` のときも `billingMonth` を必須で送らせる: 入力 UI は月次でも「月」セレクトを残し、初期値は今月にする。これで「保存形式統一」が崩れない。
- `refine` で「丸め後の妥当性」は不要 (常に丸めるので)。`day` が 29-31 でも保存はそのまま許容し、表示時に丸める。
- `actions.ts` 内のフィールド受け渡しを `nextBillingDate` 文字列ベースに直す。

### 5. データ層

`src/lib/subscriptions.ts`

- `createSubscription` / `updateSubscription` の引数の `nextBillingDate` はそのまま (`MM-DD` 文字列) を受け取り、DB へ書く。
- `listAll` の `orderBy(asc(subscriptions.nextBillingDate))` は **削除**。DB レベルでは順序を保証しないので、呼び出し側 (`dashboard/page.tsx`) で「実次回請求日」を `computeNextBillingDate` で計算し、JS でソートする。
- 件数は最大でも数十件想定なので、メモリソートで問題なし。

### 6. UI 入力

`src/components/SubscriptionForm.tsx` および `src/components/dashboard/ServiceModal.tsx`

- `<input type="date" name="nextBillingDate">` を以下に置換:
  - shadcn の `Select` (既存 `billingCycle` セレクトと同じ作りに合わせる) で:
    - `name="billingMonth"`: 1〜12 の option
    - `name="billingDay"`: 1〜31 の option
- 編集時の初期値は `sub.nextBillingDate` を `parseBillingDate` で分解してセット。
- ラベルは「次回請求日」のまま。補助テキストで「指定した日が存在しない月は末日になります」を小さく出す。
- `billingCycle` セレクトとの並びは「月/日」→「サイクル」の順で従来踏襲。
- なお `SubscriptionForm.tsx` (旧フォーム) と `ServiceModal.tsx` の双方で同じ Select を作るのは冗長なので、`src/components/dashboard/BillingDateFields.tsx` として共通 Client Component を切り出す。

### 7. UI 表示

`src/components/dashboard/ServiceCard.tsx`

- 既存 `formatDate(dateStr)` は削除し、`billing-date.ts` の `formatBillingDateShort` を使う。
- カード内で `computeNextBillingDate(sub.nextBillingDate, sub.billingCycle)` を呼ぶ。Server Component (page) で算出済み Date を渡すように props を拡張するのが綺麗:
  - `ServiceCard` の props に `nextBillingActual: Date` を追加し、表示はこちらを使う。
  - `sub.nextBillingDate` (生の `MM-DD`) は編集モーダル初期値用に残す。

### 8. 一覧/ダッシュボード

`src/app/dashboard/page.tsx`

- `listAll(...)` の結果を `subs.map((s) => ({ sub: s, next: computeNextBillingDate(s.nextBillingDate, s.billingCycle) }))` に変換し、`next` 昇順でソートしてから `ServiceCard` に渡す。
- 既存の「月額換算合計」計算ロジック (line 12-18 付近) はそのまま。

### 9. ドキュメント

- `docs/spec.md` line 44 のコメント (`ISO date string (YYYY-MM-DD)`) を `MM-DD (繰り返しパターン、実次回日は算出)` に更新。
- 旧 `docs/plans/2026-05-21-dashboard-ui-design.md` / `2026-05-22-dashboard-ui-design.md` は履歴扱いなので変更不要。
- `README.md` の「現状」「次やること」「やったこと」を更新 (今回作業終了後に追記)。

---

## 既存資産の再利用

- `formatDate` ロジック (`ServiceCard.tsx:18-21`) の `M/D` 表示は新 `formatBillingDateShort` の中身としてほぼそのまま流用可能。
- shadcn の `Select` は `ServiceModal.tsx` で既に `billingCycle` 選択に使われている。同じ pattern で月/日 Select を作る。
- Zod の `z.coerce.number()` は `category`/`price` で既に使用 (`actions.ts`)。同パターンで OK。

---

## 検証手順

1. `pnpm lint` と `pnpm tsc --noEmit` を通す。
2. 移行 SQL を Turso に適用してから `pnpm dev`。
3. ダッシュボードを開き、既存サブスクの「次回」表示が **今日以降の日付** になっていることを確認。
4. 新規追加 (月 6 / 日 26、月次) → 「次回」が次に来る 26 日になることを確認。日付を 1/31 にして月次保存 → 2 月時点では 2/28 (うるう年なら 2/29) と表示されるか確認。
5. 編集モーダルを開き、初期値の月/日 Select が正しく復元されることを確認。
6. ソート順: 複数サブスクで「次回が近い順」に並ぶことを確認。
7. 年次サブスクで、今年分が過ぎていれば来年の日付が「次回」になることを確認。
