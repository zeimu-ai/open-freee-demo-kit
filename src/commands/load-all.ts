import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PRESETS_DIR } from '../utils/preset-validator.js';
import { info, error as logError } from '../utils/logger.js';

async function findPresetIds(dir: string, prefix = ''): Promise<string[]> {
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
      results.push(...(await findPresetIds(fullPath, id)));
    }
  }
  return results;
}

export const loadAllCommand = new Command('load-all')
  .description('Load all available presets into the freee sandbox company')
  .option('--dry-run', 'Show what would be loaded without actually loading')
  .option('--delay <ms>', 'Extra delay between presets in milliseconds', '500')
  .action(async (options: { dryRun?: boolean; delay?: string }) => {
    const presetIds = await findPresetIds(PRESETS_DIR);

    if (presetIds.length === 0) {
      console.log('利用可能なプリセットが見つかりません。');
      return;
    }

    console.log(`\n📦 全プリセットを投入します (${presetIds.length}件):`);
    for (const id of presetIds) {
      console.log(`  - ${id}`);
    }

    if (options.dryRun) {
      console.log('\n(--dry-run: 実際の投入はスキップされました)');
      console.log('実際に投入するには: fdk load-all');
      return;
    }

    const delayMs = parseInt(options.delay ?? '500', 10);
    const { loadCommand } = await import('./load.js');

    for (const presetId of presetIds) {
      console.log(`\n▶ ${presetId} を投入中...`);
      try {
        // Invoke load command programmatically
        await loadCommand.parseAsync([presetId], { from: 'user' });
        info(`  ✓ ${presetId} 完了`);
      } catch (err) {
        logError(`  ✗ ${presetId} 失敗: ${String(err)}`);
      }

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log('\n✅ 全プリセットの投入が完了しました');
  });
