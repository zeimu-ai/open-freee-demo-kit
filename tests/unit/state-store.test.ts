import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';

const mocks = vi.hoisted(() => {
  const tmpDir = `/tmp/fdk-state-test-${process.pid}`;
  return { tmpDir, stateFile: `${tmpDir}/state.json` };
});

vi.mock('../../src/utils/config.js', () => ({
  CONFIG_DIR: mocks.tmpDir,
  TOKEN_FILE: `${mocks.tmpDir}/tokens.json`,
  CONFIG_FILE: `${mocks.tmpDir}/config.json`,
  STATE_FILE: mocks.stateFile,
  getConfigDir: () => mocks.tmpDir,
  getTokenFile: () => `${mocks.tmpDir}/tokens.json`,
}));

import { saveState, loadState, clearState, listAllStates } from '../../src/utils/state-store.js';
import type { PresetState } from '../../src/types/freee.js';

const sampleState: PresetState = {
  preset: 'accounting/quickstart',
  loadedAt: '2026-01-15T10:00:00.000Z',
  walletableIds: [101, 102, 103],
  dealIds: [201, 202, 203],
  manualJournalIds: [301],
  receiptIds: [401],
};

describe('state-store', () => {
  beforeEach(async () => {
    await fs.rm(mocks.tmpDir, { recursive: true, force: true });
  });
  afterEach(async () => {
    await fs.rm(mocks.tmpDir, { recursive: true, force: true });
  });

  describe('saveState', () => {
    it('saves state to state.json with chmod 600', async () => {
      await saveState(sampleState);
      const raw = await fs.readFile(mocks.stateFile, 'utf-8');
      const saved = JSON.parse(raw);
      expect(saved['accounting/quickstart'].walletableIds).toEqual([101, 102, 103]);
      expect(saved['accounting/quickstart'].dealIds).toEqual([201, 202, 203]);
    });

    it('creates file with mode 0o600', async () => {
      await saveState(sampleState);
      const stat = await fs.stat(mocks.stateFile);
      expect(stat.mode & 0o077).toBe(0);
    });

    it('merges multiple presets in the same file', async () => {
      await saveState(sampleState);
      const state2: PresetState = { preset: 'hr', loadedAt: '2026-01-16T00:00:00.000Z', walletableIds: [], dealIds: [999], manualJournalIds: [], receiptIds: [] };
      await saveState(state2);
      const raw = await fs.readFile(mocks.stateFile, 'utf-8');
      const saved = JSON.parse(raw);
      expect(saved['accounting/quickstart']).toBeDefined();
      expect(saved['hr'].dealIds).toEqual([999]);
    });
  });

  describe('loadState', () => {
    it('returns null when file does not exist', async () => {
      expect(await loadState('accounting/quickstart')).toBeNull();
    });

    it('returns null when preset not in state', async () => {
      await saveState(sampleState);
      expect(await loadState('nonexistent')).toBeNull();
    });

    it('returns preset state when it exists', async () => {
      await saveState(sampleState);
      const result = await loadState('accounting/quickstart');
      expect(result).not.toBeNull();
      expect(result!.walletableIds).toEqual([101, 102, 103]);
    });
  });

  describe('clearState', () => {
    it('removes a preset from state without deleting other presets', async () => {
      await saveState(sampleState);
      const state2: PresetState = { preset: 'hr', loadedAt: '2026-01-16T00:00:00.000Z', walletableIds: [], dealIds: [999], manualJournalIds: [], receiptIds: [] };
      await saveState(state2);
      await clearState('accounting/quickstart');
      const raw = await fs.readFile(mocks.stateFile, 'utf-8');
      const saved = JSON.parse(raw);
      expect(saved['accounting/quickstart']).toBeUndefined();
      expect(saved['hr']).toBeDefined();
    });

    it('does not throw when preset does not exist', async () => {
      await expect(clearState('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('listAllStates', () => {
    it('空のstateは空配列を返す', async () => {
      const result = await listAllStates();
      expect(result).toEqual([]);
    });

    it('1件のstateは1要素の配列を返す', async () => {
      await saveState(sampleState);
      const result = await listAllStates();
      expect(result).toHaveLength(1);
      expect(result[0].preset).toBe('accounting/quickstart');
    });

    it('複数のstateは全要素を返す', async () => {
      await saveState(sampleState);
      const state2: PresetState = { preset: 'hr/quickstart', loadedAt: '2026-02-01T00:00:00.000Z', walletableIds: [10], dealIds: [20], manualJournalIds: [], receiptIds: [] };
      const state3: PresetState = { preset: 'invoices/quickstart', loadedAt: '2026-02-02T00:00:00.000Z', walletableIds: [], dealIds: [30, 31], manualJournalIds: [40], receiptIds: [50] };
      await saveState(state2);
      await saveState(state3);
      const result = await listAllStates();
      expect(result).toHaveLength(3);
      const presets = result.map(s => s.preset).sort();
      expect(presets).toEqual(['accounting/quickstart', 'hr/quickstart', 'invoices/quickstart'].sort());
    });
  });
});
