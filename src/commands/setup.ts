import { Command } from 'commander';
import {
  intro,
  outro,
  text,
  password,
  select,
  spinner,
  note,
  isCancel,
  cancel,
} from '@clack/prompts';
import pc from 'picocolors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasCredentials, writeCredentials } from '../utils/env-writer.js';
import { loadTokens, isTokenExpired } from '../utils/token-store.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { runOAuthPkceFlow } from '../utils/auth-flow.js';
import { runLoad } from './load.js';
import type { PresetDefinition } from '../types/freee.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.resolve(__dirname, '../../presets');

interface PresetOption {
  value: string;
  label: string;
  hint: string;
}

/** presets/ ディレクトリを走査して選択肢を構築する */
async function getPresetsForSelect(): Promise<PresetOption[]> {
  const results: PresetOption[] = [];

  async function scan(dir: string, prefix = ''): Promise<void> {
    let items: string[];
    try {
      items = await fs.readdir(dir);
    } catch {
      return;
    }
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath).catch(() => null);
      if (!stat?.isDirectory()) continue;

      const presetJsonPath = path.join(fullPath, 'preset.json');
      try {
        await fs.access(presetJsonPath);
        const raw = await fs.readFile(presetJsonPath, 'utf-8');
        const def = JSON.parse(raw) as PresetDefinition;
        const id = prefix ? `${prefix}/${item}` : item;
        // errors/ プリセットは末尾に "(エラーあり)" を付けて区別
        const isError = id.startsWith('errors/');
        results.push({
          value: id,
          label: isError ? pc.dim(id) : pc.cyan(id),
          hint: def.description.slice(0, 60) + (def.description.length > 60 ? '…' : ''),
        });
      } catch {
        const id = prefix ? `${prefix}/${item}` : item;
        await scan(fullPath, id);
      }
    }
  }

  await scan(PRESETS_DIR);

  // accounting → invoices → expenses → hr → unclassified → errors の順に並べる
  const ORDER = ['accounting', 'invoices', 'expenses', 'hr', 'unclassified', 'errors'];
  results.sort((a, b) => {
    const ai = ORDER.findIndex(p => a.value.startsWith(p));
    const bi = ORDER.findIndex(p => b.value.startsWith(p));
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.value.localeCompare(b.value);
  });

  return results;
}

const BANNER = `
${pc.bgCyan(pc.black(pc.bold('  freee demo kit  ')))}  ${pc.dim('Sandbox セットアップウィザード')}
`;

