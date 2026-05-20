# subscx MVP 実装計画

**参照仕様:** `docs/spec.md`  
**スタック:** Better Auth + Drizzle ORM + Turso


## 目視動作確認 (人間タスク)

- [ ] `pnpm dev` → 手動シナリオ確認
  - Google OAuth でサインイン
  - 「+ 追加」→ 入力 → 一覧表示
  - 月額合計計算 (yearly は /12 四捨五入)
  - 7日以内の警告バナー
  - 編集・削除機能
  - 別ユーザーでデータ分離確認
- [ ] 人間に完了報告
