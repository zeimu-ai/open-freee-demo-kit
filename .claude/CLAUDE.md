# freee-demo-kit プロジェクト固有ルール

## ドキュメントとコードの同期ルール（最重要）

**README.md および presets/README.md は、コードと常に一致している必要がある。**

以下を変更した際は、必ずドキュメントも同じコミットまたは直後のコミットで更新すること:

| 変更内容 | 更新が必要なドキュメント |
|---------|----------------------|
| コマンド追加・オプション追加 | `README.md` のコマンド一覧 |
| プリセット追加・件数変更 | `README.md` のプリセット一覧、`presets/README.md` |
| バリデーションルール追加 | `README.md` の会計・税務バリデーション表 |
| preset.json のスキーマ変更 | `presets/README.md` のフィールド仕様 |
| 新しいプリセットカテゴリ追加 | `presets/README.md` のカテゴリ表 |

### 具体的な確認方法

コードを変更したら以下を自問すること:
- README のコマンド一覧に過不足はないか？
- プリセット一覧の件数（口座・取引・仕訳）は最新か？
- 新しいプリセットが表に追加されているか？

---

## プロジェクト概要

freee サンドボックス事業所にデモデータを投入するOSS CLIツール。

- **対象ユーザー**: freee 営業・税理士・会計士・開発者
- **主なユースケース**: デモ・研修・データ生成
- **安全設計**: 本番事業所への誤投入を防ぐ確認プロンプト必須

---

## アーキテクチャ

```
src/
  cli.ts               — エントリポイント
  commands/            — 各コマンド実装
    setup.ts           — 対話式セットアップウィザード（@clack/prompts）
    auth.ts / load.ts / reset.ts / validate.ts / verify.ts / status.ts
  utils/
    freee-api.ts        — freee REST API クライアント
    preset-loader.ts    — preset.json 読み込み・スキーマ検証
    preset-validator.ts — パストラバーサル防止
    token-store.ts      — トークン管理（~/.config/fdk/tokens.json）
    state-store.ts      — 投入状態管理（~/.config/fdk/state/）
    accounting-validator.ts — 会計・税務バリデーション
    auth-flow.ts        — OAuth PKCE フロー（auth.ts と setup.ts から共有）
    env-writer.ts       — .env 読み書きユーティリティ（setup で使用）
    confirm-company.ts  — 本番誤投入防止の確認プロンプト
  types/freee.ts        — 型定義

presets/
  accounting/quickstart/preset.json
  invoices/quickstart/preset.json
  expenses/quickstart/preset.json
  hr/quickstart/preset.json
  errors/{officer-pay,tax-code,entertainment,mixed}/preset.json

tests/unit/            — vitest 単体テスト
```

---

## プリセット件数（現在）

| プリセット | 口座 | 取引 | 仕訳 |
|-----------|:----:|:----:|:----:|
| accounting/quickstart | 3 | 52 | 11 |
| accounting/full-year | 3 | 98 | 12 |
| accounting/restaurant | 2 | 35 | 6 |
| accounting/construction | 2 | 30 | 6 |
| invoices/quickstart | 2 | 22 | 6 |
| expenses/quickstart | 2 | 24 | 3 |
| hr/quickstart | 1 | 34 | 20 |
| unclassified/quickstart | 1 | 20 | 0 |
| errors/officer-pay | 1 | 6 | 3 |
| errors/tax-code | 2 | 9 | 3 |
| errors/entertainment | 1 | 9 | 0 |
| errors/mixed | 2 | 12 | 3 |
| errors/consumption-tax | 1 | 9 | 3 |

**⚠️ プリセットを変更したらこの表も更新する。**

---

## 開発ルール

### 安全性
- `fdk load` / `fdk reset` は必ず会社確認プロンプトを経由する（`confirmCompany`）
- 本番事業所（M&Aナビ等）のIDが混入していないか随時確認する
- `.env` / `tokens.json` / `dist/` は `.gitignore` 済み。コミットしない

### テスト
- 実装は必ず TDD（Red → Green → Refactor）で進める
- `npm test` で全テストがパスすること（現在 167 テスト）
- `tests/unit/no-real-names.test.ts` のブロックリストに引っかかる名前をプリセットに入れない

### プリセットデータの命名
- 架空の企業・人物名のみ使用（実在名禁止）
- ブロックリストは `tests/unit/no-real-names.test.ts` を参照

### freee API
- `bank_account` / `credit_card` タイプの walletable には `bank_id` 必須
- 勘定科目名は freee デフォルト名を使う（`給料賃金` ではなく `給料手当` など）
- deleteWalletable の URL: `/api/1/walletables/{type}/{id}`

---

## バリデーションルール（accounting-validator.ts）

| ルールID | 説明 |
|---------|------|
| OFFICER-PAY-001 | deals で 取締役・役員・監査役 + 給料手当 → error |
| TAX-CODE-001 | deals の税区分不整合 → error/warning（manualJournals の費用科目振替は除外） |
| ENTERTAINMENT-001 | deals の交際費月合計 > ¥667,000 → warning |

手動仕訳（manualJournals）では `外注費`・`交際費`・`地代家賃`・`諸会費` の tax_code チェックをスキップする。
月末未払計上仕訳では tax_code:0 が正当なため（二重計上防止）。
