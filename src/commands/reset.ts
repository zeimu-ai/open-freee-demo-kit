import { Command } from 'commander';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens } from '../utils/token-store.js';
import { loadState, clearState, listAllStates } from '../utils/state-store.js';
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

  // 他のプリセットが使用中の口座IDを収集（削除対象から除外）
  const allStates = await listAllStates();
  const usedByOthers = new Set<number>();
  for (const s of allStates) {
    if (s.preset === preset) continue;
    for (const id of s.walletableIds) usedByOthers.add(id);
    for (const id of (s.reusedWalletableIds ?? [])) usedByOthers.add(id);
  }

  const existingWalletables = await client.getWalletables(companyId);
  const walletableTypeMap = new Map(existingWalletables.map(w => [w.id, w.type]));

  for (const id of state.walletableIds) {
    if (usedByOthers.has(id)) {
      info(`  口座 (id: ${id}) は他プリセットが使用中 — スキップ`);
      continue;
    }
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
      if (preset) {
        console.log(`🔍 ドライラン — 削除対象: ${preset}`);
        const state = await loadState(preset);
        if (state) {
          console.log(`  仕訳: ${state.manualJournalIds.length}件`);
          console.log(`  取引: ${state.dealIds.length}件`);
          console.log(`  口座: ${state.walletableIds.length}件`);
        } else {
          console.log('  投入データなし');
        }
      } else {
        const allStates = await listAllStates();
        if (allStates.length === 0) {
          console.log('🔍 ドライラン — リセット対象のプリセットがありません。');
        } else {
          console.log(`🔍 ドライラン — ${allStates.length}件のプリセットが対象:`);
          for (const s of allStates) {
            console.log(`  [${s.preset}] 仕訳: ${s.manualJournalIds.length}件, 取引: ${s.dealIds.length}件, 口座: ${s.walletableIds.length}件`);
          }
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
      const allStates = await listAllStates();
      if (allStates.length === 0) {
        console.log('リセット対象のプリセットがありません。');
        return;
      }
      console.log(`${allStates.length}件のプリセットをリセットします...`);
      for (const s of allStates) {
        await resetPreset(s.preset, companyId, client);
      }
    }
  });
