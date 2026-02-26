# 企画書テンプレート

このドキュメントでは、Electronデスクトップアプリ企画書の標準フォーマットを定義します。

## 保存先

企画書は`electron-app-plans/[app-name].md`に保存してください。

## フォーマットテンプレート

```markdown
# デスクトップアプリ企画書: [アプリ名]

**企画者**: [ユーザー名/チーム名]
**作成日時**: YYYY-MM-DD
**バージョン**: 1.0
**ステータス**: 企画中 / 開発中 / ベータ版 / リリース済み

---

## 1. エグゼクティブサマリー

### アプリ概要
[アプリの一文説明]

### 解決する課題
[ユーザーが抱える問題]

### ターゲットユーザー
[具体的なペルソナ]

### 対象プラットフォーム
- [ ] Windows
- [ ] macOS
- [ ] Linux

### 独自性・差別化ポイント
[競合との違い、Webアプリとの違い]

### 収益モデル
> **参照**: [MONETIZATION.md](../common/MONETIZATION.md) - マネタイズ戦略の詳細ガイド

[買い切り / サブスク / フリーミアム / 無料]

---

## 2. 市場・競合分析

### 2-1. 類似アプリの調査

| アプリ名 | プラットフォーム | 価格 | 強み | 弱み |
|---------|----------------|------|------|------|
| 競合A   | Win/Mac        | $XX  | ... | ... |
| 競合B   | Win/Mac/Linux  | 無料 | ... | ... |
| 競合C   | Mac            | $XX  | ... | ... |

### 2-2. デスクトップアプリが適している理由
- [Webアプリでは実現できない機能]
- [オフライン対応の必要性]
- [ネイティブ機能の活用]
- [パフォーマンス要件]

### 2-3. 差別化戦略
- [競合との差別化ポイント]
- [独自の価値提案]

---

## 3. ユーザー設定

### ペルソナ1: [名前]
- **職業**: [...]
- **使用OS**: Windows / macOS / Linux
- **課題**: [...]
- **期待する解決**: [...]
- **利用シーン**: [...]

### ペルソナ2: [名前]（必要に応じて追加）
[...]

---

## 4. 機能設計（MVP）

### 4-1. コア機能

1. **[機能名1]**
   - 説明: [...]
   - 優先度: Must Have
   - 実装難易度: 低/中/高

2. **[機能名2]**
   - 説明: [...]
   - 優先度: Must Have
   - 実装難易度: 低/中/高

3. **[機能名3]**
   - 説明: [...]
   - 優先度: Should Have
   - 実装難易度: 低/中/高

### 4-2. UI設計

#### メインウィンドウ
- **サイズ**: 横xxxx × 縦xxxx（デフォルト）
- **最小サイズ**: 横xxx × 縦xxx
- **リサイズ**: 可能 / 不可
- **フレーム**: 標準 / カスタム（frameless）

#### メニュー構成
| メニュー | サブメニュー |
|---------|-------------|
| ファイル | 新規, 開く, 保存, 終了 |
| 編集 | 元に戻す, やり直し, カット, コピー, ペースト |
| 表示 | ズーム, フルスクリーン |
| ヘルプ | バージョン情報, ドキュメント |

#### システムトレイ（該当する場合）
- [ ] 常駐機能あり
- トレイアイコン: [説明]
- トレイメニュー: [メニュー項目]

#### キーボードショートカット
| ショートカット | 機能 | Mac | Windows |
|---------------|------|-----|---------|
| 新規作成 | 新規ファイル | Cmd+N | Ctrl+N |
| 保存 | ファイル保存 | Cmd+S | Ctrl+S |
| ... | ... | ... | ... |

### 4-3. データ設計

#### ユーザーデータ
- **保存場所**: app.getPath('userData')
- **形式**: JSON / SQLite / electron-store
- **内容**: [保存するデータの種類]

#### 設定データ
- **保存場所**: app.getPath('userData')/config.json
- **設定項目**: [...]

#### キャッシュ
- **保存場所**: app.getPath('cache')
- **内容**: [...]

---

## 5. アーキテクチャ設計

### 5-1. プロセス構成

```
Main Process
├── ウィンドウ管理 (BrowserWindow)
├── ファイルシステム操作 (fs, dialog)
├── システムトレイ (Tray)
├── メニュー (Menu)
├── IPC ハンドリング (ipcMain)
└── 自動アップデート (autoUpdater)

Renderer Process
├── UI レンダリング (React/Vue/etc.)
├── ユーザー操作処理
└── IPC 呼び出し (ipcRenderer via preload)

Preload Script
└── 安全なAPI公開 (contextBridge)
```

### 5-2. セキュリティ設定

```javascript
// BrowserWindowの設定
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,      // 必須: false
    contextIsolation: true,      // 必須: true
    sandbox: true,               // 推奨: true
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 5-3. IPC設計

#### Main Process → Renderer
```javascript
// main.js
mainWindow.webContents.send('channel-name', data);

// preload.js (受信用API公開)
contextBridge.exposeInMainWorld('api', {
  onChannelName: (callback) => ipcRenderer.on('channel-name', callback)
});
```

