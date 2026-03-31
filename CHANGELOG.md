# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
