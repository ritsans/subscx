# ダッシュボード実装計画 — 縦割り3周への再構成

> リッチ表示版: `docs/plans/2026-05-21-dashboard-impl-plan.html`(同内容)
> 設計: `docs/plans/2026-05-21-dashboard-ui-design.md`

機能を積み上げる横割りプランを、薄く一周させる縦割りプランへ組み替える。狙いはただ一つ — 「実装が終わらない」を構造的に起こさないこと。

- 日付: 2026-05-21
- 対象: dashboard / CRUD
- v1スコープ: サブスク CRUD
- テーマ: ライトのみ

---

## なぜ再構成するのか

### 挫折の正体 — 「実装が終わらない」

従来の17タスクプランは**横割り**だった。全部の型 → 全部の lib → 全部の component → 最後に画面、という順序。アプリが初めて動くのは Task 15、つまり最後。

結果、そこに着くまで14回ぶん「**型は通るが動くか不明**」が積み上がる。型が通ることとアプリが動くことは別物。動作確認が最後の1回しかなく、途中の達成感がゼロ。これが「永遠に未完成」を生む構造だった。

## 2つの原則

1. **縦に薄く一周させる** — 横割り(層ごと)をやめ、縦割り(機能の一筋)にする。各周の終わりに必ず `pnpm dev` で目視確認する。どこで力尽きても、動くアプリが手元に残る。
2. **勝利ラインを先に固定する** — 「CRUD全部が動く = 第2周完了 = v1完成」。これを最初に宣言しておく。ここを越えたら、残りは全て「動くアプリの装飾」であり、諦めても v1 は壊れない。終わりが自分で判定できる状態を作る。

---

## 第1周: 歩く骨格 (walking skeleton)

**ゴール:** `pnpm dev` を開いて「フォーム送信 → DB保存 → カードが1枚出る」を実際に目で見る。

**この周でやる:**
- `src/lib/schema.ts` — subscriptions テーブル + auth-schema 再エクスポート
- `src/lib/db.ts` — Drizzle + Turso シングルトン
- `drizzle.config.ts` — schema パス変更 → drizzle-kit push
- `src/lib/types.ts` — Subscription / Category / BillingCycle
- `src/lib/subscriptions.ts` — create と listAll の2関数だけ
- `src/app/actions.ts` — createSubscription のみ。zod なし、最低限の手書き検証
- `src/app/dashboard/page.tsx` — listAll → 素の ul 一覧。ページ直置きの素HTML form

**この周では入れない:** shadcn / Dialog / モーダル、Update / Delete、zod、simple-icons、サマリーカード、カテゴリフィルタ、ヘッダー、Frontend Design。

**チェックポイント:** ブラウザで実際に1件追加してカードが出るのを確認 → コミット → ここで一度休んでよい。この時点でデータが永続化されるサブスク管理アプリが既に存在する。

### TODO — 第1周

- [ ] 1.1 `src/lib/types.ts` を作成 — Subscription / Category / BillingCycle 型と CATEGORIES 定数
- [ ] 1.2 `src/lib/schema.ts` を作成 — subscriptions テーブル定義 + auth-schema 再エクスポート
- [ ] 1.3 `src/lib/db.ts` を作成 — Drizzle + Turso クライアントのシングルトン
- [ ] 1.4 `drizzle.config.ts` の schema パスを `schema.ts` に変更
- [ ] 1.5 `pnpm drizzle-kit push` で subscriptions テーブルを Turso に反映
- [ ] 1.6 `src/lib/subscriptions.ts` を作成 — create と listAll の2関数だけ。全クエリ user_id 必須
- [ ] 1.7 `src/app/actions.ts` を作成 — createSubscription のみ。zod なし、name 空チェック程度の手書き検証
- [ ] 1.8 `dashboard/page.tsx` を書き換え — listAll で取得し、素の `<ul>` 一覧 + ページ直置きの素HTML `<form>`
- [ ] 1.9 `pnpm tsc --noEmit` と `pnpm lint` が通ることを確認
- [ ] 1.10 目視確認 — `pnpm dev` で /dashboard を開き、1件追加 → カードが出るのを確認。OK ならコミット

---

## 第2周: CRUD完成 = 勝利ライン (victory line)

**ゴール:** 追加・編集・削除すべてが動く。ここを越えたら v1完成。README の「サブスク CRUD」が満たされる。

