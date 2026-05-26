# v1 仕上げパック 設計書

**作成日:** 2026-05-26
**対象ブランチ:** feature/ui の後継 (機能追加・効率化フェイズ)
**ステータス:** Draft

## この設計書の目的

subscx の MVP (v1) はおおむね完成している。本ドキュメントは v1 を完全に閉じるための「仕上げ3点セット」を1つのスコープにまとめた設計書である。実装は本ドキュメント承認後に別途プランへ落とす。

junior エンジニアが単独で読んで実装イメージを掴めることを目指して書いている。前提知識として、Next.js 16 App Router・React 19・Server Components ベースであること、shadcn/ui が導入済みであることだけ抑えておけば読める。

## 含めるもの (スコープ)

本リリースに含めるのは次の3機能である。

1. **A: 7日以内 警告バッジ** — カードの右上に「あと◯日」「今日」を赤い丸バッジで表示
2. **B: 次回請求日の遅延評価** — DB の `nextBillingDate` を「初回 (アンカー) 請求日」と再定義し、表示時に毎回「次の請求日」を算出する
3. **F: 主要サービスのアイコン化** — Netflix / Amazon など世界的に有名なサービスのみ simple-icons のロゴで表示。未登録は従来どおり頭文字バッジ

## 含めないもの (Out of Scope)

明示的に今回はやらないことを書いておく。実装時に迷ったら戻ってくる。

- 7日以内警告の「集約バナー」(上部にまとめて出すUI) は採用しない。バッジのみ
- 過去日のバッジ表示・色分け (オレンジ等の2段階) は採用しない。赤1色のみ
- ユーザーがアイコンを手動で選ぶ UI は作らない。マップに無い名前は頭文字
- 次回請求日の自動 DB 更新 (lazy write / cron) は採用しない。読み取り時計算のみ
- グラフ・CSV・通知・PWA は v2 箱なので触らない

---

## 機能 A: 7日以内 警告バッジ

### 何をするか

ダッシュボードのサービスカードを見たとき、近々課金されるサービスがひと目で分かるようにする。具体的には、カード右上に**赤い丸バッジ**で残日数を表示する。

### 表示ルール

「次回請求日」と「今日」の日数差 (`diff`) に応じて表示を切り替える。`diff` は機能 B で定義する純粋関数から得る。

| diff (日) | 表示テキスト | バッジ表示 |
|----------|------------|-----------|
| 0        | `今日`     | する      |
| 1〜7     | `あと◯日` | する      |
| 8以上    | -          | しない    |

機能 B により `diff` が負になることは原理上ありえない (今日以降の日付を常に返すため)。実装側で防御コードを書く必要はない。

### 見た目

- 形状: 丸型 (`rounded-full`)
- 配色: 赤背景 + 白文字 (`bg-red-500 text-white` 等を想定。最終的なクラスは実装時に微調整可)
- 字: 強調 (`font-bold`)、サイズは小さめ (text-xs 相当)
- 位置: カード右上。既存の `...` ドロップダウンメニュー (hover 時のみ表示) と物理的に重ならないこと

メニューは hover で出現するため、バッジは常時表示されていてよい。両者の位置が重なる場合は、バッジを少し左にずらすか、メニュー側のアイコン位置を見直す。デザインの最終調整は実装時に判断する。

### 責務

バッジコンポーネントは **表示判定のみ** を行う。DB への書き込みは絶対に発生させない。

---

## 機能 B: 次回請求日の遅延評価

### 背景: 何が問題か

現在 `subscriptions.nextBillingDate` は「次回の課金日」として保存されている。しかしこのままでは、登録後に時間が経つと**過去の日付が一覧に並ぶ**ことになる。例えば 2026-01-15 を登録してから半年経つと、いまだに「次回 1/15」と表示されてしまう。

この問題は「課金サイクル毎に DB の値を進める」ことで解決できるが、cron もバッチも持っていない自分用アプリでこれをやると複雑性が見合わない。

### 採用する方針: 遅延評価 (B1)

DB の `nextBillingDate` の**意味を再定義**する。

- 旧解釈: 「次回の課金日」
- **新解釈: 「アンカー (基準) 日」=「課金日として登録された任意の1日」**

表示や集計で「次回の課金日」が必要になったら、その都度アンカー日と課金サイクル (`monthly` / `yearly`) から算出する。DB は触らない。

### 純粋関数を `src/lib/billing.ts` に集約する

新規ファイル `src/lib/billing.ts` を作り、次の関数を置く。すべて副作用なしの純粋関数とする (DB アクセス・現在時刻取得を関数内でしない。`today` は引数で受け取る)。

