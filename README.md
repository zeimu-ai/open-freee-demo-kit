# freee-demo-kit

[![npm version](https://img.shields.io/npm/v/freee-demo-kit.svg)](https://www.npmjs.com/package/freee-demo-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

freee サンドボックス事業所に1コマンドでデモデータを投入するOSS CLIツール

## 特徴

- 1コマンドでデモデータを一括投入・削除
- 会計/請求/経費/人事の各領域対応プリセット
- ドライラン対応（データを変更せず確認のみ）
- TypeScript製・Node.js 20+対応

## クイックスタート

```bash
npm install -g freee-demo-kit
fdk auth          # freeeアカウントでOAuth認証
fdk list          # 利用可能なプリセット一覧
fdk load accounting/quickstart  # デモデータを投入
fdk reset         # デモデータを全削除
```

## 前提条件

- Node.js 20以上
- freeeアカウント（サンドボックス事業所）
- freeeプライベートアプリ（CLIENT_ID / CLIENT_SECRET）
  - 作成: [freee Developers](https://developer.freee.co.jp/)

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `fdk auth` | freee OAuthログイン（ブラウザ起動） |
| `fdk auth --status` | 認証状態・トークン有効期限確認 |
| `fdk auth --logout` | トークン削除 |
| `fdk whoami` | 認証済みユーザー・事業所情報表示 |
| `fdk list` | 利用可能なプリセット一覧 |
| `fdk load <preset>` | 指定プリセットのデータを投入 |
| `fdk load-all` | 全プリセット一括投入 |
| `fdk reset` | 全デモデータを削除 |
| `fdk validate` | プリセットJSONのスキーマ検証 |
| `fdk dry-run <preset>` | 投入シミュレーション（変更なし） |

## プリセット一覧

| プリセット | 内容 | 状態 |
|-----------|------|------|
| `accounting/quickstart` | 取引50件・口座3件（最小構成） | Phase 2予定 |
| `invoices/` | 請求書データ | Phase 2予定 |
| `expenses/` | 経費精算データ | Phase 2予定 |
| `hr/` | 人事労務データ | Phase 2予定 |
| `advanced/multi-period/` | 複数期・財務DD用 | Phase 3予定 |
| `advanced/multi-company/` | 複数事業所・事業譲渡シナリオ | Phase 3予定 |

プリセットの仕様・カスタムプリセットの作り方は [`presets/README.md`](presets/README.md) を参照してください。

## コントリビューション

コントリビューションを歓迎します。[CONTRIBUTING.md](CONTRIBUTING.md) をお読みください。

```bash
git clone https://github.com/tackeyy/freee-demo-kit.git
cd freee-demo-kit
npm install
npm test
```

## ライセンス

[MIT](LICENSE)
