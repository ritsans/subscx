## 実装計画書: サービス名 Autocomplete 機能

作成日: 2026-05-28
最終更新: 2026-05-29 (`simple-icons` + Brandfetch SVG ハイブリッド構成に変更)

## 目的

`ServiceModal` のサービス名入力欄に、厳選した有名サブスクサービス (38件) を候補ソースとした入力補助 (Autocomplete) を追加する。**自由入力を阻害せず、ヒント表示のみ**。

あわせて、既存の `ServiceIcon` のアイコン取得元を `simple-icons` 単独から、**`simple-icons` + Brandfetch 由来の自前 SVG のハイブリッド構成**に拡張する。`simple-icons` v15 で削除された主要商標ブランド (Disney+ / Slack / Microsoft / Amazon 系 / Adobe 系など) を Brandfetch SVG で補完する。

## 背景: なぜハイブリッド構成にするか

- 当初は `simple-icons` の `icons.json` (3400+ 件) を候補ソースとする想定だった
- `simple-icons` 最新版では商標問題により Disney+, Hulu, Amazon (Prime Video / Music), ChatGPT, Slack, Microsoft 365, Canva, Adobe CC, Nintendo, Xbox など**国内サブスクの主要ブランドが削除されている**
- 既存実装は `simple-icons` を活用しており、対応済みブランドは引き続き同パッケージで描画する方が変更コストが低い
- 不足ブランドだけを Brandfetch から手動取得して補う形にすれば、依存追加なし・スクリプトなしで完結する
- 候補は **38 件の厳選リスト**に絞り、ノイズの少ないサジェストを目指す

## 前提

- 既存ファイル
  - `src/components/dashboard/ServiceModal.tsx` — サービス名 `<Input>` を含むモーダル
  - `src/components/dashboard/ServiceIcon.tsx` — ブランドアイコン描画 (現状 `simple-icons` のみ対応)
  - `src/lib/icon-map.ts` — 名前 → SimpleIcon の手書き辞書 (**構造を拡張する**)
- 既存スタック: Next.js 16 (App Router) / React 19 / Tailwind / shadcn/ui / Biome / pnpm
- 既存依存: `simple-icons` (**今回も継続利用**、削除しない)

## アイコン解決の優先順位

`ServiceIcon` は以下の順で解決を試みる:

1. `simple-icons` 由来のエントリ → 既存通り `<svg path>` を `hex` で着色して描画
2. Brandfetch SVG 由来のエントリ → `<img src="/brand-icons/{slug}.svg" />` で描画
3. どちらにも該当しない → 既存通り**頭文字バッジ**へフォールバック

## 候補サービス一覧 (38件)

| カテゴリ | slug | title | ソース | 主なエイリアス |
|---|---|---|---|---|
| 動画 | netflix | Netflix | simple-icons | — |
| 動画 | youtube | YouTube | simple-icons | — |
| 動画 | youtube-premium | YouTube Premium | simple-icons (siYoutube 流用) | youtube premium |
| 動画 | disney-plus | Disney+ | **brandfetch** | disney plus, disneyplus |
| 動画 | hulu | Hulu | **brandfetch** | — |
| 動画 | prime-video | Amazon Prime Video | **brandfetch** | prime video, amazon prime |
| 動画 | u-next | U-NEXT | **brandfetch** | unext |
| 動画 | dazn | DAZN | simple-icons | — |
| 音楽 | spotify | Spotify | simple-icons | — |
| 音楽 | apple-music | Apple Music | simple-icons | apple music |
| 音楽 | amazon-music | Amazon Music | **brandfetch** | amazon music |
| 音楽 | youtube-music | YouTube Music | simple-icons | youtube music |
| AI/開発 | claude | Claude | simple-icons | — |
| AI/開発 | anthropic | Anthropic | simple-icons | — |
| AI/開発 | chatgpt | ChatGPT | **brandfetch** | openai |
| AI/開発 | github | GitHub | simple-icons | github copilot |
| AI/開発 | cursor | Cursor | simple-icons | — |
| AI/開発 | gemini | Gemini | simple-icons (siGooglegemini) | google gemini |
| AI/開発 | perplexity | Perplexity | simple-icons | — |
| 仕事 | notion | Notion | simple-icons | — |
| 仕事 | figma | Figma | simple-icons | — |
| 仕事 | slack | Slack | **brandfetch** | — |
| 仕事 | zoom | Zoom | simple-icons | — |
| 仕事 | microsoft-365 | Microsoft 365 | **brandfetch** | office 365, m365 |
| 仕事 | google-workspace | Google Workspace | simple-icons (siGoogle 流用) | gsuite, g suite |
| 仕事 | canva | Canva | **brandfetch** | — |
| 仕事 | adobe-cc | Adobe Creative Cloud | **brandfetch** | adobe cc, creative cloud |
| 仕事 | 1password | 1Password | simple-icons (si1password) | — |
| 仕事 | dropbox | Dropbox | simple-icons | — |
| 仕事 | evernote | Evernote | simple-icons | — |
| クラウド | icloud | iCloud | simple-icons | icloud+ |
| クラウド | google-drive | Google Drive | simple-icons | google one |
| ゲーム | playstation | PlayStation | simple-icons | ps plus, playstation plus |
| ゲーム | nintendo-switch-online | Nintendo Switch Online | **brandfetch** | nso, switch online |
| ゲーム | xbox-game-pass | Xbox Game Pass | **brandfetch** | game pass |
| ゲーム | steam | Steam | simple-icons | — |
| 学習 | audible | Audible | simple-icons | — |
| 学習 | duolingo | Duolingo | simple-icons | duolingo plus |

