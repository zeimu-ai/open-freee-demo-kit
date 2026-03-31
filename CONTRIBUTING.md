# Contributing to freee-demo-kit

Thank you for your interest in contributing to freee-demo-kit!

## 🙏 Welcome!

freee-demo-kit は freee サンドボックス事業所にデモデータを投入するOSS CLIツールです。
税理士・会計士・freee開発者・エンジニアなど、どなたでも歓迎します。

**最も簡単な貢献方法はプリセットの追加です。** TypeScriptの知識は不要 — プリセットはJSONファイルだけで作れます。

## 📖 Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Adding a New Preset](#adding-a-new-preset)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Submitting Changes](#submitting-changes)
- [Getting Help](#getting-help)

## 🚀 Ways to Contribute

- 📋 **プリセットを追加する** — 業種・ユースケース別の会計シナリオを貢献
- 🐛 **バグを報告する** — 問題を見つけたら教えてください
- 💡 **機能を提案する** — アイデアがあれば Issue を開いてください
- 📝 **ドキュメントを改善する** — より分かりやすくする手助けを
- 🔧 **バグを修正する** — 安定性向上に貢献

## 📋 Adding a New Preset

これが最もインパクトのある貢献方法で、JSONを書くだけで完結します。

### プリセットのディレクトリ構成

適切なカテゴリ配下にディレクトリを作成します:

```
presets/
  accounting/   — 業種別・シナリオ別の会計データ
  invoices/     — 請求書シナリオ
  expenses/     — 経費精算シナリオ
  hr/           — 給与・人事シナリオ
  errors/       — 意図的なエラーデータ（研修用）
  advanced/     — 複雑なシナリオ（複数期・複数事業所）
  common/       — 共通シナリオ（減価償却等）
```

### プリセットの最小構成

```json
{
  "name": "プリセット名",
  "description": "説明文",
  "version": "1.0.0",
  "expected": {
    "walletables": 1,
    "deals": 5,
    "manualJournals": 2
  },
  "data": {
    "walletables": [
      { "type": "bank_account", "name": "○○銀行 普通預金", "bank_id": 2407 }
    ],
    "deals": [
      {
        "issue_date": "2026-01-10",
        "type": "income",
        "partner_name": "株式会社サンプル",
        "details": [
          { "account_item_name": "売上高", "tax_code": 21, "amount": 110000, "description": "サービス提供" }
        ]
      }
    ],
    "manualJournals": []
  }
}
```

### プリセットデータのルール

- **架空の企業・人物名のみ使用**（実在の企業名・人物名は禁止）
- 勘定科目名は freee のデフォルト名を使う（例: `給料手当`、`役員報酬`）
- `bank_account` / `credit_card` タイプの walletable には `bank_id` が必須
- `expected` の件数は実際のデータ件数と一致させる（`fdk verify` で検証）
- ブロックリスト（`tests/unit/no-real-names.test.ts`）に引っかかる名前は使わない

### 主な tax_code 一覧

| tax_code | 意味 |
|:--------:|------|
| 0 | 不課税 / 非課税（給与・社会保険等） |
| 21 | 課税売上 10% |
| 14 | 課税売上 8%（軽減税率） |
| 34 | 課税仕入 10% |
| 17 | 課税仕入 8%（軽減税率） |

### プリセット追加の手順

```bash
# 1. プリセットディレクトリを作成
mkdir -p presets/accounting/your-preset-name

# 2. preset.json を作成（上記の構造を参考に）

# 3. テストを実行して通ることを確認
npm test

# 4. ドライランで投入内容を確認
fdk dry-run accounting/your-preset-name

# 5. PR を送る
```

### プリセットのリクエスト

業種・シナリオのリクエストは [New Preset Request](https://github.com/tackeyy/freee-demo-kit/issues/new?template=preset_request.yml) から。

---

## 💻 Development Setup

### Prerequisites

- Node.js 20+
- freee developer account（サンドボックス事業所が必要）

### Setup Steps

```bash
# 1. リポジトリをフォーク・クローン
git clone https://github.com/YOUR_USERNAME/freee-demo-kit.git
cd freee-demo-kit

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env に freee アプリの CLIENT_ID / CLIENT_SECRET を記入

# 4. テストを実行
npm test

# 5. ビルド
npm run build

# 6. CLI をローカルで試す
node dist/cli.js --help
```

## 📐 Coding Standards

- **strict TypeScript** モード（設定済み）
- `const` を優先、`var` は使わない
- `any` 型は避ける（必要なら `unknown`）
- 既存のコードスタイルに合わせる

### Commit Convention

```
feat:     新機能
fix:      バグ修正
test:     テスト追加・修正
docs:     ドキュメント変更
refactor: リファクタリング
chore:    メンテナンス（依存関係更新等）
```

## 🧪 Testing Requirements

**全てのコード変更にはテストが必要です。**

```bash
npm test           # 全テスト実行
npm run test:watch # ウォッチモード
```

- TDD（Red → Green → Refactor）で進める
- 新プリセット追加時は `tests/unit/no-real-names.test.ts` が自動でスキャンする
- 詳細は [docs/TESTING.md](docs/TESTING.md) を参照

## 📝 Submitting Changes

1. ブランチを作成: `git checkout -b feat/your-feature`
2. 変更を加えてテストを通す: `npm test`
3. コミット: `git commit -m "feat: add ..."`
4. PR を作成（テンプレートに沿って記入）

### PR Requirements

- ✅ `npm test` 全件パス
- ✅ `npm run build` 成功
- ✅ テスト追加済み（コード変更の場合）
- ✅ ドキュメント更新済み（必要な場合）

## 👀 Code Review Process

レビュアーは以下を確認します:

- ✅ **動作**: 意図した通りに動くか
- ✅ **テスト**: 網羅的でパスしているか
- ✅ **コード品質**: 読みやすく保守しやすいか
- ✅ **セキュリティ**: 実在名混入・パストラバーサルがないか

## 🤝 Community Guidelines

- 全ての貢献者を敬い歓迎する
- [Code of Conduct](CODE_OF_CONDUCT.md) に従う
- 建設的なフィードバックを提供する

## 📬 Getting Help

- 💬 **質問**: [GitHub Discussions](https://github.com/tackeyy/freee-demo-kit/discussions)
- 🐛 **バグ報告**: [Bug Report](https://github.com/tackeyy/freee-demo-kit/issues/new?template=bug_report.yml)
- 💡 **機能リクエスト**: [Feature Request](https://github.com/tackeyy/freee-demo-kit/issues/new?template=feature_request.yml)
- 📋 **プリセットリクエスト**: [New Preset Request](https://github.com/tackeyy/freee-demo-kit/issues/new?template=preset_request.yml)

## 🙌 Recognition

全ての貢献者は GitHub Contributors ページとリリースノートで紹介されます。

---

Thank you for contributing to freee-demo-kit! 🎉