```ts
// アンカー日と課金サイクルから、今日以降の最も近い課金日を返す
nextBillingFrom(anchor: string, cycle: BillingCycle, today: Date): Date

// 今日から次回課金日までの日数 (整数、最小 0)
daysUntilNextBilling(anchor: string, cycle: BillingCycle, today: Date): number

// 月額換算 (yearly なら price/12 切り捨て、monthly はそのまま)
toMonthly(price: number, cycle: BillingCycle): number

// 年額換算 (monthly なら price*12、yearly はそのまま)
toYearly(price: number, cycle: BillingCycle): number
```

`toMonthly` / `toYearly` は現在 `dashboard/page.tsx` と `ServiceCard.tsx` に重複ロジックが散らばっているので、ここに集約する (今回の機能のついで作業)。

### `nextBillingFrom` の挙動 (重要)

ロジックは次のとおり。

1. `anchor` (YYYY-MM-DD 文字列) を Date に変換
2. cycle に応じて、anchor から「今日」を含む or 今日より後になるまで `+1ヶ月` または `+1年` をループで足す
3. 得られた日付を返す

エッジケース:

- **monthly + 月末日問題**: アンカーが 1/31 で、次が 2 月の場合、JavaScript の `setMonth` は 3/3 等にずれる。**仕様としては「その月の末日に丸める」**ものとする (例: 1/31 → 2/28 or 2/29 → 3/31)。実装では `Date` の月加算後に月が想定とずれていないか確認し、ずれていたらその月の末日に補正する。
- **yearly + うるう日**: アンカーが 2/29 のとき、平年は 2/28 に丸める。
- **アンカーが今日と一致**: その日を返す (`diff = 0` で「今日」バッジが出る)。
- **アンカーが未来**: ループは0回で終了し、アンカーをそのまま返す。

### どこで使うか

- `dashboard/page.tsx`: 月額合計・年額合計の算出に `toMonthly` / `toYearly` を使う (既存ロジックを置換)
- `dashboard/page.tsx`: 一覧の並びを「次回課金日が近い順」にするとき、`nextBillingFrom` を呼んで `today` 基準でソートする。**DB のクエリ側ではソートしない** (DB の値はアンカー日であり、ソート対象でなくなったため)
- `ServiceCard.tsx`: `formatDate(nextBillingFrom(anchor, cycle, today))` で「次回 M/D」を表示
- `ServiceCard.tsx` (経由 or 内部): `daysUntilNextBilling` でバッジ表示判定

### `today` をどう渡すか

サーバーで `new Date()` を1回だけ取って、`page.tsx` から下位コンポーネントに props で配る。理由は次の2つ。

1. **テストしやすい**: `today` が引数なら billing.ts の関数は完全に純粋になり、ユニットテストで任意の日付を渡せる
2. **表示の一貫性**: 同じレンダリングサイクル内で `today` がブレないことを保証できる

ただし `ServiceCard` は `'use client'` なので、Date をそのまま props で渡せない (シリアライズの問題は無いが、クライアント側でも同じ判定が走るのが望ましい)。**Date は ISO 文字列 (YYYY-MM-DD) として渡す**ことを推奨する。Client 側で必要なら再度 Date に変換する。

### DB スキーマへの影響

スキーマ変更は**しない**。`nextBillingDate` というカラム名のまま、意味だけ再定義する。

理由: マイグレーションコストを避けるため、および UI 上で「次回請求日」を入力する操作感は変わらないため。フォームのラベルは「次回請求日 (またはこれまでの請求日のいずれか)」のような注釈を入れるかどうかは UX の議論として後回し。本リリースではラベル変更しない。

代わりに、`schema.ts` または `types.ts` のコメントで**「アンカー日として解釈する」**旨を明記し、後から触るエンジニアが混乱しないようにする。

---

## 機能 F: 主要サービスのアイコン化

### 何をするか

カード左の「頭文字バッジ」(現状すべてのカードがこれ) を、有名サービスに限って **simple-icons のロゴ SVG** に差し替える。未登録のサービスはこれまで通り頭文字を出す。

### 採用ライブラリ

- `simple-icons` (npm) を新規導入する
- インストールは自分では行わず、ユーザーに `pnpm add simple-icons` を提示する

### 仕組み

新規に2ファイル作る。

**`src/lib/icon-map.ts`** — サービス名 (正規化済み) から simple-icons の slug への手動マップ。最初は世界的に使われるサービスのみ。例:

```ts
export const ICON_MAP: Record<string, string> = {
  netflix: 'netflix',
  amazon: 'amazon',
  'amazon prime': 'amazonprime',
  spotify: 'spotify',
  youtube: 'youtube',
  'youtube premium': 'youtube',
  // ... 他、ユーザー命名のゆれを意識して登録
};
```

