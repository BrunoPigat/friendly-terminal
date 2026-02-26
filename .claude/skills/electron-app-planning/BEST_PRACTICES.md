# ベストプラクティス

このドキュメントでは、Electronデスクトップアプリ企画を成功させるためのベストプラクティスと実践的なガイドラインを提供します。

## 企画の原則

### セキュリティ最優先

Electronアプリはセキュリティリスクが高いため、以下を必ず遵守：

#### 必須設定

```javascript
// BrowserWindowの設定
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // 必須: レンダラーでのNode.js無効化
    contextIsolation: true,       // 必須: コンテキスト分離
    sandbox: true,                // 推奨: サンドボックス化
    preload: path.join(__dirname, 'preload.js')
  }
});
```

#### IPC設計のベストプラクティス

```javascript
// preload.js - 安全なAPI公開
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 明示的に定義されたAPIのみ公開
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),

  // イベントリスナー
  onFileChanged: (callback) => {
    ipcRenderer.on('file-changed', (event, ...args) => callback(...args));
  }
});

// main.js - ハンドラー側で入力検証
ipcMain.handle('read-file', async (event, filePath) => {
  // 入力検証
  if (typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  // パストラバーサル対策
  const safePath = path.resolve(allowedDir, path.basename(filePath));
  return fs.readFileSync(safePath, 'utf-8');
});
```

#### 避けるべきこと
- `nodeIntegration: true`の使用
- `contextIsolation: false`の使用
- remote moduleの使用（deprecated）
- 外部コンテンツのloadURL without validation

### パフォーマンス最適化

#### メインプロセス

```javascript
// 悪い例: メインプロセスでの重い処理
ipcMain.handle('heavy-task', async () => {
  // これはUIをブロックする可能性がある
  return heavyComputation();
});

// 良い例: ワーカースレッドの活用
const { Worker } = require('worker_threads');

ipcMain.handle('heavy-task', async () => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-worker.js');
    worker.on('message', resolve);
    worker.on('error', reject);
  });
});
```

#### レンダラープロセス
- 仮想化リスト（大量データ表示時）
- 画像の遅延読み込み
- 不要なDOM操作の削減
- React/VueのメモコンポーネントやコンパイルedCSS

#### メモリ管理
- 不要なウィンドウは`destroy()`で破棄
- 大きなオブジェクトの適切な解放
- `process.memoryUsage()`でメモリ監視

```javascript
// ウィンドウ破棄時のクリーンアップ
mainWindow.on('closed', () => {
  mainWindow = null;
});
```

### クロスプラットフォーム対応

#### OS固有の考慮点

**Windows**
```javascript
// パス区切り
const filePath = path.join(dir, 'file.txt'); // path.joinを使用

// レジストリアクセス（必要な場合）
// regedit packageを使用

// インストーラー
// NSIS / MSI / AppX
```

**macOS**
```javascript
// アプリメニュー（macOSは最初のメニューがアプリ名）
if (process.platform === 'darwin') {
  template.unshift({
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });
}

// Dock統合
app.dock.setMenu(dockMenu);
app.dock.setBadge('!');

// ノータリゼーション必須（macOS 10.15+）
```

**Linux**
```javascript
// デスクトップエントリファイル
// electron-builderが自動生成

// 依存関係
// libgtk-3-0, libnss3等
```

#### 共通化のパターン

```javascript
// プラットフォーム判定
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

// データディレクトリ
const userDataPath = app.getPath('userData');
// macOS: ~/Library/Application Support/AppName
// Windows: %APPDATA%\AppName
// Linux: ~/.config/AppName
```

### 自動アップデート設計

```javascript
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// 更新確認
autoUpdater.checkForUpdatesAndNotify();

// イベントハンドリング
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  // 更新通知UI
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデート',
    message: '新しいバージョンが利用可能です。ダウンロードを開始します。'
  });
});

autoUpdater.on('update-downloaded', (info) => {
  // 再起動促進UI
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデート準備完了',
    message: 'アップデートをインストールするために再起動しますか？',
    buttons: ['再起動', '後で']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  log.error('Update error:', err);
});
```

