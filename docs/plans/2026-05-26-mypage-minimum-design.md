# マイページ最低限機能 設計書

作成日: 2026-05-26
ブランチ想定: feature/ui (もしくは派生ブランチ)

## 背景

`/mypage` は現在、認証ガードと「準備中」プレースホルダーのみで実体が無い。
ユーザーが自分のアカウント情報を確認し、ログアウト導線にアクセスできる最低限の場として整備する。
あわせて、ヘッダーのアバターを起点にした DropdownMenu を導入し、マイページ遷移とログアウトを集約する。

## ゴール / 非ゴール

### ゴール
- `/mypage` でアカウント情報 (名前・メール・登録日) を読み取り表示
- `/mypage` でサブスクの最小サマリー (件数・月額合計) を表示
- ヘッダーのアバタークリックで DropdownMenu を表示し、マイページ遷移とログアウトを行えるようにする

### 非ゴール (今回触らない)
- プロフィール編集 (name 変更、メール変更)
- パスワード変更
- アバター画像アップロード
- 通貨/通知/言語などのアプリ設定
- 年額換算、グラフ、カテゴリ別内訳
- 退会 (アカウント削除)

## スコープと変更ファイル

### 新規
- `src/components/layout/UserMenu.tsx` (Client Component)
  - shadcn `DropdownMenu` を用いた Avatar + メニュー
  - ログアウト処理を内包

### 変更
- `src/app/mypage/page.tsx` — 全面書き換え (Server Component)
- `src/components/layout/Header.tsx` — props 拡張 (`userEmail` 追加)、Avatar 部分を `UserMenu` に差し替え
- `src/app/dashboard/page.tsx` (および Header を呼び出している他箇所) — `userEmail` を渡すよう更新
- `src/lib/subscriptions.ts` もしくは集計ヘルパー — 月額合計の計算を共通関数化 (Dashboard と重複しないように)

### 削除 (用途消失時のみ)
- `src/components/sign-out-button.tsx` — 他参照がなければ削除

## データフロー

### `/mypage`
1. `getSession()` でユーザー取得。未ログインなら `redirect('/login')`
2. `getAll(userId)` でサブスク一覧を取得
3. サーバー側で件数と月額合計を計算
4. `Card` ベースの UI に値を流し込む

### Header / UserMenu
- Header は Server Component のまま `{ userName, userEmail }` を受け取り、`UserMenu` に渡す
- `UserMenu` は Client Component。`authClient.signOut()` → `router.push('/')` → `router.refresh()` を実行

## UI 構成

### `/mypage` レイアウト
```
<main className="mx-auto max-w-3xl px-6 py-12">
  <h1> マイページ
  <Card> アカウント
    お名前 / session.user.name
    メールアドレス / session.user.email
    登録日 / session.user.createdAt (YYYY/MM/DD)
  <Card> サブスク
    登録件数 / N 件
    月額合計 / ¥X
  <Link href="/dashboard"> ← ダッシュボードへ戻る
</main>
```

- Tailwind ライトテーマ固定 (`dark:` クラスや next-themes は使わない)
- shadcn `Card` を流用し、Dashboard のサマリーカードと意匠を揃える
- 編集 UI は出さない (Input / Button / Form なし)

### `UserMenu` 構成
```
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button aria-label="アカウントメニュー"
            className="h-8 w-8 rounded-full bg-violet-600 text-white text-xs font-semibold">
      {initials}
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>
      <div className="font-medium">{userName}</div>
      <div className="text-xs text-stone-500">{userEmail}</div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/mypage">マイページ</Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleSignOut}>ログアウト</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- アバターは `<div>` から `<button type="button">` に昇格しキーボード操作可能に
- 既存の通知ベルは現状維持

## エラーハンドリング

- `/mypage` の未ログイン: `redirect('/login')` (現状踏襲)
- サブスク取得失敗: 件数 0 件 / 月額 ¥0 を表示 (Dashboard と同じ素直な扱い)
- ログアウト失敗: 特別な処理は入れず、標準のエラー境界に任せる

## セキュリティ

- `getSession()` を通じてユーザー単位にデータ分離
- `getAll(userId)` でユーザー所有のサブスクのみを集計
- クライアントには `session.user` の必要最小フィールド (name / email) のみを渡す

## テスト / 検証

手動テスト手順:
1. ログイン状態でダッシュボードを開く
2. ヘッダー右上のアバターをクリック → Dropdown が表示されること
3. ユーザー名・メールが表示されていること
4. 「マイページ」をクリック → `/mypage` 遷移、アカウント情報とサブスク件数/月額合計が表示されること
5. マイページの「ダッシュボードへ戻る」リンクで `/dashboard` に戻れること
6. Dropdown から「ログアウト」を選択 → `/` に遷移し、再度 `/dashboard` にアクセスすると `/login` にリダイレクトされること
7. キーボード操作 (Tab + Enter) でも Dropdown が開閉できること

自動チェック:
- `pnpm tsc --noEmit`
- `pnpm lint`

## 実装順序 (参考)

1. 月額合計の共通関数を抽出 (Dashboard と重複させない)
2. `UserMenu.tsx` を新規作成
3. `Header.tsx` を props 拡張 + `UserMenu` 組み込み
4. Header を呼んでいるページ側で `userEmail` を渡すよう修正
5. `/mypage/page.tsx` を書き換え
6. `sign-out-button.tsx` の参照を確認し、未使用なら削除
7. `pnpm tsc --noEmit` / `pnpm lint` 実行 → 手動検証