キーは**小文字化 + 前後空白除去**した文字列とする。ルックアップ時も同じ正規化をかける。

**`src/components/dashboard/ServiceIcon.tsx`** (新規 or `ServiceCard.tsx` 内のサブコンポーネント) — 名前を受け取り、

1. 正規化して `ICON_MAP` を引く
2. ヒットしたら simple-icons から該当 slug の SVG path を取り出し、`<svg>` で描画。背景は白に近い淡色、アイコンは元のブランドカラー or 黒
3. ヒットしなければ、現状の「頭文字 + カテゴリ色」バッジを描画

simple-icons は各アイコンを `import { siNetflix } from 'simple-icons/icons'` のように個別 import できる。バンドルサイズを抑えるため、**マップに登録した分だけ静的 import** する。動的 import は SSR/RSC との相性で罠が出やすいので避ける。

### 登録対象 (初期候補)

最初の登録は次のあたりを想定。実装時にユーザーが実際に登録しているサービスを見て調整する。

- Netflix, Amazon (Prime), Spotify, YouTube (Premium), Apple Music, Disney+, Hulu, ChatGPT (OpenAI), Claude (Anthropic), Notion, Figma, GitHub, Adobe (Creative Cloud), Microsoft 365, Dropbox

### 命名ゆれ対策

ユーザーは「Netflix」「netflix」「ネットフリックス」など揺れて入力しうる。今回は**英語表記の小文字一致のみ**サポートする。カタカナ表記までカバーしようとするとマップが爆発するので、ヒットしなかった場合は素直に頭文字バッジに落とす。

---

## 影響範囲まとめ

新規ファイル:

- `src/lib/billing.ts` — 純粋関数群
- `src/lib/icon-map.ts` — サービス名 → slug マップ
- `src/components/dashboard/ServiceIcon.tsx` (もしくは ServiceCard 内の小コンポーネント)

変更ファイル:

- `src/app/dashboard/page.tsx` — billing.ts を使うように合計計算を差し替え。並び替えをサーバー側で `nextBillingFrom` ベースに変更
- `src/lib/subscriptions.ts` — `listAll` の `orderBy(nextBillingDate)` を外す (アンカー日のソートは意味を持たなくなるため)。`getOne` 等はそのまま
- `src/components/dashboard/ServiceCard.tsx` — 次回日表示・月額換算を billing.ts 経由に。アイコン部分を `ServiceIcon` 化。バッジ追加
- `src/lib/types.ts` — `Subscription.nextBillingDate` のコメントを「アンカー日」と明示
- `package.json` — `simple-icons` 追加 (ユーザーが pnpm add 実行)

DB スキーマ: **変更なし**。
マイグレーション: **不要**。

## テスト方針

`billing.ts` の純粋関数群はユニットテストで担保したい。最低限カバーしたいケース:

- `nextBillingFrom`
  - monthly: アンカー過去 → 今日以降に進む / アンカー今日 → 今日を返す / アンカー未来 → アンカーを返す
  - monthly: 1/31 → 2 月で月末丸め (平年/うるう年)
  - yearly: 2/29 アンカー → 平年は 2/28
- `daysUntilNextBilling`: 0 / 1 / 7 / 8 の境界
- `toMonthly` / `toYearly`: monthly / yearly 双方

テスト基盤はまだ無いので、導入するかは実装プラン段階で判断する。導入コストが高ければ、最低限の境界だけ手動目視で確認する選択肢もある。

UI 側 (バッジ / アイコン) は目視確認で十分。

## 受け入れ基準 (Definition of Done)

実装完了とみなす条件:

1. 7日以内のカードに赤い丸バッジが出る。0日は「今日」、1〜7日は「あと◯日」、8日以上は出ない
2. 過去にアンカー日を持つサブスクを登録しても、ダッシュボードの「次回 M/D」は常に今日以降の日付になる
3. SummaryCards の月額合計・年額換算が `billing.ts` 経由で計算されている (重複ロジックの消滅)
4. 一覧が「次回課金日が近い順」に並んでいる (アンカー日ベースではなく、計算済みの次回日ベース)
5. Netflix / Spotify / Amazon 等、マップに登録したサービスは simple-icons のロゴで表示される
6. マップに無いサービスはこれまで通り頭文字バッジで表示される
7. `pnpm tsc --noEmit` と `pnpm lint` が通る
8. ダークモード関連コード (`dark:` / `.dark` / `prefers-color-scheme` 等) を追加していない

## オープンクエスチョン

実装プラン段階で詰めるべき小さな未決事項:

- ユニットテストの導入是非 (vitest など)
- `today` を Date で渡すか YYYY-MM-DD 文字列で渡すかの最終決定
- バッジとドロップダウンメニューの位置調整の具体方針 (デザイン微調整)
