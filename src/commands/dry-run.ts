import { Command } from 'commander';
import { validatePresetName } from '../utils/preset-validator.js';
import { loadPreset } from '../utils/preset-loader.js';
import { error as logError } from '../utils/logger.js';

export const dryRunCommand = new Command('dry-run')
  .description('Simulate loading a preset without making API calls')
  .argument('<preset>', 'Preset name to simulate (e.g. accounting/quickstart)')
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

    const { data, expected, name: presetName, description } = definition;

    console.log(`\n🔍 ドライラン: ${presetName}`);
    console.log(`   ${description}\n`);

    console.log(`口座 (${data.walletables.length}件):`);
    console.log('┌─────────────────────┬──────────────────────────────────┐');
    console.log('│ タイプ              │ 名称                             │');
    console.log('├─────────────────────┼──────────────────────────────────┤');
    for (const w of data.walletables) {
      const type = w.type.padEnd(19);
      const name = w.name.padEnd(32);
      console.log(`│ ${type} │ ${name} │`);
    }
    console.log('└─────────────────────┴──────────────────────────────────┘');

    console.log(`\n取引 (${data.deals.length}件):`);
    console.log('┌────────────┬─────────┬──────────────────────┬──────────────┐');
    console.log('│ 日付       │ 種別    │ 取引先               │ 金額         │');
    console.log('├────────────┼─────────┼──────────────────────┼──────────────┤');
    for (const d of data.deals) {
      const total = d.details.reduce((s, x) => s + x.amount, 0);
      const date = d.issue_date;
      const type = (d.type === 'income' ? '収入' : '支出').padEnd(5);
      const partner = (d.partner_name ?? '').slice(0, 18).padEnd(20);
      const amount = `¥${total.toLocaleString()}`.padStart(12);
      console.log(`│ ${date} │ ${type} │ ${partner} │ ${amount} │`);
    }
    console.log('└────────────┴─────────┴──────────────────────┴──────────────┘');

    console.log(`\n手動仕訳 (${data.manualJournals.length}件):`);
    for (const mj of data.manualJournals) {
      const debitTotal = mj.details.filter(d => d.entry_side === 'debit').reduce((s, x) => s + x.amount, 0);
      console.log(`  ${mj.issue_date} — ${mj.details.length}明細 借方合計: ¥${debitTotal.toLocaleString()}`);
    }

    console.log(`\n─────────────────────────────────`);
    console.log(`期待値: 口座${expected.walletables}件, 取引${expected.deals}件, 仕訳${expected.manualJournals}件`);
    console.log('\n実際に投入するには: fdk load ' + preset);
  });