export async function runSetup(): Promise<void> {
  console.log(BANNER);
  intro(pc.bold('はじめよう！3ステップでデモデータを投入します'));

  // ─── Step 1: 認証情報 ────────────────────────────────────────────────
  const envPath = path.resolve(process.cwd(), '.env');
  const alreadyCreds = await hasCredentials(envPath);

  if (alreadyCreds) {
    note(
      pc.green('✅ .env に認証情報が設定されています'),
      pc.bold('Step 1/3  認証情報'),
    );
  } else {
    note(
      [
        'freee Developers Console でアプリを作成してください',
        pc.dim('→ https://app.freee.co.jp/developers'),
        '',
        pc.dim('アプリ種別: プライベートアプリ'),
        pc.dim(`コールバック URL: http://localhost:8080/callback`),
      ].join('\n'),
      pc.bold('Step 1/3  認証情報の設定'),
    );

    const clientId = await text({
      message: 'Client ID を入力してください',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      validate: (v) => (v?.trim() ? undefined : '必須項目です'),
    });
    if (isCancel(clientId)) {
      cancel('セットアップを中断しました');
      process.exit(0);
    }

    const clientSecret = await password({
      message: 'Client Secret を入力してください',
      validate: (v) => (v?.trim() ? undefined : '必須項目です'),
    });
    if (isCancel(clientSecret)) {
      cancel('セットアップを中断しました');
      process.exit(0);
    }

    await writeCredentials(clientId as string, clientSecret as string, envPath);

    // 書き込んだ認証情報をプロセス内で即座に反映
    process.env['FREEE_CLIENT_ID'] = clientId as string;
    process.env['FREEE_CLIENT_SECRET'] = clientSecret as string;

    note(
      pc.green('✅ .env を作成しました'),
      pc.bold('Step 1/3  認証情報'),
    );
  }

  // ─── Step 2: freee 認証 ──────────────────────────────────────────────
  const tokens = await loadTokens();
  const alreadyAuthed = tokens !== null && !isTokenExpired(tokens);

  if (alreadyAuthed) {
    try {
      const client = new FreeeApiClient();
      const me = await client.getMe();
      note(
        pc.green(`✅ 認証済み: ${me.display_name} (${me.email})`),
        pc.bold('Step 2/3  freee 認証'),
      );
    } catch {
      note(pc.green('✅ 認証済みです'), pc.bold('Step 2/3  freee 認証'));
    }
  } else {
    note(
      [
        'ブラウザが開きます。freee アカウントでログインしてください。',
        pc.dim('ブラウザが開かない場合は、表示された URL を手動で開いてください。'),
      ].join('\n'),
      pc.bold('Step 2/3  freee 認証'),
    );

    const s = spinner();
    s.start('ブラウザで認証中... （完了するまでこのターミナルはそのままにしてください）');

    try {
      const result = await runOAuthPkceFlow((url) => {
        s.message(`ブラウザが開かない場合は以下の URL を開いてください:\n  ${pc.dim(url)}`);
      });
      s.stop(pc.green(`✅ 認証成功: ${result.displayName} (${result.email})`));
    } catch (err) {
      s.stop(pc.red('認証に失敗しました'));
      cancel(String(err));
      process.exit(1);
    }
  }

  // ─── Step 3: プリセット選択 & 投入 ───────────────────────────────────
  const presetOptions = await getPresetsForSelect();

  const selectedPreset = await select({
    message: pc.bold('どのプリセットを投入しますか？'),
    options: presetOptions,
  });
  if (isCancel(selectedPreset)) {
    cancel('セットアップを中断しました');
    process.exit(0);
  }

  console.log('');
  const s2 = spinner();
  s2.start(`${pc.cyan(selectedPreset as string)} を投入中...`);

  let loadResult;
  try {
    loadResult = await runLoad(
      selectedPreset as string,
      { yes: true },
      (progress) => {
        const labels = { walletables: '口座', deals: '取引', journals: '仕訳' };
        s2.message(
          `${labels[progress.stage]} を投入中 ` +
          `${pc.dim(`(${progress.current}/${progress.total})`)}`,
        );
      },
    );
  } catch (err) {
    s2.stop(pc.red('投入に失敗しました'));
    cancel(String(err));
    process.exit(1);
  }

  s2.stop(pc.green('✅ 投入完了！'));

  // ─── 完了画面 ────────────────────────────────────────────────────────
  note(
    [
      `${pc.cyan('📊 口座')}  ${pc.bold(String(loadResult.walletableIds.length).padStart(4))} 件`,
      `${pc.yellow('💰 取引')}  ${pc.bold(String(loadResult.dealIds.length).padStart(4))} 件`,
      `${pc.magenta('📝 仕訳')}  ${pc.bold(String(loadResult.manualJournalIds.length).padStart(4))} 件`,
      '',
      `事業所: ${pc.bold(loadResult.companyName)}`,
    ].join('\n'),
    pc.bold('🎊 ' + loadResult.presetName + ' のデモデータを投入しました！'),
  );

  outro(
    [
      pc.bold('freee を開いてデモデータを確認してください'),
      pc.dim('→ https://app.freee.co.jp/'),
      '',
      pc.dim(`データを削除するには: ${pc.italic('fdk reset ' + (selectedPreset as string))}`),
    ].join('\n'),
  );
}

export const setupCommand = new Command('setup')
  .description('Interactive setup wizard — authenticate and load demo data in 3 steps')
  .action(async () => {
    try {
      await runSetup();
    } catch (err) {
      console.error(pc.red('\n✖ セットアップ中にエラーが発生しました: ' + String(err)));
      process.exit(1);
    }
  });
