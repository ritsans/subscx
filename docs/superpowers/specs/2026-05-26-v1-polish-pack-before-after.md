# v1 仕上げパック Before / After 解説

**作成日:** 2026-05-26
**関連設計書:** [2026-05-26-v1-polish-pack-design.md](./2026-05-26-v1-polish-pack-design.md)
**対象読者:** これから実装に入るエンジニア / 既存実装を把握したいレビュアー

## このドキュメントの目的

v1 仕上げパック (警告バッジ / 次回請求日の遅延評価 / 主要サービスのアイコン化) によって、コードベースが**どう変わるか**を Before / After で並べて示す。設計書 (上記リンク) が「何を作るか」を語るのに対し、このドキュメントは「現状から見て何が動くか」に焦点を当てる。

差分の表現は次のルールで統一する。

- `[Before]` … 現在のコード / 挙動
- `[After]`  … 仕上げパック完了後のコード / 挙動
- `diff:`   … 何が変わったか、なぜそうしたかの一言要約

---

## 1. DB スキーマ

```
[Before]
  subscriptions テーブル
    - nextBillingDate: text (YYYY-MM-DD)  ※意味: 「次回の請求日」

[After]
  subscriptions テーブル
    - nextBillingDate: text (YYYY-MM-DD)  ※意味: 「アンカー日 (これまでの請求日のいずれか)」
```

`diff:` **スキーマ自体は変わらない**。カラム名・型・index も同じ。変わるのは「値の意味」だけ。マイグレーションは不要。

副作用として、後から触るエンジニアが意味を取り違えないよう、`schema.ts` と `types.ts` の該当箇所にコメントを追加する。

---

## 2. 「次回 M/D」の表示

### 表示ロジック

```
[Before]
  ServiceCard が DB の nextBillingDate をそのまま受け取り、
  formatDate() で "M/D" に整形して描画。

[After]
  Server Component (dashboard/page.tsx) が今日基準で
    next = nextBillingFrom(anchor, cycle, today)
  を算出し、その値を子コンポーネントに渡す。
  ServiceCard はそれを formatDate() で描画する。
```

`diff:` **計算が増える**。DB 値を素通しから、純粋関数 `nextBillingFrom` を 1 段挟むようになる。

### ユーザー体験 (Netflix を 2026-01-15 に登録、monthly の例)

| 今日       | [Before] の表示 | [After] の表示 |
|-----------|----------------|----------------|
| 2026-01-10 | 次回 1/15      | 次回 1/15      |
| 2026-01-15 | 次回 1/15      | 次回 1/15 (= 今日) |
| 2026-01-20 | 次回 1/15 ⚠️過去日 | 次回 2/15     |
| 2026-07-01 | 次回 1/15 ⚠️過去日 | 次回 7/15     |

`diff:` **過去日が一覧に滞留しなくなる**。これが今回の最大の体験改善。

---

## 3. デフォルト並び順

```
[Before]
  subscriptions.ts の listAll() が
    .orderBy(asc(subscriptions.nextBillingDate))
  を付けて DB から返す。

  → DB の nextBillingDate (= 「次回」と称しつつ実態はアンカー日)
     を辞書順 (≒ 日付昇順) で並べる。
  → 時間が経つにつれ過去日が上に滞留し、
     「過去ほど上、未来ほど下」のリストになる (実質バグ)。

[After]
  listAll() からは ORDER BY を外す。
  Server Component 側で
    sorted = [...subs].sort(
      (a, b) => nextBillingFrom(a, today) - nextBillingFrom(b, today)
    )
  のように、計算後の「次回請求日」昇順で並べる。
```

`diff:` **並び順の意図は変わらない** (= 「次回課金日が近い順」)。実装位置だけ DB → アプリ側 (Server Component) に移る。これによって README の v1 スコープに書かれた本来の挙動「次回請求日が近い順に並ぶ一覧」が、時間経過後も正しく維持される。

なぜ DB 側でやらないか: 今や DB の値はアンカー日であり、それを ORDER BY しても無意味だから。「次回請求日」は計算結果なので、計算した側で並べる方が自然。

---

## 4. 月額 / 年額の換算

### 計算ロジック

```
[Before]
  dashboard/page.tsx 内に直書き:
    const monthly = subs.reduce((acc, s) =>
      acc + (s.billingCycle === 'monthly' ? s.price : s.price / 12), 0
    );
  ServiceCard.tsx 内にも同様の式:
    const monthly = sub.billingCycle === 'monthly'
      ? sub.price
      : Math.floor(sub.price / 12);

[After]
  src/lib/billing.ts に集約:
    toMonthly(price, cycle)
    toYearly(price, cycle)
  page.tsx も ServiceCard も上記を呼ぶだけになる。
```

`diff:` **計算式そのものは変わらない**。重複ロジックが billing.ts に集まる。ユニットテスト可能な純粋関数になる。

### 計算結果