#### Renderer → Main Process
```javascript
// preload.js
contextBridge.exposeInMainWorld('api', {
  doSomething: (data) => ipcRenderer.invoke('do-something', data)
});

// main.js
ipcMain.handle('do-something', async (event, data) => {
  // 処理
  return result;
});
```

### 5-4. データ保存設計

| データ種別 | 保存方法 | 備考 |
|-----------|---------|------|
| ユーザー設定 | electron-store | JSON形式、暗号化オプションあり |
| ドキュメント | fs (ユーザー選択) | ダイアログ経由で安全に |
| キャッシュ | fs (cache dir) | 一時データ |
| DB | SQLite (better-sqlite3) | 構造化データ向け |

---

## 6. 技術スタック

### コア技術
- **Electron**: 最新LTS版 (v2X.x.x)
- **Node.js**: 最新LTS版
- **フレームワーク**: React / Vue / Svelte / Vanilla

### UI/スタイリング
- **UIライブラリ**: shadcn/ui / Radix UI / Ant Design
- **スタイリング**: Tailwind CSS / CSS Modules / styled-components

### データベース/ストレージ
- **設定**: electron-store
- **ローカルDB**: better-sqlite3 / sql.js

### ビルド・配布
- **ビルドツール**: electron-builder / electron-forge
- **自動アップデート**: electron-updater
- **CI/CD**: GitHub Actions

### 選定理由
| 技術 | 選定理由 | 代替案 |
|------|---------|--------|
| TypeScript | 型安全性、保守性 | JavaScript |
| React | エコシステム、人材 | Vue, Svelte |
| electron-builder | 機能豊富、実績 | electron-forge |
| ... | ... | ... |

---

## 7. 開発ロードマップ

### Phase 1: MVP開発（1〜2ヶ月）
- **Week 1-2**: 環境構築、基本ウィンドウ、IPC設計
- **Week 3-6**: コア機能実装
- **Week 7-8**: テスト、デバッグ

**マイルストーン**: 単一OS版動作確認

### Phase 2: クロスプラットフォーム対応（2〜4週間）
- 全OS対応テスト
- OS固有の調整（メニュー、パス等）
- インストーラー作成
- コード署名

**マイルストーン**: 全OS版ビルド完成

### Phase 3: 配布・改善（公開後）
- 配布チャネル公開
- 自動アップデート機能
- ユーザーフィードバック対応
- 機能追加

---

## 8. 配布戦略

### 配布チャネル
- [ ] 自社Webサイト
- [ ] GitHub Releases
- [ ] Microsoft Store
- [ ] Mac App Store

### コード署名

#### Windows
- **証明書**: EV Code Signing証明書
- **提供元**: DigiCert, Sectigo等
- **用途**: SmartScreen警告回避、信頼性向上

#### macOS
- **証明書**: Apple Developer ID
- **ノータリゼーション**: 必須（macOS 10.15+）
- **Hardened Runtime**: 有効化必須

### 自動アップデート設計

```javascript
// electron-updater設定
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', (info) => {
  // 更新通知UI表示
});

autoUpdater.on('update-downloaded', (info) => {
  // 再起動促進UI表示
});
```

- **更新サーバー**: GitHub Releases / S3 / 自社サーバー
- **更新頻度**: 自動バックグラウンド / 手動確認

---

## 9. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| Electronアップデート対応 | 中 | 定期的なアップデート、破壊的変更の監視 |
| ストア審査リジェクト | 高 | ガイドライン遵守、事前チェック |
| パフォーマンス問題 | 中 | プロファイリング、最適化、Native Moduleの検討 |
| セキュリティ脆弱性 | 高 | contextIsolation必須、依存関係の更新 |
| クロスプラットフォーム互換性 | 中 | 全OSでの継続的テスト |

---

## 10. KPI設定

### リリース後1ヶ月
- ダウンロード数: XXX
- アクティブユーザー: XXX
- クラッシュ率: X%以下

### リリース後3ヶ月
- ダウンロード数: X,XXX
- 有料転換率: X%（該当する場合）
- ユーザー満足度: X.X/5.0

---

## 11. 次のステップ

### 即座に実行すべきこと
1. [ ] 開発環境セットアップ
2. [ ] 基本ウィンドウのプロトタイプ
3. [ ] UIデザイン作成（Figma等）

### 配布前の準備
1. [ ] コード署名証明書取得
2. [ ] プライバシーポリシー作成
3. [ ] Webサイト/ランディングページ作成
4. [ ] インストーラーテスト

---

## 付録

### 参考資料
- [Electron公式ドキュメント](https://www.electronjs.org/docs/latest/)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-builder](https://www.electron.build/)
- [類似アプリURL]

### 関連ドキュメント
- デザインモックアップ: [リンク]
- 技術仕様書: [リンク]
```

## テンプレート使用のポイント

### 1. エグゼクティブサマリー
- デスクトップアプリが適している理由を明確に
- Webアプリとの差別化ポイントを強調

### 2. アーキテクチャ設計
- セキュリティ設定は必ず確認
- IPC設計を詳細に記載

### 3. 配布戦略
- コード署名は必須と考える
- 自動アップデートの設計を含める

### 4. クロスプラットフォーム
- 各OSの特性を考慮
- テスト計画を含める
