# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] - 2026-04-10

### Added
- New preset field `data.receipts[]` for file-box receipt uploads
- `expected.receipts` validation and verification support
- Receipt upload/delete support in `fdk load` / `fdk reset`
- Receipt count visibility in `fdk status` / `fdk setup`
- Sample receipts for `expenses/quickstart`

### Changed
- Backward compatibility for older presets and state files by defaulting missing receipts to `[]`

## [0.1.4] - 2026-03-31

### Added
- New preset `errors/year-end-closing` — 期末決算ミスエラーデータ
  - 翌期売上の当期前倒し計上（実現主義違反）
  - 翌期分費用の前払費用未計上（期間帰属誤り）
  - 電気料金・外注費の未払費用計上漏れ（発生主義違反）
  - 仮受金の期末未振替（仮勘定放置）
  - 減価償却費・貸倒引当金の計上漏れ
- New preset `accounting/manufacturing` — 製造業・原価計算
  - 材料費・労務費・製造間接費の三分法による原価集計
  - 仕掛品・製品勘定の月次動き（製造原価報告書の基礎）
  - 工場電力費・設備リース・工場賃料の間接費計上
  - 売上原価振替仕訳（製品→売上原価）
- New preset `errors/depreciation-method` — 減価償却ミスエラーデータ
  - 機械装置の定額法誤適用（定率法が原則）
  - 業務用普通乗用車の耐用年数誤適用（3年→正しくは6年）
  - 30万円超資産を消耗品費で一括費用化（少額特例の誤適用）
- New preset `invoices/subscription` — SaaS・月次サブスクリプション請求
  - 月次・年次プランの混在、前受収益の月次振替処理
  - トライアル→有料転換、途中解約返金処理
  - 決済手数料・クラウドインフラ費用の計上
- New preset `accounting/payroll-agency` — 社労士・給与計算代行
  - 顧問料・給与計算代行収入の月次管理
  - 社会保険料の預り金処理と機構納付
  - 労働保険料申告代行・各種手続き代行手数料
- New preset `accounting/npo-subsidy` — NPO・補助金受給団体
  - 補助金の交付決定→入金→精算の完全フロー
  - 会費収入・寄附金収入・チャリティイベント収入（全て不課税）
  - 補助金返納・前受金の収益振替処理
- New preset `errors/overdue-receivable` — 売掛金・未収金 回収遅延エラーデータ
  - 6ヶ月超未回収売掛金への貸倒引当金未計上
  - 合意なし相殺処理（民法上の問題）
  - 破産確定後の売掛金未処理（貸倒損失計上漏れ）
- New preset `errors/duplicate-journal` — 二重仕訳・重複計上エラーデータ
  - 請求書と納品書からの同一取引二重入力
  - 銀行連携自動仕訳と手動仕訳の重複
  - 月次締め後の誤認識による再計上

## [0.1.3] - 2026-03-31

### Added
- New preset `accounting/freelance-invoice` — インボイス制度対応の個人事業主（フリーランス）会計データ
  - 登録番号あり事業者との取引（課税仕入10%・源泉徴収あり）
  - 免税事業者への外注費（インボイス未登録・経過措置80%控除）
  - コワーキングスペース・通信費・書籍・交際費の課税仕入処理
  - 源泉所得税の事業主貸による調整仕訳（確定申告で精算）

## [0.1.2] - 2026-03-31

### Added
- New preset `errors/consumption-tax` — インボイス制度（適格請求書等保存方式）に関する典型的ミスを含むエラーデータ
  - 免税事業者からの仕入を全額控除で計上（経過措置80%控除が正しい）
  - 軽減税率8%対象の飲食料品を標準税率10%で計上
  - 課税仕入10%対象の消耗品費を非課税で計上

## [0.1.1] - 2026-03-31

### Changed
- Rewrote `CONTRIBUTING.md` for freee-demo-kit (removed Zoom references, added "Adding a New Preset" guide)
- Added `preset_request.yml` Issue template for community preset requests
- Expanded `package.json` keywords: added `freee-api`, `bookkeeping`, `tax`, `invoice`, `sandbox`, `preset`, `japanese-accounting`

## [0.1.0] - 2026-03-31

### Added

#### Commands
- `fdk setup` — Interactive setup wizard (OAuth authentication + preset selection)
- `fdk auth` — freee OAuth2 PKCE authentication
- `fdk load <preset>` — Load preset data into freee sandbox
- `fdk load-all` — Load all presets at once
- `fdk dry-run <preset>` — Preview data to be loaded without writing
- `fdk reset [preset]` — Delete loaded data
- `fdk validate [preset]` — Schema validation + accounting/tax rule checks
- `fdk verify <preset>` — Post-load verification for CI/CD
- `fdk corrupt <preset>` — Inject accounting errors for training purposes
- `fdk status` — Show loaded preset status
- `fdk list` — List available presets

#### Accounting Validation Rules
- `OFFICER-PAY-001` — Detect officer compensation misclassified as payroll
- `TAX-CODE-001` — Detect tax code inconsistencies in deals
- `ENTERTAINMENT-001` — Warn when entertainment expenses exceed ¥667,000/month

#### Presets (20 total)
- **accounting**: quickstart, full-year, restaurant, construction, it-startup, medical, non-profit, real-estate, retail, sole-proprietor
- **invoices**: quickstart
- **expenses**: quickstart
- **hr**: quickstart
- **unclassified**: quickstart
- **errors**: officer-pay, tax-code, entertainment, mixed
- **advanced**: multi-period, multi-company
- **common**: depreciation

#### Security
- OAuth tokens stored with `chmod 600` permissions
- Path traversal prevention for preset file loading
- Real-name detection test suite (25 blocked names)
- Confirmation prompt required before any write operation

[0.1.0]: https://github.com/tackeyy/freee-demo-kit/releases/tag/v0.1.0