#### 更新サーバー選定

| サーバー | メリット | デメリット |
|---------|---------|-----------|
| GitHub Releases | 無料、簡単設定 | レート制限あり |
| Amazon S3 | カスタマイズ可能、高速 | コスト発生 |
| 自社サーバー | 完全制御 | 管理コスト |

## よくある失敗パターンと対策

### 失敗パターン1: セキュリティ脆弱性

**症状**: XSS、リモートコード実行の脆弱性

**原因**:
- nodeIntegration: true
- contextIsolation: false
- 未検証の入力

**対策**:
- セキュリティ設定の徹底
- 入力値の検証
- Content Security Policy設定
- 依存関係の定期更新

### 失敗パターン2: パフォーマンス問題

**症状**: 起動が遅い、動作がもっさり、メモリ大量消費

**原因**:
- 起動時の過剰な初期化
- メインプロセスでの重い処理
- メモリリーク

**対策**:
- 起動時の処理最小化
- 遅延読み込みの活用
- Worker Threadsの活用
- メモリプロファイリング

### 失敗パターン3: ストア審査リジェクト

**症状**: Mac App Store / Microsoft Storeで公開できない

**原因**:
- Sandboxing非対応
- ガイドライン違反
- ノータリゼーション未実施

**対策**:
- 各ストアのガイドライン熟読
- macOS: Sandboxing対応、Hardened Runtime有効化
- Windows: MSIX形式対応
- 事前のテストビルド

### 失敗パターン4: クロスプラットフォーム互換性

**症状**: 特定のOSで動作しない、UIが崩れる

**原因**:
- OS固有のパス処理
- フォント・UI差異
- 権限の違い

**対策**:
- path.join()の使用
- 全OSでのUIテスト
- 権限要求の適切な実装

## 企画フェーズ別のポイント

### Phase 1: アイデア創出

#### やるべきこと
- デスクトップアプリが適している理由を明確化
- Webアプリでは実現できない価値を特定
- 競合デスクトップアプリの調査

#### 避けるべきこと
- 「なんとなくデスクトップアプリ」
- Webで十分な機能のデスクトップ化
- 差別化のないクローン

### Phase 2: 設計

#### やるべきこと
- セキュリティ設計を最初に
- IPC設計を詳細に
- 全OSでの動作を想定

#### 避けるべきこと
- セキュリティ後回し
- 1OS専用設計
- 過剰な機能

### Phase 3: 開発

#### やるべきこと
- 早期に全OSでビルド確認
- セキュリティテスト
- パフォーマンス計測

#### 避けるべきこと
- 1OSのみでの開発
- テストの後回し
- 依存関係の放置

### Phase 4: 配布

#### やるべきこと
- コード署名の取得
- 自動アップデート実装
- クラッシュレポート収集

#### 避けるべきこと
- 署名なしでの配布
- 手動アップデートのみ
- エラー追跡なし

## チェックリスト

### 企画完了時
- [ ] デスクトップアプリが適している理由が明確
- [ ] ターゲットプラットフォームが決定
- [ ] コア機能が3〜5個に絞られている
- [ ] セキュリティ設計が含まれている
- [ ] 配布戦略が決まっている

### 開発前
- [ ] プロセス設計（Main/Renderer/Preload）完了
- [ ] IPC設計完了
- [ ] データ保存設計完了
- [ ] UIデザイン完了
- [ ] 全OSでの動作確認環境準備

### 配布前
- [ ] 全プラットフォームでテスト完了
- [ ] コード署名完了
- [ ] 自動アップデート動作確認
- [ ] インストーラー作成完了
- [ ] セキュリティレビュー完了

### 配布後
- [ ] クラッシュレポート監視
- [ ] ユーザーフィードバック収集
- [ ] 定期的なアップデート計画
- [ ] 依存関係の更新監視

すべてチェックできたら、配布準備完了です！
