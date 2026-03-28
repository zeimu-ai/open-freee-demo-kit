import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadPreset } from '../../src/utils/preset-loader.js';

const dirs = vi.hoisted(() => {
  const tmpDir = `/tmp/fdk-loader-test-${process.pid}`;
  return { tmpDir, presetsDir: `${tmpDir}/presets` };
});

vi.mock('../../src/utils/preset-validator.js', () => ({
  validatePresetName: vi.fn(),
  PRESETS_DIR: dirs.presetsDir,
}));

const tmpDir = dirs.tmpDir;
const presetsDir = dirs.presetsDir;

const samplePreset = {
  name: 'テスト プリセット',
  description: 'ユニットテスト用',
  version: '1.0.0',
  expected: { walletables: 1, deals: 2, manualJournals: 0 },
  data: {
    walletables: [{ type: 'bank_account', name: '普通預金' }],
    deals: [
      { issue_date: '2026-01-15', type: 'income', details: [{ account_item_name: '売上高', tax_code: 21, amount: 100000 }] },
      { issue_date: '2026-01-20', type: 'expense', details: [{ account_item_name: '消耗品費', tax_code: 34, amount: 5000 }] },
    ],
    manualJournals: [],
  },
};

describe('preset-loader', () => {
  beforeEach(async () => {
    await fs.mkdir(path.join(presetsDir, 'test-preset'), { recursive: true });
    await fs.writeFile(
      path.join(presetsDir, 'test-preset', 'preset.json'),
      JSON.stringify(samplePreset),
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('loads and parses a valid preset.json', async () => {
    const preset = await loadPreset('test-preset');
    expect(preset.name).toBe('テスト プリセット');
    expect(preset.data.walletables).toHaveLength(1);
    expect(preset.data.deals).toHaveLength(2);
    expect(preset.expected.walletables).toBe(1);
  });

  it('throws when preset directory does not exist', async () => {
    await expect(loadPreset('nonexistent')).rejects.toThrow(/preset not found/i);
  });

  it('throws when preset.json is missing required fields', async () => {
    const badPreset = { name: 'bad', description: 'missing fields' };
    await fs.writeFile(
      path.join(presetsDir, 'test-preset', 'preset.json'),
      JSON.stringify(badPreset),
      'utf-8'
    );
    await expect(loadPreset('test-preset')).rejects.toThrow(/invalid preset/i);
  });

  it('throws when preset.json has invalid JSON', async () => {
    await fs.writeFile(
      path.join(presetsDir, 'test-preset', 'preset.json'),
      'not json',
      'utf-8'
    );
    await expect(loadPreset('test-preset')).rejects.toThrow();
  });
});
