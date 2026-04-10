import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PresetState } from '../../src/types/freee.js';

// vi.hoisted でモックファクトリを初期化（TDZ回避）
const mocks = vi.hoisted(() => ({
  stateFile: `/tmp/fdk-status-test-${process.pid}/state.json`,
}));

vi.mock('../../src/utils/config.js', () => ({
  CONFIG_DIR: `/tmp/fdk-status-test-${process.pid}`,
  STATE_FILE: mocks.stateFile,
  TOKEN_FILE: `/tmp/fdk-status-test-${process.pid}/tokens.json`,
  CONFIG_FILE: `/tmp/fdk-status-test-${process.pid}/config.json`,
}));

// state-store をモック（statusコマンドのテストに必要）
const mockListAllStates = vi.fn<[], Promise<PresetState[]>>();

vi.mock('../../src/utils/state-store.js', () => ({
  listAllStates: mockListAllStates,
  saveState: vi.fn(),
  loadState: vi.fn(),
  clearState: vi.fn(),
}));

describe('fdk status コマンド', () => {
  let stdoutOutput: string[];
  const originalLog = console.log;

  beforeEach(() => {
    stdoutOutput = [];
    console.log = (...args: unknown[]) => {
      stdoutOutput.push(args.map(String).join(' '));
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('state が空の場合は「投入済みプリセットなし」を表示する', async () => {
    mockListAllStates.mockResolvedValue([]);

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand.parseAsync([], { from: 'user' });

    const output = stdoutOutput.join('\n');
    expect(output).toContain('投入済みプリセットなし');
  });

  it('投入済みプリセットが1件の場合、その情報を表示する', async () => {
    const state: PresetState = {
      preset: 'accounting/quickstart',
      loadedAt: '2026-01-15T10:00:00.000Z',
      walletableIds: [101, 102, 103],
      dealIds: Array.from({ length: 50 }, (_, i) => i + 1),
      manualJournalIds: [201, 202, 203, 204, 205],
      receiptIds: [301, 302],
    };
    mockListAllStates.mockResolvedValue([state]);

    // Reimport to clear module cache
    vi.resetModules();
    vi.mock('../../src/utils/state-store.js', () => ({
      listAllStates: mockListAllStates,
      saveState: vi.fn(),
      loadState: vi.fn(),
      clearState: vi.fn(),
    }));

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand.parseAsync([], { from: 'user' });

    const output = stdoutOutput.join('\n');
    expect(output).toContain('accounting/quickstart');
    expect(output).toContain('口座 3件');
    expect(output).toContain('取引 50件');
    expect(output).toContain('仕訳 5件');
    expect(output).toContain('証憑 2件');
  });

  it('投入済みプリセットが複数件の場合、すべて表示する', async () => {
    const states: PresetState[] = [
      {
        preset: 'accounting/quickstart',
        loadedAt: '2026-01-15T10:00:00.000Z',
        walletableIds: [101, 102, 103],
        dealIds: Array.from({ length: 50 }, (_, i) => i + 1),
        manualJournalIds: [201, 202, 203, 204, 205],
        receiptIds: [301],
      },
      {
        preset: 'hr/quickstart',
        loadedAt: '2026-01-16T09:00:00.000Z',
        walletableIds: [201],
        dealIds: Array.from({ length: 15 }, (_, i) => i + 100),
        manualJournalIds: Array.from({ length: 9 }, (_, i) => i + 300),
        receiptIds: [],
      },
    ];
    mockListAllStates.mockResolvedValue(states);

    vi.resetModules();
    vi.mock('../../src/utils/state-store.js', () => ({
      listAllStates: mockListAllStates,
      saveState: vi.fn(),
      loadState: vi.fn(),
      clearState: vi.fn(),
    }));

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand.parseAsync([], { from: 'user' });

    const output = stdoutOutput.join('\n');
    expect(output).toContain('accounting/quickstart');
    expect(output).toContain('hr/quickstart');
    // 合計2件表示
    expect(output).toMatch(/2\s*件|2件/);
  });
});
