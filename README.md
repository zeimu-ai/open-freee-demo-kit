# freee-demo-kit

[![npm version](https://img.shields.io/npm/v/freee-demo-kit.svg)](https://www.npmjs.com/package/freee-demo-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

freee サンドボックス事業所に、対話式ウィザードでデモデータを一括投入するOSS CLIツール。

---

## はじめかた

### ステップ 1 — Node.js のインストール

[Node.js 公式サイト](https://nodejs.org/ja/) から **v20 以上** をインストールしてください。

```bash
node --version
# v20.x.x 以上が表示されれば OK
```

### ステップ 2 — freee アプリの作成

freee-demo-kit は freee の OAuth アプリ認証情報（Client ID / Client Secret）を使って API にアクセスします。

1. [freee Developers Console](https://app.freee.co.jp/developers) を開き、「新しいアプリを作成」をクリック

2. 以下のように入力して作成：

   | 項目 | 値 |
   |------|---|
   | アプリ名 | （任意）例: `freee-demo-kit` |
   | アプリ種別 | **プライベートアプリ** |
   | コールバック URL | **`http://localhost:8080/callback`** |

   > ⚠️ コールバック URL が違うと認証が失敗します。必ず `http://localhost:8080/callback` を入力してください。

3. 作成後に表示される **Client ID** と **Client Secret** を控えておきます（Client Secret は一度しか表示されません）

### ステップ 3 — インストール & セットアップ

```bash
npm install -g freee-demo-kit
fdk setup
```

`fdk setup` を実行すると、対話式ウィザードが起動します。

```
  freee demo kit  Sandbox セットアップウィザード

◇ はじめよう！3ステップでデモデータを投入します

  ┌─ Step 1/3  認証情報の設定 ─────────────────────┐
  │ freee Developers Console でアプリを作成してください │
  └────────────────────────────────────────────────┘
◆ Client ID を入力してください
◆ Client Secret を入力してください
  ✅ .env を作成しました

  ┌─ Step 2/3  freee 認証 ──────────────────────────┐
  ⠋ ブラウザで認証中...
  ✅ 認証成功: 山田 太郎
  └────────────────────────────────────────────────┘

  ┌─ Step 3/3  プリセット選択 ──────────────────────┐
  ❯ accounting/quickstart  — 架空ITサービス業・3ヶ月分
    accounting/restaurant  — 架空居酒屋・飲食業
    invoices/quickstart    — 請求書・売掛金管理
    ...
  └────────────────────────────────────────────────┘
  ⠋ 取引を投入中 (23/52)...
  ✅ 投入完了！

  🎊 accounting/quickstart のデモデータを投入しました！
     📊 口座   3 件
     💰 取引  52 件
     📝 仕訳   5 件
```

---

## 認証画面について

freee ログイン後、以下のような画面が表示されます：

![freee認証画面](docs/images/freee-oauth-screen.png)

アカウント内の全事業所が表示されますが、これは freee の仕様です。「許可する」をクリックして問題ありません。
**実際にデータが書き込まれる事業所は `fdk whoami` で確認・切り替えできます。**

---

## 税理士・会計事務所の方へ

顧問先のサンドボックス事業所でデモをする場合、**アプリは顧問先ではなくご自身の事務所アカウントで作成**してください。

> ⚠️ 顧問先事業所（アドバイザーとして招待された事業所）ではアプリを作成できません。

ステップ 2 のアプリ作成を**事務所アカウント**で行った後、`fdk setup` を実行してください。
ログイン後の事業所選択画面で、デモを行いたい**顧問先のサンドボックス事業所**を選択します。

---

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `fdk setup` | **対話式ウィザード**（初回セットアップはこれ一択） |
| `fdk auth` | freee OAuth ログイン（ブラウザ起動） |
| `fdk auth --status` | 認証状態・トークン有効期限確認 |
| `fdk auth --logout` | トークン削除 |
| `fdk whoami` | 認証済みユーザー・事業所情報表示 |
| `fdk list` | 利用可能なプリセット一覧 |
| `fdk status` | 投入済みプリセット一覧と件数を表示 |
| `fdk load <preset>` | 指定プリセットのデータを投入 |
| `fdk load <preset> --dry-run` | 投入シミュレーション（変更なし） |
| `fdk load <preset> --force` | 投入済みでも上書き投入 |
| `fdk load <preset> --yes` | 確認プロンプトをスキップ（自動化向け） |
| `fdk load-all` | 全プリセット一括投入 |
| `fdk reset` | 全デモデータを削除 |
| `fdk reset <preset>` | 指定プリセットのデータのみ削除 |
| `fdk validate` | 全プリセット JSON のスキーマ・貸借検証 |
| `fdk validate <preset>` | 指定プリセットのみ検証 |
| `fdk validate --accounting` | 会計・税務ルール検証（役員報酬・税区分・交際費） |
| `fdk verify <preset>` | 投入データを freee API で突合確認（CI/CD 対応） |
| `fdk corrupt <preset>` | 指定プリセットに会計エラーを注入した破損版を生成 |
| `fdk corrupt <preset> --rules officer-pay,tax-code` | 注入するエラールールを指定 |
| `fdk corrupt <preset> --output path/to/out.json` | 破損プリセットをファイルに出力 |
| `fdk corrupt <preset> --dry-run` | 注入内容の確認（変更なし） |

---

## プリセット一覧

### 通常プリセット

| プリセット | 内容 | 口座 | 取引 | 仕訳 |
|-----------|------|:----:|:----:|:----:|
| `accounting/quickstart` | 架空ITサービス業・3ヶ月分の会計データ | 3 | 52 | 5 |
| `accounting/full-year` | 架空ITサービス業・12ヶ月分・異常値パターン付き | 3 | 98 | 12 |
| `accounting/restaurant` | 架空居酒屋・食材仕入の軽減税率（8%）と酒類（10%）を分岐 | 2 | 35 | 6 |
| `accounting/construction` | 架空外装工事業・完成工事高・外注費3分法 | 2 | 30 | 6 |
| `invoices/quickstart` | 請求書・売掛金管理（入金消込フロー含む） | 2 | 22 | 6 |
| `expenses/quickstart` | 経費精算（交通費・接待費・消耗品費・通信費） | 2 | 24 | 3 |
| `hr/quickstart` | 給与・人事（基本給・残業代・社会保険・源泉税） | 1 | 15 | 9 |
| `unclassified/quickstart` | 銀行明細インポート直後を再現（全費用を「雑費」で仮計上） | 1 | 20 | 0 |

### エラーインジェクション・プリセット

意図的に会計・税務上の誤りを含むデータセットです。`fdk validate --accounting` で検出できます。

| プリセット | 混入エラー | 検出ルール |
|-----------|-----------|-----------|
| `errors/officer-pay` | 役員報酬を「給料手当」で誤計上 | OFFICER-PAY-001 |
| `errors/tax-code` | 売上高・外注費・給料手当の税区分誤り | TAX-CODE-001 |
| `errors/entertainment` | 交際費の月次上限（¥667,000）超過 | ENTERTAINMENT-001 |
| `errors/mixed` | 上記3種の複合エラー | 全ルール |

プリセットの仕様・カスタムプリセットの作り方は [`presets/README.md`](presets/README.md) を参照してください。

---

## 会計・税務バリデーション

`fdk validate --accounting` で以下のルールをチェックします。

| ルールID | 内容 | 深刻度 |
|---------|------|:------:|
| `OFFICER-PAY-001` | 役員（取締役・監査役等）の取引に「給料手当」が使われていないか | ERROR |
| `TAX-CODE-001` | 勘定科目ごとの許容税区分と不一致（売上高: 21/13、外注費: 34/18 等） | ERROR |
| `ENTERTAINMENT-001` | 交際費の月合計が ¥667,000 を超過 | WARNING |

```bash
fdk validate --accounting          # 全プリセットを検証
fdk validate errors/mixed --accounting  # 特定プリセットのみ
```

---

## コントリビューション

コントリビューションを歓迎します。[CONTRIBUTING.md](CONTRIBUTING.md) をお読みください。

```bash
git clone https://github.com/tackeyy/freee-demo-kit.git
cd freee-demo-kit
npm install
npm test
```

---

## よくあるエラーと解決方法

### `fdk auth` / `fdk setup` 後のブラウザに「必須パラメータが不足しているか...」と表示される

**原因：** freee アプリのコールバック URL が正しく設定されていません。

**解決方法：**
1. [freee Developers Console](https://app.secure.freee.co.jp/developers/applications) を開く
2. 該当アプリをクリックして編集画面を開く
3. コールバック URL を `http://localhost:8080/callback` に変更して保存する
4. `fdk setup` または `fdk auth` を再実行する

---

## ライセンス

[MIT](LICENSE)
