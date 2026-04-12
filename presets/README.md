# Presets

freee-demo-kit のプリセットは、freee サンドボックス事業所に投入するデモデータのセットです。

---

## 利用可能なプリセット

> まずは `accounting/office-demo` を選べば十分です。`accounting/quickstart` と `expenses/quickstart` は個別機能を試したい場合に使ってください。
> 同じ事業所に `office-demo` と分離版を重ねて入れると、売上・経費・仕訳が重複します。

### 通常プリセット

| プリセット | 概要 | 口座 | 取引 | 仕訳 |
|-----------|------|:----:|:----:|:----:|
| `accounting/office-demo` | 会計+経費の統合版・初回体験向け（売上・外注・給与・社員立替・証憑3件・固定資産購入・未払費用振替） | 3 | 77 | 15 |
| `accounting/accounting-office` | 税理士事務所デモ・複数顧問先の顧問料/記帳代行/前受顧問料/決算申告/年末調整を再現 | 2 | 24 | 6 |
| `accounting/quickstart` | 架空ITサービス業・3ヶ月分の会計データ（売上・外注・給与・経費） | 3 | 52 | 11 |
| `accounting/full-year` | 架空ITサービス業・12ヶ月分・異常値パターン付き（月次レビュー・データ分析デモ用） | 3 | 101 | 13 |
| `accounting/restaurant` | 架空居酒屋・飲食業・軽減税率仕入（食材8%・酒類10%）・季節変動 | 2 | 35 | 6 |
| `accounting/construction` | 架空外装工事業・建設業・完成工事高・外注費3分法・未成工事仕掛計上 | 2 | 30 | 6 |
| `accounting/sole-proprietor` | 架空フリーランス（個人事業主）・事業主報酬・専従者対応 | 2 | 20 | 6 |
| `accounting/medical` | 架空内科クリニック・保険診療（非課税）と自費診療（課税）の混在 | 2 | 24 | 6 |
| `accounting/real-estate` | 架空不動産賃貸業・居住用（非課税）と事務所（課税）の混在 | 2 | 24 | 6 |
| `accounting/retail` | 架空雑貨小売店・商品仕入・棚卸・月次在庫調整 | 3 | 30 | 6 |
| `accounting/ecommerce-marketplace` | 架空EC事業・Amazon/楽天/Shopify の手数料差引入金、配送費、返品返金、広告費、梱包資材、棚卸資産評価損 | 3 | 30 | 7 |
| `accounting/it-startup` | 架空SaaS企業・サブスク収益・ソフトウェア資産計上・前受収益 | 2 | 21 | 9 |
| `accounting/non-profit` | 架空NPO法人・収益事業（課税）と非収益事業（非課税）の区分管理 | 1 | 18 | 6 |
| `accounting/manufacturing` | 架空製造業・材料費・労務費・製造間接費・仕掛品・製品勘定 | 2 | 30 | 9 |
| `accounting/payroll-agency` | 社労士・給与計算代行・顧問料収入・社会保険料預り金処理 | 2 | 27 | 6 |
| `accounting/npo-subsidy` | 補助金受給NPO法人・交付決定→入金→精算・前受金・会費収入 | 2 | 24 | 6 |
| `accounting/freelance-invoice` | インボイス制度対応フリーランス・登録番号あり/なし混在・源泉徴収 | 2 | 24 | 6 |
| `accounting/cross-border-saas` | 架空B2B SaaS企業・輸出売上・USD外貨預金・海外クラウド費用・海外広告費・為替差損益 | 3 | 25 | 7 |
| `invoices/quickstart` | 請求書・売掛金管理（入金消込・貸倒引当金フロー含む） | 2 | 22 | 6 |
| `invoices/subscription` | SaaS月次サブスクリプション・年次一括・前受収益の月次振替 | 2 | 24 | 6 |
| `expenses/quickstart` | 経費精算（交通費・接待費・消耗品費・通信費） | 2 | 24 | 3 |
| `hr/quickstart` | 給与・人事（基本給・残業代・社会保険料・源泉所得税） | 1 | 34 | 20 |
| `unclassified/quickstart` | 銀行明細インポート直後を再現・勘定科目分類の演習・検証用（全費用を「雑費」で仮計上） | 1 | 20 | 0 |
| `common/depreciation` | 固定資産・月次減価償却（PC・サーバー・エアコン） | 2 | 18 | 9 |
| `advanced/multi-period` | 複数期比較・前期繰越残高・期首仕訳（財務DD・年度比較デモ用） | 3 | 32 | 9 |
| `advanced/multi-company` | グループ会社・親子会社間取引・連結消去仕訳（M&A PMI デモ用） | 4 | 36 | 6 |

