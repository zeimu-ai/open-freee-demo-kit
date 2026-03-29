import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadEnv } from '../../src/utils/env-loader.js';

describe('loadEnv', () => {
  const tmpEnvPath = join(tmpdir(), '.env.fdk-test');

  afterEach(() => {
    if (existsSync(tmpEnvPath)) unlinkSync(tmpEnvPath);
    delete process.env['FDK_TEST_VAR'];
  });

  it('.env ファイルが存在する場合、変数が process.env に読み込まれる', () => {
    writeFileSync(tmpEnvPath, 'FDK_TEST_VAR=hello_from_dotenv\n');

    loadEnv(tmpEnvPath);

    expect(process.env['FDK_TEST_VAR']).toBe('hello_from_dotenv');
  });

  it('.env ファイルが存在しない場合でもエラーにならない', () => {
    expect(() => loadEnv('/nonexistent/.env')).not.toThrow();
  });

  it('既に設定済みの環境変数は上書きされない', () => {
    process.env['FDK_TEST_VAR'] = 'original';
    writeFileSync(tmpEnvPath, 'FDK_TEST_VAR=overwritten\n');

    loadEnv(tmpEnvPath);

    expect(process.env['FDK_TEST_VAR']).toBe('original');
  });
});
