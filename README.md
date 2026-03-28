**English** | [日本語](README.ja.md)

# freee-demo-kit

> freee sandbox seeder CLI — Load demo data into your freee test company with a single command

[![npm version](https://img.shields.io/npm/v/freee-demo-kit.svg)](https://www.npmjs.com/package/freee-demo-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

## Overview

**freee-demo-kit** (`fdk`) is an open-source CLI tool that seeds your [freee](https://www.freee.co.jp/) sandbox company with realistic demo data in a single command. It is designed for developers building on the freee API and accountants who want to explore freee features without touching real business data.

With `fdk`, you can load curated presets (accounting transactions, invoices, expenses, HR records) into a freee sandbox company, verify integrations, and reset everything back to a clean state — all from the terminal.

## Installation

```bash
npm install -g freee-demo-kit
```

## Prerequisites

- **Node.js** 20 or later
- A **freee account** (sandbox environment recommended)
- A **freee private app** with `CLIENT_ID` and `CLIENT_SECRET`
  - Create one at: [freee Developers](https://developer.freee.co.jp/)

## Quick Start

```bash
fdk auth          # OAuth login via browser
fdk list          # Show available presets
fdk load quickstart  # Load demo data
fdk reset         # Clean up all demo data
```

## Commands

| Command | Description |
|---------|-------------|
| `fdk auth` | Authenticate with freee via OAuth 2.0 (opens browser) |
| `fdk auth --status` | Show current authentication status |
| `fdk auth --logout` | Remove stored credentials |
| `fdk whoami` | Show authenticated user and company information |
| `fdk list` | Show available presets |
| `fdk load <preset>` | Load a specific preset into the sandbox company |
| `fdk load-all` | Load all available presets |
| `fdk load-all --dry-run` | Preview what would be loaded without making changes |
| `fdk load-all --delay <ms>` | Set delay between API calls (default: 100ms) |
| `fdk reset` | Delete all demo data (journals → deals → walletables → account items) |
| `fdk reset --preset <name>` | Reset only a specific preset |
| `fdk reset --dry-run` | Preview what would be deleted |
| `fdk validate` | Validate preset JSON files against the schema |
| `fdk dry-run <preset>` | Simulate loading a preset without making API calls |

## Presets

Presets are JSON-defined collections of demo data organized by category:

| Category | Description | Status |
|----------|-------------|--------|
| `accounting` | Deals, manual journals, walletables, account items | v1.0 target |
| `invoices` | Invoice records | Coming soon |
| `expenses` | Expense reports | Coming soon |
| `hr` | HR and payroll records | Coming soon |
| `advanced/multi-period` | Multi-period data for financial due diligence | Coming soon |
| `advanced/multi-company` | Multi-company setup | Coming soon |

See [`presets/README.md`](presets/README.md) for the preset specification and how to create custom presets.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

```bash
git clone https://github.com/tackeyy/freee-demo-kit.git
cd freee-demo-kit
npm install
npm test
```

## License

[MIT](LICENSE)
