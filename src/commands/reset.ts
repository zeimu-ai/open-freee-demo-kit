import { Command } from 'commander';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens } from '../utils/token-store.js';
import { loadState, clearState } from '../utils/state-store.js';
import { info, warn, error as logError } from '../utils/logger.js';
import { confirmCompany } from '../utils/confirm-company.js';

const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetPreset(preset: string, companyId: number, client: FreeeApiClient) {
  const state = await loadState(preset);
  if (!state) {
    console.log(`⚠️  "${preset}" の投入データが見つかりません。`);
    return;
  }

  console.log(`\n🗑️  "${preset}" を削除中...`);
  console.log(`  仕訳: ${state.manualJournalIds.length}件, 取引: ${state.dealIds.length}件, 口座: ${state.walletableIds.length}件`);

  // Delete in reverse order: journals → deals → walletables
  let errors = 0;

  for (const id of state.manualJournalIds) {
    try {
      await client.deleteManualJournal(companyId, id);
      await sleep(DELAY_MS);
    } catch {
      warn(`手動仕訳の削除失敗 (id: ${id})`);
      errors++;
    }
  }

  for (const id of state.dealIds) {
    try {
      await client.deleteDeal(companyId, id);
      await sleep(DELAY_MS);
    } catch {
      warn(`取引の削除失敗 (id: ${id})`);
      errors++;
    }
  }

  const existingWalletables = await client.getWalletables(companyId);
  const walletableTypeMap = new Map(existingWalletables.map(w => [w.id, w.type]));

  for (const id of state.walletableIds) {
    const type = walletableTypeMap.get(id);
    if (!type) {
      warn(`口座が見つかりません (id: ${id}) — スキップ`);
      continue;
    }
    try {
      await client.deleteWalletable(companyId, id, type);
      await sleep(DELAY_MS);
    } catch {
      warn(`口座の削除失敗 (id: ${id})`);
      errors++;
    }
  }

  await clearState(preset);

  if (errors > 0) {
    console.log(`⚠️  削除完了（${errors}件のエラーあり）`);
  } else {
    console.log(`✅ リセット完了: "${preset}"`);
  }
}

export const resetCommand = new Command('reset')
  .description('Delete all demo data from the freee sandbox company')
  .argument('[preset]', 'Reset only a specific preset (omit to reset all)')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (preset: string | undefined, options: { dryRun?: boolean; yes?: boolean }) => {
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

    const client = new FreeeApiClient();
    const company = await client.getCompany(companyId);

    const companyName = company.display_name || company.name;

    if (options.dryRun) {
      const targets = preset ? [preset] : ['all presets in state.json'];
      console.log(`🔍 ドライラン — 削除対象: ${targets.join(', ')}`);
      if (preset) {
        const state = await loadState(preset);
        if (state) {
          console.log(`  仕訳: ${state.manualJournalIds.length}件`);
          console.log(`  取引: ${state.dealIds.length}件`);
          console.log(`  口座: ${state.walletableIds.length}件`);
        } else {
          console.log('  投入データなし');
        }
      }
      return;
    }

    const ok = await confirmCompany(companyName, companyId, options.yes ?? false);
    if (!ok) {
      console.log('キャンセルしました。');
      process.exit(0);
    }

    if (preset) {
      await resetPreset(preset, companyId, client);
    } else {
      // Reset all — read state file for all preset keys
      const { loadState: ls } = await import('../utils/state-store.js');
      // We don't have a listStates function yet; just warn
      console.log('⚠️  全プリセットリセットはプリセット名指定が必要です。');
      console.log('例: fdk reset accounting/quickstart');
    }
  });