**やること:**
- `subscriptions.ts` に getOne / update / remove を追加。全関数 userId + id 両方を条件にし、他人のレコードを触れないようにする。
- `actions.ts` に updateSubscription / removeSubscription を追加。ここで zod を導入し、3アクションまとめて検証へ昇格(第1周の手書き検証から置き換え)。
- 編集UI — 第1周の素HTMLフォームを「追加 / 編集 共用フォーム」に拡張。subscription prop ありで編集モード、なしで追加モード。削除ボタンも編集モードに置く。
- まだ shadcn / Dialog は入れない。編集は「カードを押すと同じページにフォームが出る」程度の素の出し分けで十分。モーダル化は装飾なので第3周。

**チェックポイント:** ブラウザで 追加 → 編集 → 削除 を一通り実行して確認 → コミット。勝利ライン到達。以降どこで力尽きても v1 は完成済み。

### TODO — 第2周

- [ ] 2.1 `subscriptions.ts` に getOne / update / remove を追加。update と remove は id + user_id 両方を条件にする
- [ ] 2.2 zod をインストール(`pnpm add zod` をユーザーに提示)
- [ ] 2.3 `actions.ts` に updateSubscription / removeSubscription を追加し、3アクションを zod 検証に置き換え
- [ ] 2.4 フォームを「追加 / 編集 共用」に拡張 — subscription prop ありで編集モード、なしで追加モード
- [ ] 2.5 編集モードに削除ボタンを追加
- [ ] 2.6 カードクリックで編集フォームが出る出し分けを実装(モーダルなし、同ページに表示)
- [ ] 2.7 `pnpm tsc --noEmit` と `pnpm lint` が通ることを確認
- [ ] 2.8 目視確認 = 勝利ライン — 追加 → 編集 → 削除 を一通り実行。動いたらコミット。v1完成

---

## 第3周: 装飾 (polish — 諦めても v1 は壊れない)

**ゴール:** 動くアプリをよくする。各項目は独立。どれを諦めても v1 は壊れない。

1. shadcn 導入 + モーダル化 — dialog / button / input / label / select / textarea を追加し、フォームを Dialog の中へ。
2. サマリーカード — billing.ts(月額 / 年額換算の純粋関数)+ summary-cards.tsx。
3. カテゴリフィルタ — category-pill.tsx + 一覧のクライアント絞り込み。
4. ブランドアイコン — simple-icons + icon-map.ts + service-icon.tsx。未知の名前は頭文字バッジにフォールバック。
5. ヘッダー — app-header.tsx。
6. Frontend Design skill で仕上げ — 「量産型 AI-slop」の排除はこの最後だけ。

**チェックポイント:** 各項目を終えるたびにコミット。「終わらない」は起きない — 終わりは第2周で既に来ているから。

### TODO — 第3周(上から優先度順 / 各項目ごとにコミット)

- [ ] 3.1 shadcn/ui を初期化し、dialog / button / input / label / select / textarea を追加
- [ ] 3.2 共用フォームを shadcn Dialog の中へ移し、追加 / 編集をモーダル化
- [ ] 3.3 `src/lib/billing.ts` を作成 — 月額 / 年額換算の純粋関数
- [ ] 3.4 `summary-cards.tsx` を作成 — 月額合計 / 年額換算 / 登録件数の3枚
- [ ] 3.5 `category-pill.tsx` + 一覧のクライアント側カテゴリ絞り込みを実装
- [ ] 3.6 simple-icons をインストールし、`icon-map.ts` + `service-icon.tsx`(未知名は頭文字バッジ)
- [ ] 3.7 `app-header.tsx` を作成 — ロゴ / ナビ / アバター
- [ ] 3.8 仕上げ — Frontend Design skill で「量産型 AI-slop」を排除。最終目視確認 → コミット

---

## 前提・注意(全周共通)

- ライトテーマのみ実装。ダークテーマは不要。
- `process.env` を直接参照しない。サーバー専用の値は `src/lib/env.ts` の env 経由。
- 全 DB クエリで user_id を必須にする。
- 3ディレクトリ構造厳守 — src/app / src/components / src/lib。新ディレクトリは src/components/ui(shadcn 生成物)のみ承認済み。
- パッケージマネージャは pnpm。ライブラリ install はコマンドを提示し、人間が手動実行する。
- 各周末の目視確認は必須。型チェック通過は「動く」の代わりにならない。
