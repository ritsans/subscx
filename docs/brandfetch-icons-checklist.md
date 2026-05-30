# Brandfetch アイコンダウンロード チェックリスト

> タスク3 (サジェスト機能実装) 前に完了する必要があります。
> ダウンロード対象: 12件のサービス SVG ファイル
> 配置先: `public/brand-icons/{slug}.svg`

## ダウンロード対象 (12件)

| # | Service | slug | Brandfetch URL | Status |
|---|---------|------|---|---|
| 1 | Disney+ | `disney-plus.svg` | https://brandfetch.com/disney | [x] |
| 2 | Hulu | `hulu.svg` | https://brandfetch.com/hulu | [x] |
| 3 | Amazon Prime Video | `prime-video.svg` | https://brandfetch.com/primevideo | [x] |
| 4 | U-NEXT | `u-next.svg` | https://brandfetch.com/unext | [x] |
| 5 | Amazon Music | `amazon-music.svg` | https://brandfetch.com/amazonmusic | [x] |
| 6 | ChatGPT | `chatgpt.svg` | https://brandfetch.com/openai | [x] |
| 7 | Slack | `slack.svg` | https://brandfetch.com/slack | [x] |
| 8 | Microsoft 365 | `microsoft-365.svg` | https://brandfetch.com/microsoft | [x] |
| 9 | Canva | `canva.svg` | https://brandfetch.com/canva | [x] |
| 10 | Adobe Creative Cloud | `adobe-cc.svg` | https://brandfetch.com/adobe | [x] |
| 11 | Nintendo Switch Online | `nintendo-switch-online.svg` | https://brandfetch.com/nintendo | [x] |
| 12 | Xbox Game Pass | `xbox-game-pass.svg` | https://brandfetch.com/xbox | [x] |

## ダウンロード手順

### 1. フォルダ作成

```bash
mkdir -p public/brand-icons
```

### 2. 各サービスから SVG をダウンロード

各行の Brandfetch URL を開いて、**SVG 形式** でアイコンをダウンロードします。

- ブラウザで URL を開く
- ページ内で SVG アイコンを探す (通常は大きく表示されている)
- **右クリック → リンク先を別のタブで開く** または **ダウンロード**
- ファイル名を **完全に一致させて** `public/brand-icons/` に保存

### 3. ファイル名確認

ダウンロード後、以下を確認してチェックを入れます:

```bash
ls -la public/brand-icons/
```

期待される出力 (すべてのファイルが表示されれば OK):

```
disney-plus.svg
hulu.svg
prime-video.svg
u-next.svg
amazon-music.svg
chatgpt.svg
slack.svg
microsoft-365.svg
canva.svg
adobe-cc.svg
nintendo-switch-online.svg
xbox-game-pass.svg
```

## トラブルシューティング

### SVG が見つからない場合

- Brandfetch ページで **"SVG" または "Logo"** タブを探す
- PNG しかない場合は、PNG で代替して配置可能 (ただし `icon-map.ts` で拡張子処理が必要)

### ファイル名が合わない場合

計画書の **slug 列と完全に一致させてください** (スペースは `-` に置換)。例:

- ❌ `Disney Plus.svg` (スペース)
- ✅ `disney-plus.svg` (ハイフン)

## 完了確認

すべてのファイルが配置されたら、以下を実行:

```bash
cd /home/tensystem/myprojcet/subscx
ls public/brand-icons/ | wc -l
```

出力が **12** なら OK。タスク3 (サジェスト機能) の実装を開始できます。

## 注記

- 12件すべてそろわなくても実装は可能 (フォールバックで頭文字バッジが表示される)
- ただし UI テストを確実にするため、**実装前に全12件揃えることを推奨**
- SVG ファイルサイズが大きい場合は、テキストエディタで開いて不要な属性 (metadata など) を削除して軽量化可能