**Brandfetch から手動取得が必要なサービス: 12 件**

disney-plus, hulu, prime-video, u-next, amazon-music, chatgpt, slack, microsoft-365, canva, adobe-cc, nintendo-switch-online, xbox-game-pass

## 仕様

### アイコン管理仕様

- **simple-icons 由来**: 従来通り `import { siXxx } from 'simple-icons'` で参照
- **Brandfetch SVG 由来**:
  - 配置: `public/brand-icons/{slug}.svg`
  - 命名規則: `icon-map.ts` の `slug` フィールドと一致 (半角スペース・記号は `-` に置換)
  - 取得方法: ユーザーが Brandfetch (https://brandfetch.com/) から手動でダウンロードし配置する (API / スクリプトは使わない)
  - 表示: `<img src="/brand-icons/{slug}.svg" alt={title} />` (色は Brandfetch のオリジナルを尊重)
- **フォールバック**: 該当 `slug` が `ICON_MAP` に無い、または Brandfetch SVG が未配置の場合は、既存どおり**頭文字バッジ**

### マッチング仕様 (Autocomplete)

- 入力が **2 文字以上** で候補表示開始
- マッチ対象: `ICON_MAP` の各エントリの `title` と全 `aliases` (それぞれ lowercase)
- スコアリング (高い順):
  1. `title` が prefix 一致
  2. `alias` のいずれかが prefix 一致
  3. `title` の部分一致 (`includes`)
  4. `alias` の部分一致
- 上位 **8 件** まで表示
- 同じ `slug` は重複させない (alias 経由でヒットしても 1 件)

### UI 仕様 (Autocomplete)

- 入力欄は既存 `<Input>` を残し、**直下に候補リストを絶対配置** (Popover 不使用)
- 候補が 0 件、または入力 2 文字未満、または focus 外なら非表示
- 候補項目: 左にブランドアイコン (24x24)、右に `title` 表示
  - アイコン描画は `ServiceIcon` の描画ロジックを再利用 (`kind` で分岐済み)
- 候補クリックで input の値を `title` に置換し、リストを閉じる
- **Esc キー** / **外クリック** でリストを閉じる
- **矢印キー** ↑↓ で候補にフォーカス移動、**Enter で確定**。候補にフォーカスがない状態の Enter は通常の form submit を阻害しない
- 自由入力は常に有効。候補を選ばずに任意の文字列を保存できる

## ファイル変更一覧

### 新規追加

1. `public/brand-icons/*.svg` (12 ファイル、ユーザーが Brandfetch から手動取得)
2. `src/lib/icon-suggest.ts`
3. `src/components/dashboard/ServiceNameAutocomplete.tsx`

### 編集

4. `src/lib/icon-map.ts` — discriminated union 化、エントリ拡充、エイリアス追加
5. `src/components/dashboard/ServiceIcon.tsx` — `kind` で分岐して `<img>` 描画パスを追加
6. `src/components/dashboard/ServiceModal.tsx` — サービス名 input を `ServiceNameAutocomplete` に差し替え

### 変更しないもの

- `package.json` の `simple-icons` 依存 (継続利用)
- DB スキーマ、Server Actions、`src/lib/billing.ts`
- 既存の `ServiceIcon` の利用箇所 (props 互換維持)

---

## ステップ詳細

### Step 1: Brandfetch からアイコン取得 (手動 / ユーザー作業)

ユーザーが上記 12 サービス分の SVG を Brandfetch から手動取得し、`public/brand-icons/{slug}.svg` として配置する。

- 命名は上表の `slug` 列と完全一致させる (例: `disney-plus.svg`, `prime-video.svg`)
- SVG が提供されていないサービスは PNG で代替する可能性あり。その場合は `icon-map.ts` 側で拡張子情報を持たせる必要がある (実装着手前に確認)
- 全 12 件揃わなくても `ICON_MAP` のフォールバック動作で支障なし。揃っている分から段階的にコミット可能

### Step 2: `src/lib/icon-map.ts` の書き換え

既存の `ICON_MAP: Record<string, SimpleIcon>` を、discriminated union の `Record<string, IconEntry>` に拡張する。

```ts
import {
  type SimpleIcon,
  si1password,
  siAnthropic,
  siApplemusic,
  siAudible,
  siClaude,
  siCursor,
  siDazn,
  siDropbox,
  siDuolingo,
  siEvernote,
  siFigma,
  siGithub,
  siGoogle,
  siGoogledrive,
  siGooglegemini,
  siIcloud,
  siNetflix,
  siNotion,
  siPerplexity,
  siPlaystation,
  siSpotify,
  siSteam,
  siYoutube,
  siYoutubemusic,
  siZoom,
} from 'simple-icons';

export type IconEntry =
  | { kind: 'simple-icon'; slug: string; title: string; icon: SimpleIcon }
  | { kind: 'brand-svg'; slug: string; title: string };

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

// title / alias の正規化済みキー → IconEntry
const ICON_MAP: Record<string, IconEntry> = {
  // === simple-icons 由来 ===
  netflix: { kind: 'simple-icon', slug: 'netflix', title: 'Netflix', icon: siNetflix },
  spotify: { kind: 'simple-icon', slug: 'spotify', title: 'Spotify', icon: siSpotify },
  youtube: { kind: 'simple-icon', slug: 'youtube', title: 'YouTube', icon: siYoutube },
  'youtube premium': { kind: 'simple-icon', slug: 'youtube-premium', title: 'YouTube Premium', icon: siYoutube },
  'youtube music': { kind: 'simple-icon', slug: 'youtube-music', title: 'YouTube Music', icon: siYoutubemusic },
  'apple music': { kind: 'simple-icon', slug: 'apple-music', title: 'Apple Music', icon: siApplemusic },
  claude: { kind: 'simple-icon', slug: 'claude', title: 'Claude', icon: siClaude },
  anthropic: { kind: 'simple-icon', slug: 'anthropic', title: 'Anthropic', icon: siAnthropic },
  notion: { kind: 'simple-icon', slug: 'notion', title: 'Notion', icon: siNotion },
  figma: { kind: 'simple-icon', slug: 'figma', title: 'Figma', icon: siFigma },
  github: { kind: 'simple-icon', slug: 'github', title: 'GitHub', icon: siGithub },
  dropbox: { kind: 'simple-icon', slug: 'dropbox', title: 'Dropbox', icon: siDropbox },
  dazn: { kind: 'simple-icon', slug: 'dazn', title: 'DAZN', icon: siDazn },
  cursor: { kind: 'simple-icon', slug: 'cursor', title: 'Cursor', icon: siCursor },
  gemini: { kind: 'simple-icon', slug: 'gemini', title: 'Gemini', icon: siGooglegemini },
  'google gemini': { kind: 'simple-icon', slug: 'gemini', title: 'Gemini', icon: siGooglegemini },
  perplexity: { kind: 'simple-icon', slug: 'perplexity', title: 'Perplexity', icon: siPerplexity },
  zoom: { kind: 'simple-icon', slug: 'zoom', title: 'Zoom', icon: siZoom },
  'google workspace': { kind: 'simple-icon', slug: 'google-workspace', title: 'Google Workspace', icon: siGoogle },
  gsuite: { kind: 'simple-icon', slug: 'google-workspace', title: 'Google Workspace', icon: siGoogle },
  '1password': { kind: 'simple-icon', slug: '1password', title: '1Password', icon: si1password },
  evernote: { kind: 'simple-icon', slug: 'evernote', title: 'Evernote', icon: siEvernote },
  icloud: { kind: 'simple-icon', slug: 'icloud', title: 'iCloud', icon: siIcloud },
  'icloud+': { kind: 'simple-icon', slug: 'icloud', title: 'iCloud', icon: siIcloud },
  'google drive': { kind: 'simple-icon', slug: 'google-drive', title: 'Google Drive', icon: siGoogledrive },
  'google one': { kind: 'simple-icon', slug: 'google-drive', title: 'Google Drive', icon: siGoogledrive },
  playstation: { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  'ps plus': { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  'playstation plus': { kind: 'simple-icon', slug: 'playstation', title: 'PlayStation', icon: siPlaystation },
  steam: { kind: 'simple-icon', slug: 'steam', title: 'Steam', icon: siSteam },
  audible: { kind: 'simple-icon', slug: 'audible', title: 'Audible', icon: siAudible },
  duolingo: { kind: 'simple-icon', slug: 'duolingo', title: 'Duolingo', icon: siDuolingo },

  // === Brandfetch SVG 由来 (public/brand-icons/{slug}.svg) ===
  'disney+': { kind: 'brand-svg', slug: 'disney-plus', title: 'Disney+' },
  'disney plus': { kind: 'brand-svg', slug: 'disney-plus', title: 'Disney+' },
  hulu: { kind: 'brand-svg', slug: 'hulu', title: 'Hulu' },
  'amazon prime video': { kind: 'brand-svg', slug: 'prime-video', title: 'Amazon Prime Video' },
  'prime video': { kind: 'brand-svg', slug: 'prime-video', title: 'Amazon Prime Video' },
  'u-next': { kind: 'brand-svg', slug: 'u-next', title: 'U-NEXT' },
  unext: { kind: 'brand-svg', slug: 'u-next', title: 'U-NEXT' },
  'amazon music': { kind: 'brand-svg', slug: 'amazon-music', title: 'Amazon Music' },
  chatgpt: { kind: 'brand-svg', slug: 'chatgpt', title: 'ChatGPT' },
  openai: { kind: 'brand-svg', slug: 'chatgpt', title: 'ChatGPT' },
  slack: { kind: 'brand-svg', slug: 'slack', title: 'Slack' },
  'microsoft 365': { kind: 'brand-svg', slug: 'microsoft-365', title: 'Microsoft 365' },
  'office 365': { kind: 'brand-svg', slug: 'microsoft-365', title: 'Microsoft 365' },
  m365: { kind: 'brand-svg', slug: 'microsoft-365', title: 'Microsoft 365' },
  canva: { kind: 'brand-svg', slug: 'canva', title: 'Canva' },
  'adobe creative cloud': { kind: 'brand-svg', slug: 'adobe-cc', title: 'Adobe Creative Cloud' },
  'adobe cc': { kind: 'brand-svg', slug: 'adobe-cc', title: 'Adobe Creative Cloud' },
  'creative cloud': { kind: 'brand-svg', slug: 'adobe-cc', title: 'Adobe Creative Cloud' },
  'nintendo switch online': { kind: 'brand-svg', slug: 'nintendo-switch-online', title: 'Nintendo Switch Online' },
  nso: { kind: 'brand-svg', slug: 'nintendo-switch-online', title: 'Nintendo Switch Online' },
  'switch online': { kind: 'brand-svg', slug: 'nintendo-switch-online', title: 'Nintendo Switch Online' },
  'xbox game pass': { kind: 'brand-svg', slug: 'xbox-game-pass', title: 'Xbox Game Pass' },
  'game pass': { kind: 'brand-svg', slug: 'xbox-game-pass', title: 'Xbox Game Pass' },
};

export function resolveIcon(name: string): IconEntry | null {
  return ICON_MAP[normalize(name)] ?? null;
}

// サジェスト用: slug でユニーク化したリストを返す
export function getAllBrandIcons(): IconEntry[] {
  const seen = new Set<string>();
  const list: IconEntry[] = [];
  for (const entry of Object.values(ICON_MAP)) {
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);
    list.push(entry);
  }
  return list;
}
```

注: エイリアスを `IconEntry` 内の `aliases: string[]` フィールドとして集約する構造もありうるが、現状の「キー埋め込み式」の方が `normalize(name) → 一発逆引き` で済むため `resolveIcon` のシンプルさを優先する。

### Step 3: `src/components/dashboard/ServiceIcon.tsx` の書き換え

- 既存の `simple-icons` 描画ロジックは残す
- `resolveIcon()` の戻り値が `kind: 'brand-svg'` の場合は `<img src={`/brand-icons/${slug}.svg`} />` で描画
- 画像読み込み失敗 (`onError`) 時は頭文字バッジへフォールバック (state で切替)
- `resolveIcon()` が `null` の場合は既存通り頭文字バッジ
- サイズ・props 互換性は維持

### Step 4: `src/lib/icon-suggest.ts` 新規作成

```ts
import { type IconEntry } from './icon-map';

export type Suggestion = IconEntry;

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

export function suggestServices(query: string): Suggestion[] {
  // ICON_MAP のキー (= title + alias の正規化済み文字列) を逆引きし、
  // title prefix → alias prefix → title includes → alias includes の順でスコアリング
  // slug でユニーク化して上位 MAX_RESULTS 件を返す
  // 実装詳細は Step 2 確定後に詰める
  return [];
}
```

`icon-map.ts` から「title リスト」と「エイリアス→slug マップ」を取り出すヘルパーが必要になる可能性があるため、Step 2 と並行で API 設計を確定する。

### Step 5: `src/components/dashboard/ServiceNameAutocomplete.tsx` 新規作成

Client Component。Props は既存 `<Input>` 互換:

```ts
type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
};
```

実装方針:

- `useState` で open / activeIndex を管理
- 候補表示は `<div className="relative">` + `<ul className="absolute ...">`
- 候補項目のアイコン描画は `ServiceIcon` をそのまま流用 (24x24)
- 外クリック検知は `useEffect` + `mousedown` リスナー
- キーボード操作: ↑↓ / Enter / Esc
- `onMouseDown={(e) => e.preventDefault()}` で input の blur より先にクリック成立

### Step 6: `ServiceModal.tsx` の差し替え

サービス名 input (`name="name"` の `<Input>`) を `<ServiceNameAutocomplete>` に置き換える。state 管理が `useState` なのか formData 直渡しなのかは既存実装次第なので、**Read してから差し替える**。

想定パターン:
- 既に `useState` 管理 → そのまま `value` / `onChange` を渡す
- uncontrolled (formData ベース) → ローカルに `useState` を追加し、`name` 属性で form submit に乗せる

## 検証

1. **型チェック**: `pnpm tsc --noEmit` がパス
2. **Lint**: `pnpm lint` がパス
3. **アイコン描画確認** (`pnpm dev` 後 `/dashboard`):
   - `simple-icons` 由来 (Netflix, Spotify, GitHub 等) は従来通り描画される
   - Brandfetch SVG 由来 (Disney+, Slack, ChatGPT 等) は `public/brand-icons/` の SVG で描画される
   - `public/brand-icons/` に SVG が未配置のサービスは頭文字バッジへフォールバック
4. **Autocomplete 動作確認** (サービス追加モーダル):
   - `"s"` → 候補表示されない (2 文字未満)
   - `"sp"` → `Spotify` を含む候補が出る
   - `"spo"` → `Spotify` が上位に出る
   - エイリアス: `"prime"` → `Amazon Prime Video` が出る、`"office"` → `Microsoft 365` が出る、`"openai"` → `ChatGPT` が出る
   - 候補クリック → input に `title` が入る
   - 矢印キー ↓ → 候補がハイライト、Enter で確定
   - Esc → 候補が閉じる、input の値は保持
   - 候補を一切選ばず `"My custom service"` と打って保存 → 自由入力で保存できる
   - 候補が開いていない状態で Enter → form が submit される (既存挙動を阻害しない)

## 実装着手前に再確認する事項

1. ユーザーによる Brandfetch アイコン取得状況 (12 件すべて揃っているか、部分的か)
2. Brandfetch から SVG が取れず PNG で代替するサービスが出た場合、`IconEntry.brand-svg` に拡張子情報を持たせるか (現状は `.svg` 固定の前提)
3. `icon-suggest.ts` のスコアリング実装で title / alias の判定をどう取り出すか (`icon-map.ts` 側のヘルパー API 設計)

## 影響範囲

- DB スキーマ変更なし
- サーバーアクション変更なし
- `simple-icons` パッケージは継続利用 (削除しない)
- 既存の `ServiceIcon` 利用箇所はすべて新実装で透過的に動く (props 互換維持)
- `icon-map.ts` の型が `SimpleIcon` 単独から `IconEntry` (union) に変わるため、`resolveIcon` の戻り値を直接使う既存コードがあれば追従が必要
