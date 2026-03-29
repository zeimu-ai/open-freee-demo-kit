import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { loadPreset } from '../utils/preset-loader.js';
import { runCorrupt } from '../utils/corrupt-injector.js';
import type { CorruptOptions } from '../utils/corrupt-injector.js';

const VALID_RULES = ['officer-pay', 'tax-code', 'entertainment'] as const;
type Rule = typeof VALID_RULES[number];

function parseRules(input: string): Rule[] {
  const parts = input.split(',').map(s => s.trim());
  for (const part of parts) {
    if (!VALID_RULES.includes(part as Rule)) {
      console.error(pc.red(`不明なルール: "${part}"`));
      console.error(`有効なルール: ${VALID_RULES.join(', ')}`);
      process.exit(1);
    }
  }
  return parts as Rule[];
}

export const corruptCommand = new Command('corrupt')
  .description('Inject accounting errors into a preset for training/testing purposes')
  .argument('<preset>', 'Target preset (e.g. accounting/quickstart)')
  .option(
    '--rules <rules>',
    `Comma-separated list of rules to inject: ${VALID_RULES.join(', ')}`,
    'officer-pay,tax-code,entertainment',
  )
  .option('--output <path>', 'Write corrupted preset to a file instead of stdout')
  .option('--dry-run', 'Show what would be injected without writing output')
  .action(async (presetArg: string, options: { rules: string; output?: string; dryRun?: boolean }) => {
    const rules = parseRules(options.rules);

    let definition;
    try {
      definition = await loadPreset(presetArg);
    } catch (err) {
      console.error(pc.red(`プリセット読み込みエラー: ${String(err)}`));
      process.exit(1);
    }

    const corruptOptions: CorruptOptions = { rules };
    const { preset: corrupted, manifest } = runCorrupt(definition, corruptOptions);

    // --dry-run: 変更内容だけ表示して終了
    if (options.dryRun) {
      console.log(pc.bold(`\n🔍 fdk corrupt ${presetArg} --rules ${rules.join(',')}`));
      console.log(pc.dim('（dry-run: 実際には変更しません）\n'));

      if (manifest.length === 0) {
        console.log(pc.yellow('  注入できるエラーが見つかりませんでした。'));
        console.log(pc.dim('  ヒント: 対象プリセットに役員報酬・売上高・外注費・交際費が含まれているか確認してください。'));
        return;
      }

      for (const item of manifest) {
        console.log(`  ${pc.red('●')} [${item.rule}] ${item.location}`);
        console.log(`    ${pc.dim(item.description)}`);
        console.log(`    ${pc.cyan('修正:')}} ${item.expected_fix}`);
      }
      console.log(`\n  合計 ${pc.bold(String(manifest.length))} 件のエラーを注入予定`);
      return;
    }

    // error_manifest を追記
    corrupted.error_manifest = manifest;
    const json = JSON.stringify(corrupted, null, 2);

    if (options.output) {
      const outPath = path.resolve(process.cwd(), options.output);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, json, 'utf-8');
      console.log(pc.green(`✅ 破損プリセットを書き出しました: ${options.output}`));
      console.log(pc.dim(`   注入エラー: ${manifest.length} 件`));
      for (const item of manifest) {
        console.log(pc.dim(`   • [${item.rule}] ${item.location}`));
      }
    } else {
      // stdout に JSON を出力
      process.stdout.write(json + '\n');
    }
  });
