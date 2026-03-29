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

## Phase 3（完了）

- `fdk status` — 投入済みプリセット一覧と件数表示
- `invoices/quickstart` プリセット（取引22件・口座2件・仕訳6件）
- `expenses/quickstart` プリセット（取引24件・口座2件・仕訳3件）
- `hr/quickstart` プリセット（取引15件・口座1件・仕訳9件）
- 実名混入防止テスト（`tests/unit/no-real-names.test.ts`、ブロックリスト25件）
- プリセットデータのリアリティ向上（会社名の日本語化・売上変動・経費バリエーション）

## Phase 4（完了）

### 会計・税務バリデーション
- `fdk validate --accounting` — 会計・税務ルールチェック
  - OFFICER-PAY-001: 役員報酬の科目チェック（取締役・役員の給料手当誤計上を検出）
  - TAX-CODE-001: 税区分整合性チェック（売上高/外注費/給料手当等の税区分を検証）
  - ENTERTAINMENT-001: 交際費月次上限警告（¥667,000/月超過を検出）
- `ErrorManifestItem` 型追加（`error_manifest` フィールドでエラーの意図を明記）

### エラーインジェクション・プリセット（トレーニング用）
- `errors/officer-pay` — 役員報酬誤計上（OFFICER-PAY-001）
- `errors/tax-code` — 税区分誤り（TAX-CODE-001）
- `errors/entertainment` — 交際費上限超過（ENTERTAINMENT-001）
- `errors/mixed` — 複合エラー（上級トレーニング用）

## Phase 5（完了）

### 業種別プリセット追加
- `accounting/full-year` — 12ヶ月分・異常値パターン付き（月次レビュー・データ分析デモ用）
- `accounting/restaurant` — 飲食業・軽減税率仕入（食材8%・酒類10%分岐）
- `accounting/construction` — 建設業・完成工事高・外注費3分法・未成工事仕掛計上
- `unclassified/quickstart` — 銀行明細インポート直後を再現（全費用を「雑費」で仮計上）

### セットアップウィザード
- `fdk setup` — 対話式ウィザード（認証情報入力 → OAuth 認証 → プリセット選択 → 投入を3ステップで完結）
- `@clack/prompts` によるスピナー・進捗表示・プリセット選択 UI
- `env-writer.ts` — `.env` 読み書きユーティリティ
- `auth-flow.ts` — OAuth PKCE フローを抽出（`auth.ts` と `setup.ts` で共有）
- `runLoad()` 関数エクスポート（進捗コールバック対応）

## Phase 6（将来実装予定）

#### fdk corrupt（エラーインジェクション動的生成）
```
$ fdk corrupt accounting/quickstart --rules officer-pay,tax-code
```

- 既存の正しいプリセットを読み込み、指定ルールのエラーパターンを動的に差し込んだ「破損版」を生成
- 正解データと誤りデータのペアを同一コンテキストで生成できる
- `error_manifest` を自動生成してどこをどう壊したか記録

#### その他（候補）
- `fdk export` — 本番データを匿名化してプリセット化
- `advanced/multi-period/` プリセット — 複数期・財務DD用
- `advanced/multi-company/` プリセット — 複数事業所・事業譲渡シナリオ