| サブスク         | [Before] 月額 | [After] 月額 | [Before] 年額 | [After] 年額 |
|----------------|--------------|--------------|--------------|--------------|
| Netflix ¥1,490 / 月  | 1,490 | 1,490 | 17,880 | 17,880 |
| Amazon Prime ¥5,900 / 年 | 491 (= 5900/12 切り捨て) | 491 | 5,900 | 5,900 |

`diff:` 数字は完全に同じ。

---

## 5. 警告バッジ

```
[Before]
  バッジ機能なし。
  カードは "次回 M/D" の文字だけで近さを知らせる。

[After]
  ServiceCard 右上に丸型バッジ。
  daysUntilNextBilling(anchor, cycle, today) で残日数を出し、
    0     → "今日"
    1..7  → "あと◯日"
    8 以上 → 非表示
  色は赤背景 + 白文字 + 太字。
```

`diff:` **新規追加**。カードの右上 (現状の `...` メニューと共存) に「いま近いやつ」を視覚で即把握できる装置が増える。

過去日のケースを考慮する必要はない。`nextBillingFrom` の挙動により、`daysUntilNextBilling` の戻り値は常に 0 以上になるため。

---

## 6. サービスアイコン

```
[Before]
  すべてのカードで「頭文字 + カテゴリ色」バッジ。
  例: Netflix → 紫地に "N"

[After]
  名前を正規化 (lowercase + trim) して icon-map.ts を引く。
  ヒット → simple-icons のロゴ SVG を描画 (ブランドカラー優先)
  ミス  → 従来どおり頭文字バッジ

  マップ初期登録 (案):
    Netflix, Amazon (Prime), Spotify, YouTube (Premium),
    Apple Music, Disney+, Hulu, ChatGPT (OpenAI),
    Claude (Anthropic), Notion, Figma, GitHub,
    Adobe (Creative Cloud), Microsoft 365, Dropbox
```

`diff:` **有名サービスはロゴ、それ以外は頭文字** の二段構え。全サービスを網羅しない方針 (= 命名揺れ・誤ヒットを避ける)。simple-icons は新規依存追加 (`pnpm add simple-icons` をユーザーに提示)。

---

## 7. ファイル変更マップ

| パス | [Before] | [After] | diff |
|---|---|---|---|
| `src/lib/subscriptions.ts` | listAll に ORDER BY あり | ORDER BY 削除 | 1 行削除相当 |
| `src/lib/billing.ts`        | 存在しない | 新規 (純粋関数 4 本) | 新規 |
| `src/lib/icon-map.ts`       | 存在しない | 新規 (名前 → slug マップ) | 新規 |
| `src/lib/types.ts`          | nextBillingDate コメントなし | 「アンカー日」と明記 | コメント追加 |
| `src/lib/schema.ts`         | 同上 | 同上 | コメント追加 |
| `src/app/dashboard/page.tsx` | 合計を直書き / 並び順は DB 任せ | billing.ts 使用 / 並び替えをここで実施 | ロジック移植 |
| `src/components/dashboard/ServiceCard.tsx` | 頭文字バッジ固定 / 月額直書き / バッジなし | ServiceIcon 経由 / billing.ts 経由 / 警告バッジ追加 | 中規模改修 |
| `src/components/dashboard/ServiceIcon.tsx` | 存在しない | 新規 (or ServiceCard 内サブコンポーネント) | 新規 |
| `src/components/dashboard/SummaryCards.tsx` | props で受け取った数字を表示 | 変更なし | 触らない |
| `package.json`              | simple-icons なし | simple-icons 追加 | 依存追加 (ユーザー実施) |
| `drizzle/` マイグレーション | 既存のみ | 既存のみ | 追加なし |

---

## 8. 「変わらないこと」リスト

実装に入る前に、**変わらない**ことも明示しておく。レビューの時に「ここも変えるべきでは?」と混乱しないため。

- DB スキーマ (カラム名・型・index)
- マイグレーションファイル
- `nextBillingDate` という名前
- 月額・年額の計算式
- ダークモード非対応の方針
- CRUD のフロー (フォーム送信 → Server Action → revalidatePath)
- 認証・認可 (Better Auth + WHERE user_id = ?)
- カテゴリの種類・色
- SummaryCards の UI

---

## 9. 用語まとめ

このドキュメントと設計書で出てくる用語の定義。

| 用語 | 意味 |
|------|------|
| **アンカー日** | DB の `nextBillingDate` に保存される値。「これまでの請求日のうち任意の 1 日」と解釈する。 |
| **次回請求日 (= 計算結果)** | アンカー日 + 課金サイクルから `nextBillingFrom` で算出した、今日以降で最も近い請求日。UI に表示するのはこちら。 |
| **遅延評価 / Lazy 評価** | DB の値は変えず、表示のたびに計算する方式。今回の B 機能のキモ。 |
| **頭文字バッジ** | サービス名の先頭 1 文字を、カテゴリ色の四角に乗せた既存のアイコン代替。 |
| **ロゴアイコン** | simple-icons から取得した SVG ベースのブランドロゴ。 |