### エラーインジェクション・プリセット

意図的に会計・税務上の誤りを含むデータセット。`fdk validate --accounting` で検出できます。

| プリセット | 混入エラー | 検出ルール |
|-----------|-----------|-----------|
| `errors/officer-pay` | 役員報酬を「給料手当」で誤計上（3件） | OFFICER-PAY-001 |
| `errors/tax-code` | 売上高・外注費・給料手当の税区分誤り（12件） | TAX-CODE-001 |
| `errors/entertainment` | 交際費の月次上限（¥667,000）超過（2ヶ月） | ENTERTAINMENT-001 |
| `errors/mixed` | 上記3種の複合エラー（上級トレーニング用） | 全ルール |
| `errors/consumption-tax` | インボイス未登録業者の控除過大・軽減税率/非課税の誤適用 | TAX-CODE-001 |
| `errors/year-end-closing` | 翌期売上の前倒し計上・前払費用の誤処理・未払費用計上漏れ・仮勘定未振替 | PERIOD-001/002, ACCRUAL-001, SUSPENSE-001 |
| `errors/depreciation-method` | 償却方法誤り（定額↔定率）・耐用年数誤適用・少額減価償却特例の誤適用 | DEPRECIATION-001/002/003 |
| `errors/overdue-receivable` | 長期未回収売掛金・貸倒引当金未計上・法的貸倒の未処理・合意なし相殺 | RECEIVABLE-001/002/003 |
| `errors/duplicate-journal` | 同一取引の二重入力・自動仕訳と手動仕訳の重複・月次締め後の再計上 | DUPLICATE-001/002/003 |

---

## プリセットの JSON 構造

各プリセットは `preset.json` 1ファイルで完結します。

```json
{
  "name": "プリセット名",
  "description": "説明",
  "version": "1.0.0",
  "expected": {
    "walletables": 3,
    "deals": 52,
    "manualJournals": 5,
    "receipts": 2
  },
  "data": {
    "walletables": [...],
    "deals": [...],
    "manualJournals": [...],
    "receipts": [...]
  }
}
```

エラーインジェクション・プリセットは `error_manifest` フィールドを追加で持ちます。

```json
{
  "error_manifest": [
    {
      "rule": "OFFICER-PAY-001",
      "location": "deals[0] — partner_name: 代表取締役 佐藤 義雄",
      "description": "役員報酬を「給料手当」で計上している。",
      "expected_fix": "account_item_name を「役員報酬」に変更する"
    }
  ]
}
```

---

## フィールド仕様

### walletables（口座）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `type` | `"bank_account"` \| `"credit_card"` \| `"wallet"` \| `"other"` | ✅ | 口座種別 |
| `name` | string | ✅ | 口座名（freee 上で一意。既存口座と同名の場合は再利用） |
| `bank_id` | number | `bank_account`/`credit_card` の場合必須 | freee の金融機関ID |

### deals（取引）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `issue_date` | `"YYYY-MM-DD"` | ✅ | 発生日 |
| `type` | `"income"` \| `"expense"` | ✅ | 収入/支出 |
| `partner_name` | string | — | 取引先名（存在しない場合は自動作成） |
| `details` | array | ✅ | 明細（複数可） |
| `details[].account_item_name` | string | ✅ | 勘定科目名（freee デフォルト科目名を使用） |
| `details[].tax_code` | number | ✅ | 税区分コード（0:不課税, 21:課税売上10%, 22:輸出売上, 34:課税仕入10%） |
| `details[].amount` | number | ✅ | 金額（税込） |
| `details[].description` | string | — | 摘要 |

