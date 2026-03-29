import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { hasCredentials, writeCredentials } from '../../src/utils/env-writer.js';

let tmpDir: string;
let envPath: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fdk-env-test-'));
  envPath = path.join(tmpDir, '.env');
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('hasCredentials', () => {
  it('.env が存在しない場合は false を返す', async () => {
    expect(await hasCredentials(envPath)).toBe(false);
  });

  it('CLIENT_ID と CLIENT_SECRET が両方設定されている場合は true を返す', async () => {
    await fs.writeFile(envPath, 'FREEE_CLIENT_ID=abc123\nFREEE_CLIENT_SECRET=xyz789\n');
    expect(await hasCredentials(envPath)).toBe(true);
  });

  it('CLIENT_ID のみの場合は false を返す', async () => {
    await fs.writeFile(envPath, 'FREEE_CLIENT_ID=abc123\n');
    expect(await hasCredentials(envPath)).toBe(false);
  });

  it('CLIENT_SECRET のみの場合は false を返す', async () => {
    await fs.writeFile(envPath, 'FREEE_CLIENT_SECRET=xyz789\n');
    expect(await hasCredentials(envPath)).toBe(false);
  });

  it('変数が空文字の場合は false を返す', async () => {
    await fs.writeFile(envPath, 'FREEE_CLIENT_ID=\nFREEE_CLIENT_SECRET=\n');
    expect(await hasCredentials(envPath)).toBe(false);
  });
});

describe('writeCredentials', () => {
  it('.env ファイルを新規作成して CLIENT_ID と SECRET を書き込む', async () => {
    await writeCredentials('my-client-id', 'my-client-secret', envPath);

    const content = await fs.readFile(envPath, 'utf-8');
    expect(content).toContain('FREEE_CLIENT_ID=my-client-id');
    expect(content).toContain('FREEE_CLIENT_SECRET=my-client-secret');
  });

  it('既存の .env に別の変数が存在する場合、その内容を保持する', async () => {
    await fs.writeFile(envPath, 'OTHER_VAR=keep_me\n');
    await writeCredentials('id123', 'secret456', envPath);

    const content = await fs.readFile(envPath, 'utf-8');
    expect(content).toContain('OTHER_VAR=keep_me');
    expect(content).toContain('FREEE_CLIENT_ID=id123');
    expect(content).toContain('FREEE_CLIENT_SECRET=secret456');
  });

  it('ファイルのパーミッションを 600 に設定する', async () => {
    await writeCredentials('id', 'secret', envPath);

    const stat = await fs.stat(envPath);
    const mode = stat.mode & 0o777;
    // Windows ではスキップ
    if (process.platform !== 'win32') {
      expect(mode).toBe(0o600);
    }
  });
});
