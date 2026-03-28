import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FreeeTokens } from '../../src/types/freee.js';

// Mock token-store
vi.mock('../../src/utils/token-store.js', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  isTokenExpired: vi.fn(),
}));

import { loadTokens, saveTokens, isTokenExpired } from '../../src/utils/token-store.js';
import { FreeeApiClient } from '../../src/utils/freee-api.js';

const validTokens: FreeeTokens = {
  access_token: 'valid_access_token',
  refresh_token: 'valid_refresh_token',
  token_type: 'bearer',
  expires_at: Date.now() + 3600 * 1000,
  company_id: 99,
};

function makeResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe('FreeeApiClient', () => {
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

  describe('getMe', () => {
    it('calls /api/1/users/me with Bearer token', async () => {
      const userData = { user: { id: 1, email: 'test@example.com', display_name: 'Test User', companies: [] } };
      fetchMock.mockResolvedValue(makeResponse(userData));

      const result = await client.getMe();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.freee.co.jp/api/1/users/me');
      expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer valid_access_token');
      expect(result.id).toBe(1);
    });

    it('includes User-Agent header', async () => {
      const userData = { user: { id: 1, email: 'test@example.com', display_name: 'Test', companies: [] } };
      fetchMock.mockResolvedValue(makeResponse(userData));

      await client.getMe();

      const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((opts.headers as Record<string, string>)['User-Agent']).toMatch(/freee-demo-kit\//);
    });
  });

  describe('getCompanies', () => {
    it('calls /api/1/companies and returns company list', async () => {
      const companiesData = { companies: [{ id: 1, name: 'Test Co', display_name: 'テスト' }] };
      fetchMock.mockResolvedValue(makeResponse(companiesData));

      const result = await client.getCompanies();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.freee.co.jp/api/1/companies');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Co');
    });
  });

  describe('getCompany', () => {
    it('calls /api/1/companies/:id', async () => {
      const companyData = { company: { id: 5, name: 'Test Co', display_name: 'テスト' } };
      fetchMock.mockResolvedValue(makeResponse(companyData));

      const result = await client.getCompany(5);

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.freee.co.jp/api/1/companies/5');
      expect(result.id).toBe(5);
    });
  });

  describe('token refresh on expired token', () => {
    it('refreshes token when expired and retries the original request', async () => {
      process.env['FREEE_CLIENT_ID'] = 'test_client_id';
      process.env['FREEE_CLIENT_SECRET'] = 'test_client_secret';
      vi.mocked(isTokenExpired).mockReturnValue(true);

      const userData = { user: { id: 1, email: 'test@example.com', display_name: 'Test', companies: [] } };
      fetchMock
        // First: token refresh endpoint
        .mockResolvedValueOnce(makeResponse({
          token_type: 'bearer',
          access_token: 'refreshed_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 7200,
          created_at: Math.floor(Date.now() / 1000),
        }))
        // Second: actual API call with refreshed token
        .mockResolvedValueOnce(makeResponse(userData));

      const result = await client.getMe();
      expect(result.id).toBe(1);
      expect(saveTokens).toHaveBeenCalled();

      delete process.env['FREEE_CLIENT_ID'];
      delete process.env['FREEE_CLIENT_SECRET'];
    });
  });

  describe('error handling', () => {
    it('throws with helpful message when not authenticated', async () => {
      vi.mocked(loadTokens).mockResolvedValue(null);

      await expect(client.getMe()).rejects.toThrow(/fdk auth/);
    });
  });
});
