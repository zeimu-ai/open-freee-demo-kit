import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// vi.hoisted runs before imports — use only process global (no os/path)
const mocks = vi.hoisted(() => {
  const tmpDir = `/tmp/fdk-test-${process.pid}`;
  return {
    tmpDir,
    tmpTokenFile: `${tmpDir}/tokens.json`,
  };
});

vi.mock('../../src/utils/config.js', () => ({
  CONFIG_DIR: mocks.tmpDir,
  TOKEN_FILE: mocks.tmpTokenFile,
  CONFIG_FILE: `${mocks.tmpDir}/config.json`,
  getConfigDir: () => mocks.tmpDir,
  getTokenFile: () => mocks.tmpTokenFile,
}));

import { saveTokens, loadTokens, clearTokens } from '../../src/utils/token-store.js';
import type { FreeeTokens } from '../../src/types/freee.js';

const sampleTokens: FreeeTokens = {
  access_token: 'test_access_token',
  refresh_token: 'test_refresh_token',
  token_type: 'bearer',
  expires_at: Date.now() + 3600 * 1000,
  company_id: 12345,
};

describe('token-store', () => {
  beforeEach(async () => {
    await fs.rm(mocks.tmpDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(mocks.tmpDir, { recursive: true, force: true });
  });

  describe('saveTokens', () => {
    it('saves tokens to file as JSON', async () => {
      await saveTokens(sampleTokens);
      const raw = await fs.readFile(mocks.tmpTokenFile, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.access_token).toBe('test_access_token');
      expect(parsed.refresh_token).toBe('test_refresh_token');
      expect(parsed.company_id).toBe(12345);
    });

    it('creates directory with mode 0o700', async () => {
      await saveTokens(sampleTokens);
      const stat = await fs.stat(mocks.tmpDir);
      const mode = stat.mode & 0o777;
      expect(mode & 0o700).toBe(0o700);
      expect(mode & 0o077).toBe(0);
    });

    it('creates token file with mode 0o600', async () => {
      await saveTokens(sampleTokens);
      const stat = await fs.stat(mocks.tmpTokenFile);
      const mode = stat.mode & 0o777;
      expect(mode & 0o600).toBe(0o600);
      expect(mode & 0o077).toBe(0);
    });
  });

  describe('loadTokens', () => {
    it('returns null when token file does not exist', async () => {
      const result = await loadTokens();
      expect(result).toBeNull();
    });

    it('returns parsed tokens when file exists', async () => {
      await saveTokens(sampleTokens);
      const result = await loadTokens();
      expect(result).not.toBeNull();
      expect(result!.access_token).toBe('test_access_token');
      expect(result!.company_id).toBe(12345);
    });

    it('returns null when file contains invalid JSON', async () => {
      await fs.mkdir(mocks.tmpDir, { recursive: true, mode: 0o700 });
      await fs.writeFile(mocks.tmpTokenFile, 'not-valid-json', 'utf-8');
      const result = await loadTokens();
      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('removes the token file', async () => {
      await saveTokens(sampleTokens);
      await clearTokens();
      const exists = await fs.access(mocks.tmpTokenFile).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('does not throw when token file does not exist', async () => {
      await expect(clearTokens()).resolves.toBeUndefined();
    });
  });
});
