# サービスカード「更新日までのアラート」表示切替 設計書

作成日: 2026-05-29

## 背景 / 目的

サービスカードに表示される「あと◯日」バッジ (`NextBillingBadge`) を、サブスクごとにエンドユーザーが表示 ON/OFF できるようにする。現状は 7日以内なら無条件に表示されるため、ユーザーが「アラートを出してほしいサブスク」だけに絞り込めない。

## 要件

- サブスクごとに個別 ON/OFF (グローバル設定は持たない)。
- 既存サブスクのデフォルトは OFF。明示的に有効化されたカードだけバッジが出る。
- 追加モーダル / 編集モーダル両方で設定変更可能。
- 7日以内かつ ON のときのみバッジを描画 (既存の7日しきい値は維持)。

## データモデル変更

### `src/lib/schema.ts`

`subscriptions` テーブルに `alertEnabled` カラムを追加。

```ts
alertEnabled: int('alert_enabled', { mode: 'boolean' }).notNull().default(false),
```

- SQLite 上は `INTEGER` (0/1)。Drizzle の `mode: 'boolean'` で TS 側は `boolean`。
- デフォルト `false`。既存レコードは migration 適用後 0 が入り、自動でバッジが消える。

### マイグレーション手順

1. `src/lib/schema.ts` を編集。
2. `pnpm drizzle-kit generate` で migration SQL を生成。
3. 生成された SQL を確認 (`ALTER TABLE subscriptions ADD COLUMN alert_enabled INTEGER NOT NULL DEFAULT 0` 相当)。
4. `pnpm drizzle-kit push` で Turso に反映。
5. `pnpm tsc --noEmit` / `pnpm lint` / `pnpm test` 通過確認。

## 型 / バリデーション変更

### `src/lib/types.ts`

- `Subscription` 型に `alertEnabled: boolean` を追加。
- 作成/更新用 zod スキーマに以下を追加:

```ts
alertEnabled: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
```

HTML form の checkbox は未チェック時 FormData にキーが含まれず、チェック時は `'on'` が入る挙動に合わせて preprocess する。既存 actions の取り出しパターンに合わせて FormData 段階で boolean 化してから zod に渡す形でも可。

## Server Action 変更

### `src/app/actions.ts`

- `createSubscriptionAction` / `updateSubscriptionAction` のスキーマと DB 書き込みに `alertEnabled` を追加。
- 既存の `nextBillingFrom()` などの日付ロジックには影響なし (アラートは表示制御のみ)。

## UI 変更

### `src/components/SubscriptionForm.tsx`

メモ欄付近に checkbox を1行追加:

```tsx
<label>
  <input
    type="checkbox"
    name="alertEnabled"
    defaultChecked={subscription?.alertEnabled ?? false}
  />
  更新日までのアラートを表示する
</label>
```

- 追加モード: `defaultChecked={false}` (既存方針と一致)。
- 編集モード: 既存値を反映。

### `src/components/dashboard/ServiceCard.tsx`

`NextBillingBadge` の呼び出しを `alertEnabled` でガード:

```tsx
{subscription.alertEnabled && <NextBillingBadge daysUntil={daysUntil} />}
```

`NextBillingBadge` 自体は変更しない (7日超で `null` を返す既存挙動を維持)。

## テスト方針

### Vitest 単体テスト

- `billing.test.ts` は変更不要 (アラートロジックは表示層のみ)。
- 新規ロジックテストは最小限。`alertEnabled` は単純 boolean フラグのため対象が薄い。

### 手動確認

- 追加モーダル: チェックボックスがデフォルト OFF。チェックして追加 → 7日以内ならカードにバッジ表示。
- 編集モーダル: 既存カードの `alertEnabled` が反映される。チェック解除して更新 → バッジが消える。
- 既存カード (マイグレ後): バッジが全て消えていることを確認。
- 7日超のカード: `alertEnabled` が true でもバッジは出ない (`NextBillingBadge` の既存挙動)。

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `src/lib/schema.ts` | `alertEnabled` カラム追加 |
| `src/lib/types.ts` | `Subscription` 型 + zod スキーマ追加 |
| `src/app/actions.ts` | create/update で `alertEnabled` を受取り保存 |
| `src/components/SubscriptionForm.tsx` | checkbox 追加 |
| `src/components/dashboard/ServiceCard.tsx` | `alertEnabled` 条件で `NextBillingBadge` をガード |
| `drizzle/` | 新規 migration SQL |

## YAGNI で削ったもの

- グローバル設定 (マイページ一括 ON/OFF)。
- カード上トグル即時切替。
- 「N日前から」のしきい値カスタマイズ (7日固定を維持)。
