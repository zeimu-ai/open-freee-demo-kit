import { Command } from 'commander';
import { validatePresetName } from '../utils/preset-validator.js';
import { loadPreset } from '../utils/preset-loader.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens, saveTokens } from '../utils/token-store.js';
import { saveState, loadState } from '../utils/state-store.js';
import { info, warn, error as logError } from '../utils/logger.js';
import { confirmCompany } from '../utils/confirm-company.js';
import type { DealData, ManualJournalData } from '../types/freee.js';

const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface LoadOptions {
  dryRun?: boolean;
  force?: boolean;
  yes?: boolean;
}

export interface LoadProgress {
  stage: 'walletables' | 'deals' | 'journals' | 'receipts';
  current: number;
  total: number;
}

export interface LoadResult {
  walletableIds: number[];
  dealIds: number[];
  manualJournalIds: number[];
  receiptIds: number[];
  presetName: string;
  companyName: string;
}

/**
 * プリセットを freee サンドボックスに投入する。
 * setup コマンドからも呼び出せる純粋関数。
 */
export async function runLoad(
  preset: string,
  options: LoadOptions,
  onProgress?: (progress: LoadProgress) => void,
): Promise<LoadResult> {
  validatePresetName(preset);
  const definition = await loadPreset(preset);
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
    console.log(`\n証憑 (${data.receipts.length}件):`);
    for (const receipt of data.receipts) {
      console.log(`  ${receipt.filename} [${receipt.mimeType}] ${receipt.description ?? ''}`.trim());
    }
    console.log(`\n期待値: 口座${expected.walletables}件, 取引${expected.deals}件, 仕訳${expected.manualJournals}件, 証憑${expected.receipts ?? 0}件`);
    return {
      walletableIds: [],
      dealIds: [],
      manualJournalIds: [],
      receiptIds: [],
      presetName,
      companyName: '',
    };
  }

  if (!options.force) {
    const existing = await loadState(preset);
    if (existing) {
      throw new Error(`"${preset}" は既にロード済みです (${existing.loadedAt})。上書きするには --force を使用してください。`);
    }
  }

  const tokens = await loadTokens();
  if (!tokens) throw new Error('Not authenticated. Run `fdk auth` first.');

  let companyId = tokens.company_id;
  const client = new FreeeApiClient();
  let companyName = `ID: ${companyId}`;

  if (!companyId) {
    const companies = await client.getCompanies();
    if (companies.length === 0) throw new Error('No companies found in your freee account.');
    companyId = companies[0].id;
    companyName = companies[0].display_name || companies[0].name;
    warn(`Company ID not set. Using first company: [${companyId}] ${companyName}`);
    await saveTokens({ ...tokens, company_id: companyId });
  } else {
    const company = await client.getCompany(companyId);
    companyName = company.display_name || company.name;
  }

  const ok = await confirmCompany(companyName, companyId, options.yes ?? false);
  if (!ok) throw new Error('CANCELLED');

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
  const reusedWalletableIds: number[] = [];
  const dealIds: number[] = [];
  const manualJournalIds: number[] = [];
  const receiptIds: number[] = [];

  // 口座を作成（既存口座があれば再利用）
  const existingWalletables = await client.getWalletables(companyId);
  const existingWalletableMap = new Map(existingWalletables.map(w => [w.name, w.id]));

  for (let i = 0; i < data.walletables.length; i++) {
    const w = data.walletables[i];
    onProgress?.({ stage: 'walletables', current: i + 1, total: data.walletables.length });
    const existingId = existingWalletableMap.get(w.name);
    if (existingId !== undefined) {
      reusedWalletableIds.push(existingId);
      info(`  ✓ ${w.name} (既存 id: ${existingId}) — 再利用`);
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

  // 勘定科目マップを構築
  info('勘定科目を取得中...');
  const accountItems = await client.getAccountItems(companyId);
  itemMap = new Map<string, number>(accountItems.map(a => [a.name, a.id]));

  // 取引を作成
  const resolvedDeals = resolveDeals(data.deals);
  for (let i = 0; i < resolvedDeals.length; i++) {
    const deal = resolvedDeals[i];
    onProgress?.({ stage: 'deals', current: i + 1, total: resolvedDeals.length });
    try {
      const created = await client.createDeal(companyId, deal);
      dealIds.push(created.id);
      await sleep(DELAY_MS);
    } catch (err) {
      logError(`取引作成失敗: ${deal.issue_date} — ${String(err)}`);
    }
  }
  info(`  ✓ ${dealIds.length}件 作成完了`);

  // 手動仕訳を作成
  if (data.manualJournals.length > 0) {
    const resolvedJournals = resolveJournals(data.manualJournals);
    for (let i = 0; i < resolvedJournals.length; i++) {
      const mj = resolvedJournals[i];
      onProgress?.({ stage: 'journals', current: i + 1, total: resolvedJournals.length });
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

  // 証憑をアップロード
  if (data.receipts.length > 0) {
    for (let i = 0; i < data.receipts.length; i++) {
      const receipt = data.receipts[i];
      onProgress?.({ stage: 'receipts', current: i + 1, total: data.receipts.length });
      try {
        const created = await client.createReceipt(companyId, receipt);
        receiptIds.push(created.id);
        info(`  ✓ ${receipt.filename} (id: ${created.id})`);
        await sleep(DELAY_MS);
      } catch (err) {
        logError(`証憑アップロード失敗: ${receipt.filename} — ${String(err)}`);
      }
    }
  }

  // 状態を保存
  await saveState({
    preset,
    loadedAt: new Date().toISOString(),
    walletableIds,
    reusedWalletableIds: reusedWalletableIds.length > 0 ? reusedWalletableIds : undefined,
    dealIds,
    manualJournalIds,
    receiptIds,
  });

  return { walletableIds, dealIds, manualJournalIds, receiptIds, presetName, companyName };
}

export const loadCommand = new Command('load')
  .description('Load a specific preset into the freee sandbox company')
  .argument('<preset>', 'Preset name (e.g. accounting/quickstart)')
  .option('--dry-run', 'Preview without making API calls')
  .option('--force', 'Load even if state.json already exists for this preset')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (preset: string, options: { dryRun?: boolean; force?: boolean; yes?: boolean }) => {
    try {
      validatePresetName(preset);
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }

    try {
      const result = await runLoad(preset, options);
      if (!options.dryRun) {
        console.log(`\n✅ 投入完了: 口座${result.walletableIds.length}件, 取引${result.dealIds.length}件, 仕訳${result.manualJournalIds.length}件, 証憑${result.receiptIds.length}件`);
        console.log('確認するには: fdk verify ' + preset);
      }
    } catch (err) {
      const msg = String(err);
      if (msg.includes('CANCELLED')) {
        console.log('キャンセルしました。');
        process.exit(0);
      }
      logError(msg);
      process.exit(1);
    }
  });
