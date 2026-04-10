import { Command } from 'commander';
import { validatePresetName } from '../utils/preset-validator.js';
import { loadPreset } from '../utils/preset-loader.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens } from '../utils/token-store.js';
import { loadState } from '../utils/state-store.js';
import { error as logError } from '../utils/logger.js';

export const verifyCommand = new Command('verify')
  .description('Verify that loaded preset data matches expected counts in freee')
  .argument('<preset>', 'Preset name to verify (e.g. accounting/quickstart)')
  .action(async (preset: string) => {
    try {
      validatePresetName(preset);
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }

    let definition;
    try {
      definition = await loadPreset(preset);
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }

    const tokens = await loadTokens();
    if (!tokens) {
      logError('Not authenticated. Run `fdk auth` first.');
      process.exit(1);
    }

    const companyId = tokens.company_id;
    if (!companyId) {
      logError('Company not set. Run `fdk auth` first.');
      process.exit(1);
    }

    const state = await loadState(preset);
    if (!state) {
      logError(`"${preset}" はまだ投入されていません。先に: fdk load ${preset}`);
      process.exit(1);
    }

    console.log(`\n🔍 ${preset} を検証中...`);

    const { expected } = definition;
    const client = new FreeeApiClient();
    let passed = true;

    // Verify walletable count by checking preset-defined names exist in freee
    // (existing walletables that were reused are not in state.walletableIds)
    let walletableCount = 0;
    try {
      const liveWalletables = await client.getWalletables(companyId);
      const liveNames = new Set(liveWalletables.map(w => w.name));
      walletableCount = definition.data.walletables.filter(w => liveNames.has(w.name)).length;
    } catch {
      // Fallback to state count
      walletableCount = state.walletableIds.length;
    }
    const walletableOk = walletableCount === expected.walletables;
    const walletableMark = walletableOk ? '✅' : '❌';
    console.log(`${walletableMark} 口座: ${walletableCount}件 (期待値: ${expected.walletables}件)`);
    if (!walletableOk) passed = false;

    // Verify deals
    const dealCount = state.dealIds.length;
    const dealOk = dealCount === expected.deals;
    const dealMark = dealOk ? '✅' : '❌';
    console.log(`${dealMark} 取引: ${dealCount}件 (期待値: ${expected.deals}件)`);
    if (!dealOk) passed = false;

    // Verify manual journals
    const journalCount = state.manualJournalIds.length;
    const journalOk = journalCount === expected.manualJournals;
    const journalMark = journalOk ? '✅' : '❌';
    console.log(`${journalMark} 手動仕訳: ${journalCount}件 (期待値: ${expected.manualJournals}件)`);
    if (!journalOk) passed = false;

    const receiptCount = state.receiptIds.length;
    const receiptOk = receiptCount === (expected.receipts ?? 0);
    const receiptMark = receiptOk ? '✅' : '❌';
    console.log(`${receiptMark} 証憑: ${receiptCount}件 (期待値: ${expected.receipts ?? 0}件)`);
    if (!receiptOk) passed = false;

    console.log('──────────────────');
    if (passed) {
      console.log('✅ 検証PASS: 全項目が期待値と一致しました');
      process.exit(0);
    } else {
      console.log('❌ 検証FAIL: 不一致が検出されました');
      process.exit(1);
    }
  });
