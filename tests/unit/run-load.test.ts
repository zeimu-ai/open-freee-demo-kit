import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies
vi.mock('../../src/utils/preset-validator.js', () => ({
  validatePresetName: vi.fn(),
  PRESETS_DIR: '/fake/presets',
}));

vi.mock('../../src/utils/preset-loader.js', () => ({
  loadPreset: vi.fn(),
}));

vi.mock('../../src/utils/token-store.js', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  isTokenExpired: vi.fn(),
}));

vi.mock('../../src/utils/freee-api.js', () => ({
  FreeeApiClient: vi.fn(),
}));

vi.mock('../../src/utils/state-store.js', () => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
}));

vi.mock('../../src/utils/confirm-company.js', () => ({
  confirmCompany: vi.fn(),
}));

vi.mock('../../src/utils/logger.js', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

import { loadPreset } from '../../src/utils/preset-loader.js';
import { loadTokens, saveTokens } from '../../src/utils/token-store.js';
import { FreeeApiClient } from '../../src/utils/freee-api.js';
import { loadState, saveState } from '../../src/utils/state-store.js';
import { confirmCompany } from '../../src/utils/confirm-company.js';
import { warn } from '../../src/utils/logger.js';
import { runLoad, LoadProgress } from '../../src/commands/load.js';

const mockPreset = {
  name: 'テストプリセット',
  description: 'テスト用',
  version: '1.0.0',
  expected: { walletables: 1, deals: 2, manualJournals: 1 },
  data: {
    walletables: [{ type: 'bank_account' as const, name: 'テスト銀行', bank_id: 1 }],
    deals: [
      {
        issue_date: '2026-01-15',
        type: 'income' as const,
        partner_name: '株式会社テスト',
        details: [{ account_item_name: '売上高', tax_code: 21, amount: 100000 }],
      },
      {
        issue_date: '2026-01-20',
        type: 'expense' as const,
        partner_name: '費用先',
        details: [{ account_item_name: '消耗品費', tax_code: 34, amount: 5000 }],
      },
    ],
    manualJournals: [
      {
        issue_date: '2026-01-31',
        details: [
          { entry_side: 'debit' as const, account_item_name: '売掛金', tax_code: 21, amount: 100000 },
          { entry_side: 'credit' as const, account_item_name: '売上高', tax_code: 21, amount: 100000 },
        ],
      },
    ],
  },
};

const validTokens = {
  access_token: 'test_token',
  refresh_token: 'test_refresh',
  token_type: 'bearer',
  expires_at: Date.now() + 3600_000,
  company_id: 1,
};

function makeApiClient() {
  return {
    getCompany: vi.fn().mockResolvedValue({ id: 1, name: 'テスト事業所', display_name: 'テスト事業所' }),
    getCompanies: vi.fn().mockResolvedValue([{ id: 1, name: 'テスト事業所', display_name: 'テスト事業所' }]),
    getWalletables: vi.fn().mockResolvedValue([]),
    createWalletable: vi.fn().mockResolvedValue({ id: 101 }),
    getAccountItems: vi.fn().mockResolvedValue([
      { id: 1001, name: '売上高' },
      { id: 1002, name: '消耗品費' },
      { id: 1003, name: '売掛金' },
    ]),
    createDeal: vi.fn().mockResolvedValue({ id: 201 }),
    createManualJournal: vi.fn().mockResolvedValue({ id: 301 }),
  };
}

describe('runLoad', () => {
  let apiClientMock: ReturnType<typeof makeApiClient>;

  beforeEach(() => {
    vi.mocked(loadPreset).mockResolvedValue(mockPreset as any);
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(saveTokens).mockResolvedValue(undefined);
    vi.mocked(loadState).mockResolvedValue(null);
    vi.mocked(saveState).mockResolvedValue(undefined);
    vi.mocked(confirmCompany).mockResolvedValue(true);

    apiClientMock = makeApiClient();
    vi.mocked(FreeeApiClient).mockImplementation(() => apiClientMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('dryRun', () => {
    it('dryRun=true のとき API を呼ばず空配列を返す', async () => {
      const result = await runLoad('accounting/quickstart', { dryRun: true });
      expect(result.walletableIds).toEqual([]);
      expect(result.dealIds).toEqual([]);
      expect(result.manualJournalIds).toEqual([]);
      expect(apiClientMock.createWalletable).not.toHaveBeenCalled();
    });

    it('dryRun=true のとき presetName を返す', async () => {
      const result = await runLoad('accounting/quickstart', { dryRun: true });
      expect(result.presetName).toBe('テストプリセット');
    });

    it('dryRun=true のとき companyName は空文字列', async () => {
      const result = await runLoad('accounting/quickstart', { dryRun: true });
      expect(result.companyName).toBe('');
    });
  });

  describe('既存ステートのチェック', () => {
    it('force なしで既ロード済みのとき throw する', async () => {
      vi.mocked(loadState).mockResolvedValue({
        preset: 'accounting/quickstart',
        loadedAt: '2026-01-01T00:00:00.000Z',
        walletableIds: [1],
        dealIds: [2],
        manualJournalIds: [3],
      });
      await expect(runLoad('accounting/quickstart', {})).rejects.toThrow(/既にロード済みです/);
    });

    it('force=true のとき既ロード済みでも続行する', async () => {
      vi.mocked(loadState).mockResolvedValue({
        preset: 'accounting/quickstart',
        loadedAt: '2026-01-01T00:00:00.000Z',
        walletableIds: [1],
        dealIds: [2],
        manualJournalIds: [3],
      });
      const result = await runLoad('accounting/quickstart', { force: true, yes: true });
      expect(result.dealIds).not.toEqual([]);
    });
  });

  describe('認証チェック', () => {
    it('tokens が null のとき throw する', async () => {
      vi.mocked(loadTokens).mockResolvedValue(null);
      await expect(runLoad('accounting/quickstart', {})).rejects.toThrow(/Not authenticated/);
    });
  });

  describe('confirmCompany', () => {
    it('confirmCompany が false を返したとき CANCELLED を throw する', async () => {
      vi.mocked(confirmCompany).mockResolvedValue(false);
      await expect(runLoad('accounting/quickstart', {})).rejects.toThrow('CANCELLED');
    });
  });

  describe('walletable スキップ', () => {
    it('既存のwalletableはスキップされwallet ableIdsに含まれない', async () => {
      apiClientMock.getWalletables.mockResolvedValue([{ id: 50, type: 'bank_account', name: 'テスト銀行', company_id: 1 }]);
      const result = await runLoad('accounting/quickstart', { yes: true });
      expect(apiClientMock.createWalletable).not.toHaveBeenCalled();
      expect(result.walletableIds).not.toContain(50);
    });
  });

  describe('勘定科目未解決', () => {
    it('勘定科目が見つからないとき warn して続行する', async () => {
      apiClientMock.getAccountItems.mockResolvedValue([]); // 勘定科目マップ空
      const result = await runLoad('accounting/quickstart', { yes: true });
      expect(vi.mocked(warn)).toHaveBeenCalledWith(expect.stringContaining('勘定科目が見つかりません'));
      // エラーにならず続行している
      expect(result.presetName).toBe('テストプリセット');
    });
  });

  describe('onProgress コールバック', () => {
    it('walletables / deals / journals の各ステージで呼ばれる', async () => {
      const progress: LoadProgress[] = [];
      await runLoad('accounting/quickstart', { yes: true }, (p) => progress.push({ ...p }));

      const stages = progress.map(p => p.stage);
      expect(stages).toContain('walletables');
      expect(stages).toContain('deals');
      expect(stages).toContain('journals');
    });

    it('deals の current は 1 から始まり total まで増える', async () => {
      const dealProgress: LoadProgress[] = [];
      await runLoad('accounting/quickstart', { yes: true }, (p) => {
        if (p.stage === 'deals') dealProgress.push({ ...p });
      });

      expect(dealProgress[0].current).toBe(1);
      expect(dealProgress[0].total).toBe(2);
      expect(dealProgress[dealProgress.length - 1].current).toBe(2);
    });
  });

  describe('正常系', () => {
    it('作成された walletableIds / dealIds / manualJournalIds を返す', async () => {
      apiClientMock.createWalletable.mockResolvedValue({ id: 101 });
      apiClientMock.createDeal
        .mockResolvedValueOnce({ id: 201 })
        .mockResolvedValueOnce({ id: 202 });
      apiClientMock.createManualJournal.mockResolvedValue({ id: 301 });

      const result = await runLoad('accounting/quickstart', { yes: true });

      expect(result.walletableIds).toEqual([101]);
      expect(result.dealIds).toEqual([201, 202]);
      expect(result.manualJournalIds).toEqual([301]);
    });

    it('saveState が正しく呼ばれる', async () => {
      await runLoad('accounting/quickstart', { yes: true });
      expect(vi.mocked(saveState)).toHaveBeenCalledWith(
        expect.objectContaining({
          preset: 'accounting/quickstart',
          walletableIds: expect.any(Array),
          dealIds: expect.any(Array),
          manualJournalIds: expect.any(Array),
        })
      );
    });
  });
});
