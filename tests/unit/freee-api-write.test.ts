import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FreeeTokens } from '../../src/types/freee.js';

vi.mock('../../src/utils/token-store.js', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  isTokenExpired: vi.fn(),
}));

import { loadTokens, isTokenExpired } from '../../src/utils/token-store.js';
import { FreeeApiClient } from '../../src/utils/freee-api.js';

const validTokens: FreeeTokens = {
  access_token: 'valid_token',
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_at: Date.now() + 3600 * 1000,
  company_id: 99,
};

function makeResponse(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data } as Response;
}

describe('FreeeApiClient — write methods', () => {
  let client: FreeeApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(isTokenExpired).mockReturnValue(false);
    client = new FreeeApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('createWalletable', () => {
    it('POSTs to /api/1/walletables with company_id', async () => {
      fetchMock.mockResolvedValue(makeResponse({ walletable: { id: 1, name: 'テスト口座', type: 'bank_account', company_id: 99 } }));
      const result = await client.createWalletable(99, { type: 'bank_account', name: 'テスト口座' });
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.freee.co.jp/api/1/walletables');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body as string);
      expect(body.company_id).toBe(99);
      expect(body.name).toBe('テスト口座');
      expect(result.id).toBe(1);
    });
  });

  describe('deleteWalletable', () => {
    it('DELETEs /api/1/walletables/{type}/{id}', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await client.deleteWalletable(99, 42, 'bank_account');
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/walletables/bank_account/42');
      expect(opts.method).toBe('DELETE');
    });

    it('credit_card タイプも正しい URL を使う', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await client.deleteWalletable(99, 99, 'credit_card');
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/walletables/credit_card/99');
    });
  });

  describe('createDeal', () => {
    it('POSTs to /api/1/deals with deal data', async () => {
      const dealData = { issue_date: '2026-01-15', type: 'income' as const, details: [{ tax_code: 21, amount: 550000, account_item_id: 1 }] };
      fetchMock.mockResolvedValue(makeResponse({ deal: { id: 10, company_id: 99, issue_date: '2026-01-15', type: 'income', amount: 550000 } }));
      const result = await client.createDeal(99, dealData);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/1/deals');
      expect(result.id).toBe(10);
    });
  });

  describe('deleteDeal', () => {
    it('DELETEs /api/1/deals/{id}', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await client.deleteDeal(99, 55);
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/deals/55');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('createManualJournal', () => {
    it('POSTs to /api/1/manual_journals', async () => {
      const mjData = {
        issue_date: '2026-01-31',
        details: [
          { entry_side: 'debit' as const, account_item_id: 1, tax_code: 0, amount: 100000 },
          { entry_side: 'credit' as const, account_item_id: 2, tax_code: 0, amount: 100000 },
        ],
      };
      fetchMock.mockResolvedValue(makeResponse({ manual_journal: { id: 20, company_id: 99, issue_date: '2026-01-31' } }));
      const result = await client.createManualJournal(99, mjData);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/1/manual_journals');
      expect(result.id).toBe(20);
    });
  });

  describe('createReceipt', () => {
    it('POSTs multipart form data to /api/1/receipts with company_id', async () => {
      fetchMock.mockResolvedValue(makeResponse({ receipt: { id: 88, company_id: 99, description: '交通費領収書' } }));
      const result = await client.createReceipt(99, {
        filename: 'receipt-001.png',
        mimeType: 'image/png',
        contentBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0V8AAAAASUVORK5CYII=',
        description: '交通費領収書',
        receipt_metadatum_amount: 18500,
      });
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.freee.co.jp/api/1/receipts');
      expect(opts.method).toBe('POST');
      expect(opts.body).toBeInstanceOf(FormData);
      const body = opts.body as FormData;
      expect(body.get('company_id')).toBe('99');
      expect(body.get('description')).toBe('交通費領収書');
      expect(body.get('receipt_metadatum_amount')).toBe('18500');
      expect(body.get('receipt')).toBeInstanceOf(File);
      expect(result.id).toBe(88);
    });
  });

  describe('deleteReceipt', () => {
    it('DELETEs /api/1/receipts/{id}', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await client.deleteReceipt(99, 88);
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/receipts/88');
      expect(url).toContain('company_id=99');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('deleteManualJournal', () => {
    it('DELETEs /api/1/manual_journals/{id}', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 204));
      await client.deleteManualJournal(99, 77);
      const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/manual_journals/77');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('getAccountItems', () => {
    it('calls /api/1/account_items with company_id', async () => {
      fetchMock.mockResolvedValue(makeResponse({ account_items: [{ id: 1, name: '売上高', account_category: 'income' }] }));
      const result = await client.getAccountItems(99);
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/1/account_items');
      expect(url).toContain('company_id=99');
      expect(result[0].name).toBe('売上高');
    });
  });

  describe('getTaxes', () => {
    it('calls /api/1/taxes/companies/{id}', async () => {
      fetchMock.mockResolvedValue(makeResponse({ taxes: [{ id: 1, code: 21, name: '課税売上10%' }] }));
      const result = await client.getTaxes(99);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/1/taxes/companies/99');
      expect(result[0].code).toBe(21);
    });
  });

  describe('getWalletables', () => {
    it('calls /api/1/walletables with company_id', async () => {
      fetchMock.mockResolvedValue(makeResponse({ walletables: [{ id: 1, name: '普通預金', type: 'bank_account', company_id: 99 }] }));
      const result = await client.getWalletables(99);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/1/walletables');
      expect(result[0].name).toBe('普通預金');
    });
  });

  describe('getDeals', () => {
    it('calls /api/1/deals with company_id', async () => {
      fetchMock.mockResolvedValue(makeResponse({ deals: [] }));
      await client.getDeals(99);
      expect(fetchMock.mock.calls[0][0]).toContain('/api/1/deals');
      expect(fetchMock.mock.calls[0][0]).toContain('company_id=99');
    });
  });
});
