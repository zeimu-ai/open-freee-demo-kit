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

---

## セットアップ

### ステップ1：Node.js のインストール

[Node.js 公式サイト](https://nodejs.org/ja/) から **v20以上** をインストールしてください。

インストール後、ターミナルで以下を実行してバージョンを確認します。

```bash
node --version
# v20.x.x 以上が表示されればOK
```

---

### ステップ2：freee アプリの作成（Client ID / Client Secret の取得）

freee-demo-kit を使うには、freee のアプリ認証情報が必要です。

1. **freee Developers Console** にアクセス
   → [https://app.freee.co.jp/developers](https://app.freee.co.jp/developers)

2. 「**新しいアプリを作成**」をクリック

3. 以下のように入力します：

   | 項目 | 入力値 |
   |------|--------|
   | アプリ名 | （任意）例：`freee-demo-kit` |
   | アプリ種別 | **プライベートアプリ** |
   | コールバック URL | `http://localhost:8080/callback` |

   > **⚠️ コールバック URL は必ず `http://localhost:8080/callback` と入力してください。**
   > 別の URL（freee のチュートリアルページ等）が設定されていると、`fdk auth` 実行時に「必須パラメータが不足しているか...」というエラーが表示されて認証できません。

4. 作成後に表示される **Client ID** と **Client Secret** を控えておきます

> **⚠️ 注意：** Client Secret は作成時にしか表示されません。必ずメモしてください。

---

### ステップ3：認証情報を設定する

**プロジェクトフォルダ**に `.env` ファイルを作成し、先ほどのClient ID / Client Secretを入力します。

```bash
# .env.example をコピーして .env を作成
cp .env.example .env
```

テキストエディタで `.env` を開き、以下のように書き換えます：

```
FREEE_CLIENT_ID=ここにClient IDを貼り付けてください
FREEE_CLIENT_SECRET=ここにClient Secretを貼り付けてください
```

> **💡 ヒント：** `.env` ファイルは `.gitignore` に登録済みのため、Gitにコミットされません。認証情報が外部に漏れる心配はありません。

---

### ステップ4：freee-demo-kit のインストール

```bash
npm install -g freee-demo-kit
```

---

### ステップ5：認証する

```bash
fdk auth
```

ブラウザが開きます。freee アカウントでログインしてください。
ターミナルに「✅ Authenticated as: ...」と表示されれば認証完了です。

> **💡 認証画面について（よくある疑問）**
>
> ログイン後、以下のような画面が表示されます：
>
> ![freee認証画面](docs/images/freee-oauth-screen.png)
>
> freee の仕様上、アカウント内の全事業所がまとめて表示され、個別に外すことはできません。
> これは正常な表示です。「許可する」をクリックして問題ありません。
> **実際にデータが書き込まれる事業所は、`fdk whoami` で確認・切り替えができます。**

---

### ステップ6：デモデータを投入する

```bash
fdk list                          # 利用可能なプリセット一覧を確認
fdk load accounting/quickstart    # デモデータを投入
```

---

## 税理士・会計事務所の方へ（freee パートナー）

税理士先生が顧問先のサンドボックス事業所でデモをする場合、**アプリは顧問先事業所ではなく、ご自身の事務所アカウントで作成する必要があります。**

### パートナー向けセットアップ手順

#### ステップ1〜2 は一般ユーザーと同じです

Node.js のインストールと freee アプリの作成は上記の手順と同じです。
ただし、アプリ作成は**ご自身の事務所アカウント（自社事業所）** で行ってください。

> **⚠️ 顧問先事業所のアカウントでアプリを作成しないでください。**
> 顧問先事業所（アドバイザーとして招待された事業所）ではアプリを作成できません。

#### ステップ3：認証情報を設定する（一般ユーザーと同じ）

`.env` ファイルに Client ID / Client Secret を入力してください。

#### ステップ4：freee-demo-kit をインストール（一般ユーザーと同じ）

```bash
npm install -g freee-demo-kit
```

#### ステップ5：認証する

```bash
fdk auth
```

ブラウザが開きます。**事務所アカウント**でログインしてください。

> **💡 ヒント：** ログイン後に事業所を選択する画面が表示されます。
> デモを行いたい**顧問先のサンドボックス事業所**を選択してください。

#### ステップ6：デモデータを投入する

```bash
fdk load accounting/quickstart
```

---

## クイックスタート（エンジニア向け）

```bash
npm install -g freee-demo-kit
fdk auth          # freeeアカウントでOAuth認証
fdk list          # 利用可能なプリセット一覧
fdk load accounting/quickstart  # デモデータを投入
fdk reset         # デモデータを全削除
```

---

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
| `fdk verify <preset>` | 投入データをfreee APIで突合確認（CI/CD対応） |
| `fdk status` | 投入済みプリセット一覧と件数を表示 |

## プリセット一覧

| プリセット | 内容 | 状態 |
|-----------|------|------|
| `accounting/quickstart` | ✅ 取引50件・口座3件・仕訳5件 | 利用可能 |
| `invoices/quickstart` | ✅ 取引20件・口座2件・仕訳6件（請求書・売掛金） | 利用可能 |
| `expenses/quickstart` | ✅ 取引24件・口座2件・仕訳3件（経費精算） | 利用可能 |
| `hr/quickstart` | ✅ 取引15件・口座1件・仕訳9件（給与・人事） | 利用可能 |
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

## よくあるエラーと解決方法（FAQ）

### `fdk auth` 実行後のブラウザに「必須パラメータが不足しているか、サポートされていないパラメータが含まれているか、もしくはパラメータが不正であるため、リクエストを処理できませんでした。」と表示される

**原因：** freee アプリのコールバック URL が正しく設定されていません。

**解決方法：**
1. [freee Developers Console](https://app.secure.freee.co.jp/developers/applications) を開く
2. 該当アプリをクリックして編集画面を開く
3. コールバック URL を以下に変更して保存する：
   ```
   http://localhost:8080/callback
   ```
4. `fdk auth` を再実行する

---

## ライセンス

[MIT](LICENSE)
