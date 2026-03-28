# Presets

freee-demo-kit のプリセットは、freee サンドボックス事業所に投入するデモデータのセットです。

## カテゴリ

| ディレクトリ | 説明 | 実装状況 |
|------------|------|---------|
| `accounting/` | 会計（取引・仕訳・口座） | v1.0 実装対象 |
| `invoices/` | 請求書 | 将来実装 |
| `expenses/` | 経費精算 | 将来実装 |
| `hr/` | 人事労務 | 将来実装 |
| `advanced/multi-period/` | 複数期間（財務DD向け） | 将来実装 |
| `advanced/multi-company/` | 複数事業所 | 将来実装 |

## プリセット仕様

各プリセットは以下の JSON 構造に従います:

```json
{
  "name": "quickstart",
  "description": "Basic accounting demo data",
  "category": "accounting",
  "version": "1.0.0",
  "resources": [
    { "type": "deals", "file": "deals.json", "count": 10 },
    { "type": "manual_journals", "file": "journals.json", "count": 5 }
  ]
}
```

## リソースタイプ

| type | 説明 |
|------|------|
| `deals` | 取引（売上・仕入） |
| `manual_journals` | 手動仕訳 |
| `walletables` | 口座・クレジットカード |
| `account_items` | 勘定科目 |
| `partners` | 取引先 |
