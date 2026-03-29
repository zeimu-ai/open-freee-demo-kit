import { Command } from 'commander';
import { validatePresetName } from '../utils/preset-validator.js';
import { loadPreset } from '../utils/preset-loader.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens, saveTokens } from '../utils/token-store.js';
import { saveState, loadState } from '../utils/state-store.js';
import { info, warn, error as logError } from '../utils/logger.js';
import { confirmCompany } from '../utils/confirm-company.js';
import type { DealData, ManualJournalData } from '../types/freee.js';

const DELAY_MS = 200; // rate limit: 200ms between API calls

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const loadCommand = new Command('load')
  .description('Load a specific preset into the freee sandbox company')
  .argument('<preset>', 'Preset name (e.g. accounting/quickstart)')
  .option('--dry-run', 'Preview without making API calls')
  .option('--force', 'Load even if state.json already exists for this preset')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (preset: string, options: { dryRun?: boolean; force?: boolean; yes?: boolean }) => {
    // 1. Validate preset name
    try {
      validatePresetName(preset);
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }

    // 2. Load preset definition
    let definition;
    try {
      definition = await loadPreset(preset);
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }

    const { data, expected, name: presetName } = definition;

    if (options.dryRun) {
      console.log(`\n🔍 ドライラン: ${presetName}`);
      console.log(`\n口座 (${data.walletables.length}件):`);
      for (const w of data.walletables) {
        console.log(`  [${w.type}] ${w.name}`);
      }
      console.log(`\n取引 (${data.deals.length}件):`);
      for (const d of data.deals) {
        const total = d.details.reduce((s, x) => s + x.amount, 0);
        console.log(`  ${d.issue_date} [${d.type}] ${d.partner_name ?? ''} ¥${total.toLocaleString()}`);
      }
      console.log(`\n手動仕訳 (${data.manualJournals.length}件):`);
      for (const mj of data.manualJournals) {
        console.log(`  ${mj.issue_date} (${mj.details.length}明細)`);
      }
      console.log(`\n期待値: 口座${expected.walletables}件, 取引${expected.deals}件, 仕訳${expected.manualJournals}件`);
      return;
    }

    // 3. Check existing state
    if (!options.force) {
      const existing = await loadState(preset);
      if (existing) {
        console.log(`⚠️  "${preset}" は既にロード済みです (${existing.loadedAt})`);
        console.log('上書きするには --force オプションを使用してください。');
        console.log('リセットするには: fdk reset');
        process.exit(1);
      }
    }

    // 4. Get tokens and company
    const tokens = await loadTokens();
    if (!tokens) {
      logError('Not authenticated. Run `fdk auth` first.');
      process.exit(1);
    }

    let companyId = tokens.company_id;
    const client = new FreeeApiClient();
    let companyName = `ID: ${companyId}`;

    if (!companyId) {
      const companies = await client.getCompanies();
      if (companies.length === 0) {
        logError('No companies found in your freee account.');
        process.exit(1);
      }
      companyId = companies[0].id;
      companyName = companies[0].display_name || companies[0].name;
      warn(`Company ID not set. Using first company: [${companyId}] ${companyName}`);
      await saveTokens({ ...tokens, company_id: companyId });
    } else {
      const company = await client.getCompany(companyId);
      companyName = company.display_name || company.name;
    }

    // Confirm before writing
    if (!options.dryRun) {
      const ok = await confirmCompany(companyName, companyId, options.yes ?? false);
      if (!ok) {
        console.log('キャンセルしました。');
        process.exit(0);
      }
    }

    console.log(`\n📦 ${presetName} を投入中... (company_id: ${companyId})`);

    // 5. Resolve account_item_name → id (uses itemMap built after walletable creation)
    let itemMap = new Map<string, number>();

    function resolveDeals(deals: DealData[]): DealData[] {
      return deals.map(deal => ({
        ...deal,
        details: deal.details.map(d => {
          if (d.account_item_name && !d.account_item_id) {
            const id = itemMap.get(d.account_item_name);
            if (!id) warn(`勘定科目が見つかりません: "${d.account_item_name}"`);
            return { ...d, account_item_id: id };
          }
          return d;
        }),
      }));
    }

    function resolveJournals(journals: ManualJournalData[]): ManualJournalData[] {
      return journals.map(mj => ({
        ...mj,
        details: mj.details.map(d => {
          if (d.account_item_name && !d.account_item_id) {
            const id = itemMap.get(d.account_item_name);
            if (!id) warn(`勘定科目が見つかりません: "${d.account_item_name}"`);
            return { ...d, account_item_id: id };
          }
          return d;
        }),
      }));
    }

    const walletableIds: number[] = [];
    const dealIds: number[] = [];
    const manualJournalIds: number[] = [];

    // 6. Create walletables (skip if already exists with same name)
    const existingWalletables = await client.getWalletables(companyId);
    const existingWalletableMap = new Map(existingWalletables.map(w => [w.name, w.id]));

    console.log(`\n口座を作成中 (${data.walletables.length}件)...`);
    for (const w of data.walletables) {
      const existingId = existingWalletableMap.get(w.name);
      if (existingId !== undefined) {
        // 既存口座は削除対象に含めない（システム口座等を誤って削除しないため）
        info(`  ✓ ${w.name} (既存 id: ${existingId}) — スキップ`);
        continue;
      }
      try {
        const created = await client.createWalletable(companyId, w);
        walletableIds.push(created.id);
        info(`  ✓ ${w.name} (id: ${created.id})`);
        await sleep(DELAY_MS);
      } catch (err) {
        logError(`口座作成失敗: ${w.name} — ${String(err)}`);
      }
    }

    // 7. Build account item name→id map (after walletable creation so bank account items are included)
    info('勘定科目を取得中...');
    const accountItems = await client.getAccountItems(companyId);
    itemMap = new Map<string, number>(accountItems.map(a => [a.name, a.id]));

    // 8. Create deals
    console.log(`\n取引を作成中 (${data.deals.length}件)...`);
    for (const deal of resolveDeals(data.deals)) {
      try {
        const created = await client.createDeal(companyId, deal);
        dealIds.push(created.id);
        await sleep(DELAY_MS);
      } catch (err) {
        logError(`取引作成失敗: ${deal.issue_date} — ${String(err)}`);
      }
    }
    info(`  ✓ ${dealIds.length}件 作成完了`);

    // 9. Create manual journals
    if (data.manualJournals.length > 0) {
      console.log(`\n手動仕訳を作成中 (${data.manualJournals.length}件)...`);
      for (const mj of resolveJournals(data.manualJournals)) {
        try {
          const created = await client.createManualJournal(companyId, mj);
          manualJournalIds.push(created.id);
          info(`  ✓ ${mj.issue_date} (id: ${created.id})`);
          await sleep(DELAY_MS);
        } catch (err) {
          logError(`手動仕訳作成失敗: ${mj.issue_date} — ${String(err)}`);
        }
      }
    }

    // 10. Save state
    await saveState({
      preset,
      loadedAt: new Date().toISOString(),
      walletableIds,
      dealIds,
      manualJournalIds,
    });

    console.log(`\n✅ 投入完了: 口座${walletableIds.length}件, 取引${dealIds.length}件, 仕訳${manualJournalIds.length}件`);
    console.log('確認するには: fdk verify ' + preset);
  });
