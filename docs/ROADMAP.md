# ロードマップ

## Phase 0（完了）
CLIスタブ・プロジェクト初期化

## Phase 1（完了）
- `fdk auth` — freee OAuth2 PKCE 認証
- `fdk whoami` — 認証ユーザー情報表示
- `fdk list` — プリセット一覧
- トークン管理（chmod 600）
- preset 引数バリデーション（パストラバーサル防止）

## Phase 2（完了）
- `fdk load <preset>` — プリセットデータ投入
- `fdk dry-run <preset>` — 投入内容プレビュー
- `fdk reset [preset]` — 投入データ削除
- `fdk validate [preset]` — preset.json スキーマ検証・貸借確認
- `fdk verify <preset>` — 投入後の期待値突合（CI/CD対応）
- `fdk load-all` — 全プリセット一括投入
- `accounting/quickstart` プリセット（取引50件・口座3件・仕訳5件）

## Phase 3（一部完了）

### 完了済み
- `fdk status` — 投入済みプリセット一覧と件数表示
- `invoices/quickstart` プリセット（取引20件・口座2件・仕訳6件）
- `expenses/quickstart` プリセット（取引24件・口座2件・仕訳3件）
- `hr/quickstart` プリセット（取引15件・口座1件・仕訳9件）
- 実名混入防止テスト（`tests/unit/no-real-names.test.ts`、ブロックリスト25件）

### 将来実装予定（未着手）

#### fdk preview（ローカル Web ビューア）
```
$ fdk preview
🌐 http://localhost:3001 を開いています...
Ctrl+C で終了
```

- Node.js の `http` モジュールのみ使用（追加依存なし）
- freee API から口座・取引・試算表を取得して HTML 表形式で表示
- スタイルはインライン CSS（外部 CSS 不要）
- ページ構成: 概要サマリー / 口座一覧 / 取引一覧（最新 20 件）/ 試算表 PL

#### その他（候補）
- `fdk export` — 本番データを匿名化してプリセット化
- `advanced/multi-period/` プリセット — 複数期・財務DD用
- `advanced/multi-company/` プリセット — 複数事業所・事業譲渡シナリオ