### manualJournals（手動仕訳）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `issue_date` | `"YYYY-MM-DD"` | ✅ | 仕訳日 |
| `details` | array | ✅ | 明細（借方・貸方で対になるように記述） |
| `details[].entry_side` | `"debit"` \| `"credit"` | ✅ | 借方/貸方 |
| `details[].account_item_name` | string | ✅ | 勘定科目名 |
| `details[].tax_code` | number | ✅ | 税区分コード |
| `details[].amount` | number | ✅ | 金額 |
| `details[].description` | string | — | 摘要 |

### receipts（証憑ファイル）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `filename` | string | ✅ | freee ファイルボックスに表示するファイル名 |
| `mimeType` | string | ✅ | MIME type（例: `image/png`, `application/pdf`） |
| `contentBase64` | string | ✅ | ファイル本体の Base64 文字列 |
| `description` | string | — | 証憑説明 |
| `receipt_metadatum_issue_date` | `"YYYY-MM-DD"` | — | 証憑の発行日 |
| `receipt_metadatum_amount` | number | — | 証憑金額 |
| `receipt_metadatum_partner_name` | string | — | 発行元・取引先名 |

---

## よく使う税区分コード

| tax_code | 名称 | 主な用途 |
|:--------:|------|---------|
| `0` | 不課税 | 給与・社会保険料・売掛金回収・振替仕訳 |
| `21` | 課税売上10% | 売上高（消費税課税） |
| `22` | 輸出売上 | 海外顧客向けSaaS売上・輸出免税売上 |
| `13` | 課税売上8%（軽減） | 飲食品等の売上 |
| `34` | 課税仕入10% | 外注費・消耗品費・交際費・通信費等 |
| `18` | 課税仕入8%（軽減） | 軽減税率対象の仕入 |

---

## カスタムプリセットの作り方

1. `presets/<カテゴリ>/<名前>/` ディレクトリを作成
2. `preset.json` を上記の仕様に従って作成
3. `fdk validate <カテゴリ>/<名前>` でバリデーション
4. `fdk validate <カテゴリ>/<名前> --accounting` で会計・税務チェック
5. `fdk load <カテゴリ>/<名前> --dry-run` で内容を確認
6. `fdk load <カテゴリ>/<名前>` で投入

### バリデーション内容

`fdk validate` は以下をチェックします：

- **スキーマ**: 必須フィールドの存在確認
- **件数整合**: `expected` の件数と `data` の実際の件数が一致するか
- **貸借バランス**: 手動仕訳の借方合計 = 貸方合計

`fdk validate --accounting` は追加で以下をチェックします：

| ルールID | 内容 | 深刻度 |
|---------|------|:------:|
| `OFFICER-PAY-001` | 役員（取締役・監査役等）の取引に「給料手当」が使われていないか | ERROR |
| `TAX-CODE-001` | 勘定科目ごとの許容税区分と不一致がないか | ERROR |
| `ENTERTAINMENT-001` | 交際費の月合計が ¥667,000 を超過していないか | WARNING |

---

## 命名規則

プリセットのデータはすべて**架空の企業・人物名**を使用します。

- 実在する企業名・金融機関名・個人名を使用しないでください
- `fdk validate` に含まれるブロックリストチェックで検出されます
- ブロックリストの仕様: `tests/unit/no-real-names.test.ts` を参照

### 架空名のガイドライン

- 銀行: 「○○信用銀行」「○○銀行」（実在しない組み合わせ）
- 企業: 「株式会社○○システムズ」「○○産業株式会社」等
- 個人: 「社員 ○○」「代表取締役 ○○ ○○」等（役職 + 姓 + 名）
- 勘定科目の文字は含めない（例：「田中」は勘定科目テストのブロックワードに該当）
