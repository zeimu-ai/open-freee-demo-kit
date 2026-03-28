import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.resolve(__dirname, '../../presets');

interface PresetEntry {
  id: string;
  path: string;
}

async function scanPresets(dir: string, prefix = ''): Promise<PresetEntry[]> {
  const entries: PresetEntry[] = [];

  let items: string[];
  try {
    items = await fs.readdir(dir);
  } catch {
    return entries;
  }

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      // Check if this directory has a preset.json
      const presetJson = path.join(fullPath, 'preset.json');
      try {
        await fs.access(presetJson);
        const id = prefix ? `${prefix}/${item}` : item;
        entries.push({ id, path: fullPath });
      } catch {
        // No preset.json — recurse into subdirectory
        const id = prefix ? `${prefix}/${item}` : item;
        const nested = await scanPresets(fullPath, id);
        entries.push(...nested);
      }
    }
  }

  return entries;
}

export const listCommand = new Command('list')
  .description('List available presets')
  .action(async () => {
    const presets = await scanPresets(PRESETS_DIR);

    if (presets.length === 0) {
      console.log('利用可能なプリセット:');
      console.log('  (なし — Phase 2 で実装予定)');
      console.log('');
      console.log('予定プリセット:');
      console.log('  accounting/quickstart   基本的な会計データ（中小企業向け）       [Phase 2 予定]');
      console.log('  expenses                経費精算デモデータ                         [Phase 2 予定]');
      console.log('  invoices                請求書・売掛金デモデータ                   [Phase 2 予定]');
      console.log('  hr                      給与・人事デモデータ                       [Phase 2 予定]');
    } else {
      console.log('利用可能なプリセット:');
      for (const preset of presets) {
        console.log(`  ${preset.id}`);
      }
    }
  });
