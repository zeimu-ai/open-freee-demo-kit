import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PRESETS_DIR } from '../utils/preset-validator.js';
import { loadPreset } from '../utils/preset-loader.js';
import { info, error as logError } from '../utils/logger.js';

async function findPresets(dir: string, prefix = ''): Promise<string[]> {
  const results: string[] = [];
  let items: string[];
  try {
    items = await fs.readdir(dir);
  } catch {
    return results;
  }
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const id = prefix ? `${prefix}/${item}` : item;
    const presetJson = path.join(fullPath, 'preset.json');
    try {
      await fs.access(presetJson);
      results.push(id);
    } catch {
      results.push(...(await findPresets(fullPath, id)));
    }
  }
  return results;
}

function validateAccountingBalance(preset: ReturnType<typeof loadPreset> extends Promise<infer T> ? T : never): string[] {
  const errors: string[] = [];
  for (const mj of preset.data.manualJournals) {
    const debit = mj.details.filter(d => d.entry_side === 'debit').reduce((s, x) => s + x.amount, 0);
    const credit = mj.details.filter(d => d.entry_side === 'credit').reduce((s, x) => s + x.amount, 0);
    if (debit !== credit) {
      errors.push(`手動仕訳 ${mj.issue_date}: 借方(${debit.toLocaleString()}) ≠ 貸方(${credit.toLocaleString()})`);
    }
  }
  return errors;
}

export const validateCommand = new Command('validate')
  .description('Validate preset JSON files against the schema')
  .argument('[preset]', 'Validate a specific preset (omit to validate all)')
  .action(async (presetArg?: string) => {
    const presets = presetArg ? [presetArg] : await findPresets(PRESETS_DIR);

    if (presets.length === 0) {
      console.log('バリデーション対象のプリセットが見つかりません。');
      return;
    }

    let allPassed = true;

    for (const presetId of presets) {
      process.stdout.write(`\n🔍 ${presetId} を検証中...`);
      try {
        const definition = await loadPreset(presetId);
        const errors = validateAccountingBalance(definition);

        // Check expected count matches actual
        const { data, expected } = definition;
        if (data.walletables.length !== expected.walletables) {
          errors.push(`口座件数: 実際${data.walletables.length}件 ≠ expected.walletables(${expected.walletables})`);
        }
        if (data.deals.length !== expected.deals) {
          errors.push(`取引件数: 実際${data.deals.length}件 ≠ expected.deals(${expected.deals})`);
        }
        if (data.manualJournals.length !== expected.manualJournals) {
          errors.push(`仕訳件数: 実際${data.manualJournals.length}件 ≠ expected.manualJournals(${expected.manualJournals})`);
        }

        if (errors.length === 0) {
          console.log(' ✅ PASS');
          info(`  スキーマ: OK | 口座${data.walletables.length}件 | 取引${data.deals.length}件 | 仕訳${data.manualJournals.length}件 | 貸借: 一致`);
        } else {
          console.log(' ❌ FAIL');
          for (const err of errors) {
            logError(`  ${err}`);
          }
          allPassed = false;
        }
      } catch (err) {
        console.log(' ❌ ERROR');
        logError(`  ${String(err)}`);
        allPassed = false;
      }
    }

    console.log('\n──────────────────────────────────');
    if (allPassed) {
      console.log(`✅ 全プリセットのバリデーションが通過しました (${presets.length}件)`);
    } else {
      console.log('❌ バリデーションエラーがあります');
      process.exit(1);
    }
  });
