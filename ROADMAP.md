# ROADMAP

このドキュメントは freee-demo-kit の実装状況と今後の計画を示します。

最終更新: 2026-04-12

---

## 現在のバージョン: v0.1.8（リリース済み）

---

## v0.1.x シリーズ — 実装済み

### v0.1.0（2026-03-31）

#### コマンド

- [x] `fdk setup` — 対話式ウィザード（OAuth 認証 + プリセット選択）
- [x] `fdk auth` — freee OAuth2 PKCE 認証
- [x] `fdk auth --status` / `--logout` — 認証状態確認・ログアウト
- [x] `fdk whoami` — 認証済みユーザー・事業所情報表示
- [x] `fdk load <preset>` — プリセットデータ投入（`--dry-run` / `--force` / `--yes` オプション）
- [x] `fdk load-all` — 全プリセット一括投入
- [x] `fdk reset [preset]` — 投入済みデータ削除
- [x] `fdk validate [preset]` — スキーマ検証 + 会計・税務ルールチェック
- [x] `fdk verify <preset>` — 投入後 CI/CD 突合確認
- [x] `fdk corrupt <preset>` — 会計エラー注入（トレーニング用）
- [x] `fdk status` — 投入済みプリセット状況表示
- [x] `fdk list` — 利用可能なプリセット一覧表示

#### 会計バリデーションルール

- [x] `OFFICER-PAY-001` — 役員報酬の給料手当誤計上検出
- [x] `TAX-CODE-001` — 勘定科目ごとの税区分不整合検出
- [x] `ENTERTAINMENT-001` — 交際費の月次上限（¥667,000）超過警告

#### プリセット（初期 20 件）

| カテゴリ | プリセット |
|---------|-----------|
| accounting | quickstart, full-year, restaurant, construction, it-startup, medical, non-profit, real-estate, retail, sole-proprietor |
| invoices | quickstart |
| expenses | quickstart |
| hr | quickstart |
| unclassified | quickstart |
| errors | officer-pay, tax-code, entertainment, mixed |
| advanced | multi-period, multi-company |
| common | depreciation |

#### セキュリティ

- [x] OAuth トークンのパーミッション制御（`chmod 600`）
- [x] パストラバーサル防止（プリセットファイル読み込み）
- [x] 実在名検出テスト（25 件のブロックリスト）
- [x] 書き込み操作前の確認プロンプト

---

### v0.1.1（2026-03-31）

- [x] `CONTRIBUTING.md` freee-demo-kit 向け全面書き直し
- [x] `preset_request.yml` Issue テンプレート追加
- [x] `package.json` keywords 拡張

---

### v0.1.2（2026-03-31）

- [x] プリセット追加: `errors/consumption-tax`（インボイス制度関連ミス）

---

### v0.1.3（2026-03-31）

- [x] プリセット追加: `accounting/freelance-invoice`（インボイス対応フリーランス）

---

### v0.1.4（2026-03-31）

- [x] プリセット追加 8 件:
  - `accounting/manufacturing`（製造業・原価計算）
  - `accounting/payroll-agency`（社労士・給与計算代行）
  - `accounting/npo-subsidy`（NPO・補助金受給団体）
  - `invoices/subscription`（SaaS 月次サブスク）
  - `errors/year-end-closing`（期末決算ミス）
  - `errors/depreciation-method`（減価償却ミス）
  - `errors/overdue-receivable`（売掛金回収遅延ミス）
  - `errors/duplicate-journal`（二重仕訳ミス）

---

### v0.1.5

- [x] freee デフォルト勘定科目名に合わせたプリセット修正（`bc9e516`）
- [x] NPO 不課税収入に `雑収入` 使用（`d6c99a3`）
- [x] リポジトリ URL を `zeimu-ai` org に更新（`3eeeed3`）
- [x] バージョニングルールリンク追加（README + CONTRIBUTING）
- [x] CLA（Contributor License Agreement）追加（`4f9137e`）
- [x] プリセット横断でのウォレット再利用 ID 追跡（安全なリセット対応）（`032f7a0`）

---

### v0.1.6

- [x] `fdk reset`（引数なし）で全データ一括削除（reset-all）（`2d7af72`）
- [x] README に Zeimu AI リンク・関連プロジェクトセクション追加（`8cc7ad2`）
- [x] `full-year` プリセットに交際費急増・売掛金ゼロ異常パターン追加（`595a798`）

---

### v0.1.7（2026-04-10）

- [x] プリセットへの `data.receipts[]` フィールド追加（証憑/領収書アップロード対応）
- [x] `expected.receipts` バリデーション・突合サポート
- [x] `fdk load` / `fdk reset` でのファイルボックス操作
- [x] `fdk status` / `fdk setup` での証憑件数表示
- [x] `expenses/quickstart` に証憑サンプル 3 件追加
- [x] 旧形式プリセット・state ファイルとの後方互換性確保

---

## Unreleased（コミット済み・未リリース）

### 統合プリセット（dev2 作業中: implement-demo-preset-merge-oss-001）

- [ ] `accounting/office-demo` 統合プリセット — 会計+経費の初回体験向け統合版（売上・外注・給与・社員立替・未払費用振替）
  - 未リリース（CHANGELOG [Unreleased] に記載）
  - dev2 が並行調整中のため、マージ・バージョンタグ付けは dev2 完了後

### ドキュメント整合の継続調整

- [ ] `accounting/office-demo` の件数・説明は dev3 の並行改修完了後に最終確認

---

## v0.2.x シリーズ（計画中）

### バリデーションルール拡充

現在 3 ルールのみ実装済み。README に記載のエラープリセットが参照する以下のルールは未実装:

- [ ] `PERIOD-001` / `PERIOD-002` — 期間帰属誤り（翌期売上の前倒し計上、前払費用未計上）
- [ ] `ACCRUAL-001` — 発生主義違反（未払費用の計上漏れ）
- [ ] `SUSPENSE-001` — 仮勘定の期末未振替
- [ ] `DEPRECIATION-001` / `002` / `003` — 減価償却方法・耐用年数・少額特例の誤適用
- [ ] `RECEIVABLE-001` / `002` / `003` — 売掛金回収遅延・貸倒引当金未計上・法的貸倒未処理
- [ ] `DUPLICATE-001` / `002` / `003` — 二重仕訳・重複計上

### テスト拡充

- [ ] 統合テスト（`tests/integration/`）— freee API との実通信テスト（現在未対応）

### その他

- [ ] npm publish（npmjs.com への公開）
- [ ] 英語プリセット README / docs（非日本語ユーザー向け）

---

## 修正履歴

| 日時 | 内容 |
|------|------|
| 2026-04-12 | 初版作成（ROADMAP.md 新規）。v0.1.0〜v0.1.7 実装状況・バリデーションルール未実装の記録・v0.2.x 計画を記載 |
