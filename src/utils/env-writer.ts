import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_ENV_PATH = path.resolve(process.cwd(), '.env');

/**
 * .env に FREEE_CLIENT_ID と FREEE_CLIENT_SECRET が両方設定されているか確認する
 */
export async function hasCredentials(envPath: string = DEFAULT_ENV_PATH): Promise<boolean> {
  try {
    const content = await fs.readFile(envPath, 'utf-8');
    const hasId = /^FREEE_CLIENT_ID=.+$/m.test(content);
    const hasSecret = /^FREEE_CLIENT_SECRET=.+$/m.test(content);
    return hasId && hasSecret;
  } catch {
    return false;
  }
}

/**
 * FREEE_CLIENT_ID と FREEE_CLIENT_SECRET を .env に書き込む
 * 既存ファイルがある場合は末尾に追記する
 */
export async function writeCredentials(
  clientId: string,
  clientSecret: string,
  envPath: string = DEFAULT_ENV_PATH
): Promise<void> {
  let existing = '';
  try {
    existing = await fs.readFile(envPath, 'utf-8');
  } catch {
    // ファイルが存在しない場合は新規作成
  }

  const lines: string[] = [];
  if (existing) lines.push(existing.trimEnd());
  lines.push(`FREEE_CLIENT_ID=${clientId}`);
  lines.push(`FREEE_CLIENT_SECRET=${clientSecret}`);

  await fs.writeFile(envPath, lines.join('\n') + '\n', {
    encoding: 'utf-8',
    mode: 0o600,
  });
}
