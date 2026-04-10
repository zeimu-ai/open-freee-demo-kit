import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FreeeTokens } from '../../src/types/freee.js';

vi.mock('../../src/utils/token-store.js', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  isTokenExpired: vi.fn(),
}));

import { loadTokens, saveTokens, isTokenExpired } from '../../src/utils/token-store.js';
import { FreeeApiClient } from '../../src/utils/freee-api.js';

const validTokens: FreeeTokens = {
  access_token: 'test_token',
  refresh_token: 'test_refresh',
  token_type: 'bearer',
  expires_at: Date.now() + 3600 * 1000,
  company_id: 1,
};

function makeResponse(data: unknown, status: number, textBody = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => textBody,
  } as Response;
}

describe('FreeeApiClient — error handling', () => {
  let client: FreeeApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(isTokenExpired).mockReturnValue(false);
    vi.mocked(saveTokens).mockResolvedValue(undefined);
    client = new FreeeApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('GET エラー', () => {
    it('404 のとき "freee API error: 404 /api/..." を throw する', async () => {
      fetchMock.mockResolvedValue(makeResponse({}, 404));
      await expect(client.getCompany(999)).rejects.toThrow('freee API error: 404 /api/1/companies/999');
    });

    it('500 のとき "freee API error: 500 /api/..." を throw する', async () => {
      fetchMock.mockResolvedValue(makeResponse({}, 500));
      await expect(client.getMe()).rejects.toThrow('freee API error: 500 /api/1/users/me');
    });

    it('ネットワークエラーはそのまま伝播する', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      await expect(client.getMe()).rejects.toThrow('fetch failed');
    });
  });

  describe('POST エラー', () => {
    it('422 のときレスポンスボディを含むエラーを throw する', async () => {
      fetchMock.mockResolvedValue(makeResponse({}, 422, '{"errors":["invalid"]}'));
      await expect(
        client.createWalletable(1, { type: 'bank_account', name: 'test', bank_id: 1 })
      ).rejects.toThrow('freee API error: 422 POST /api/1/walletables');
    });

    it('422 のときレスポンスボディのテキストをエラーメッセージに含める', async () => {
      const errorBody = '{"message":"validation failed"}';
      fetchMock.mockResolvedValue(makeResponse({}, 422, errorBody));
      await expect(
        client.createDeal(1, {
          issue_date: '2026-01-01',
          type: 'income',
          details: [],
        })
      ).rejects.toThrow(errorBody);
    });

    it('text() が失敗してもエラーを throw する（空文字列で）', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => { throw new Error('read error'); },
        json: async () => ({}),
      } as unknown as Response);
      await expect(
        client.createDeal(1, { issue_date: '2026-01-01', type: 'income', details: [] })
      ).rejects.toThrow('freee API error: 500 POST /api/1/deals');
    });

    it('receipt upload 失敗時もレスポンス本文を含める', async () => {
      fetchMock.mockResolvedValue(makeResponse({}, 422, '{"message":"invalid receipt"}'));
      await expect(
        client.createReceipt(1, {
          filename: 'receipt-001.png',
          mimeType: 'image/png',
          contentBase64: 'AAAA',
        })
      ).rejects.toThrow('invalid receipt');
    });
  });

  describe('DELETE エラー', () => {
    it('400 のとき "freee API error: 400 DELETE /api/..." を throw する', async () => {
      fetchMock.mockResolvedValue(makeResponse({}, 400));
      await expect(
        client.deleteWalletable(1, 999, 'bank_account')
      ).rejects.toThrow('freee API error: 400 DELETE /api/1/walletables/bank_account/999');
    });

    it('204 のとき throw しない（正常終了）', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await expect(
        client.deleteWalletable(1, 123, 'bank_account')
      ).resolves.toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    it('FREEE_CLIENT_ID が未設定のとき認証期限切れエラーを throw する', async () => {
      vi.mocked(isTokenExpired).mockReturnValue(true);
      const origId = process.env['FREEE_CLIENT_ID'];
      const origSecret = process.env['FREEE_CLIENT_SECRET'];
      delete process.env['FREEE_CLIENT_ID'];
      delete process.env['FREEE_CLIENT_SECRET'];

      await expect(client.getMe()).rejects.toThrow(/re-authenticate/);

      if (origId) process.env['FREEE_CLIENT_ID'] = origId;
      if (origSecret) process.env['FREEE_CLIENT_SECRET'] = origSecret;
    });

    it('トークンエンドポイントが非200を返したとき throw する', async () => {
      vi.mocked(isTokenExpired).mockReturnValue(true);
      process.env['FREEE_CLIENT_ID'] = 'test_client';
      process.env['FREEE_CLIENT_SECRET'] = 'test_secret';

      fetchMock.mockResolvedValue(makeResponse({}, 400));

      await expect(client.getMe()).rejects.toThrow(/Token refresh failed/);

      delete process.env['FREEE_CLIENT_ID'];
      delete process.env['FREEE_CLIENT_SECRET'];
    });
  });
});
