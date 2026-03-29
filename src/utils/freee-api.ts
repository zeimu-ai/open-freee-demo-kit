import { loadTokens, saveTokens, isTokenExpired } from './token-store.js';
import type {
  FreeeTokens,
  FreeeUser,
  FreeeCompany,
  FreeeWalletable,
  WalletableData,
  WalletableType,
  FreeeDeal,
  DealData,
  FreeeManualJournal,
  ManualJournalData,
  FreeeAccountItem,
  FreeeTax,
} from '../types/freee.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'https://api.freee.co.jp';
const TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token';

function getVersion(): string {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

const USER_AGENT = `freee-demo-kit/${getVersion()}`;

export class FreeeApiClient {
  private async getValidTokens(): Promise<FreeeTokens> {
    const tokens = await loadTokens();
    if (!tokens) {
      throw new Error('Not authenticated. Run `fdk auth` to authenticate with freee.');
    }

    if (isTokenExpired(tokens)) {
      return this.refreshTokens(tokens);
    }

    return tokens;
  }

  private async refreshTokens(tokens: FreeeTokens): Promise<FreeeTokens> {
    const clientId = process.env['FREEE_CLIENT_ID'];
    const clientSecret = process.env['FREEE_CLIENT_SECRET'];

    if (!clientId || !clientSecret) {
      throw new Error(
        'Authentication expired. Run `fdk auth` to re-authenticate with freee.'
      );
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
    });

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(
        'Token refresh failed. Run `fdk auth` to re-authenticate with freee.'
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      created_at: number;
    };

    const newTokens: FreeeTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: (data.created_at + data.expires_in) * 1000,
      company_id: tokens.company_id,
    };

    await saveTokens(newTokens);
    return newTokens;
  }

  private async request<T>(apiPath: string): Promise<T> {
    const tokens = await this.getValidTokens();

    const res = await fetch(`${BASE_URL}${apiPath}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`freee API error: ${res.status} ${apiPath}`);
    }

    return res.json() as Promise<T>;
  }

  private async requestPost<T>(apiPath: string, body: unknown): Promise<T> {
    const tokens = await this.getValidTokens();

    const res = await fetch(`${BASE_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`freee API error: ${res.status} POST ${apiPath} — ${text}`);
    }

    return res.json() as Promise<T>;
  }

  private async requestDelete(apiPath: string): Promise<void> {
    const tokens = await this.getValidTokens();

    const res = await fetch(`${BASE_URL}${apiPath}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`freee API error: ${res.status} DELETE ${apiPath}`);
    }
  }

  // ── GET endpoints ───────────────────────────────────────────────────────

  async getMe(): Promise<FreeeUser> {
    const data = await this.request<{ user: FreeeUser }>('/api/1/users/me');
    return data.user;
  }

  async getCompanies(): Promise<FreeeCompany[]> {
    const data = await this.request<{ companies: FreeeCompany[] }>('/api/1/companies');
    return data.companies;
  }

  async getCompany(companyId: number): Promise<FreeeCompany> {
    const data = await this.request<{ company: FreeeCompany }>(`/api/1/companies/${companyId}`);
    return data.company;
  }

  async getWalletables(companyId: number): Promise<FreeeWalletable[]> {
    const data = await this.request<{ walletables: FreeeWalletable[] }>(
      `/api/1/walletables?company_id=${companyId}`
    );
    return data.walletables;
  }

  async getDeals(companyId: number, params?: Record<string, string>): Promise<FreeeDeal[]> {
    const query = new URLSearchParams({ company_id: String(companyId), ...params }).toString();
    const data = await this.request<{ deals: FreeeDeal[] }>(`/api/1/deals?${query}`);
    return data.deals;
  }

  async getAccountItems(companyId: number): Promise<FreeeAccountItem[]> {
    const data = await this.request<{ account_items: FreeeAccountItem[] }>(
      `/api/1/account_items?company_id=${companyId}`
    );
    return data.account_items;
  }

  async getTaxes(companyId: number): Promise<FreeeTax[]> {
    const data = await this.request<{ taxes: FreeeTax[] }>(
      `/api/1/taxes/companies/${companyId}`
    );
    return data.taxes;
  }

  async getTrialPl(companyId: number, params: Record<string, string>): Promise<unknown> {
    const query = new URLSearchParams({ company_id: String(companyId), ...params }).toString();
    return this.request<unknown>(`/api/1/trial_pl?${query}`);
  }

  async getTrialBs(companyId: number, params: Record<string, string>): Promise<unknown> {
    const query = new URLSearchParams({ company_id: String(companyId), ...params }).toString();
    return this.request<unknown>(`/api/1/trial_bs?${query}`);
  }

  // ── Walletable write ────────────────────────────────────────────────────

  async createWalletable(companyId: number, data: WalletableData): Promise<FreeeWalletable> {
    const res = await this.requestPost<{ walletable: FreeeWalletable }>('/api/1/walletables', {
      company_id: companyId,
      ...data,
    });
    return res.walletable;
  }

  async deleteWalletable(companyId: number, id: number, type: WalletableType): Promise<void> {
    await this.requestDelete(`/api/1/walletables/${type}/${id}?company_id=${companyId}`);
  }

  // ── Deal write ──────────────────────────────────────────────────────────

  async createDeal(companyId: number, data: DealData): Promise<FreeeDeal> {
    const res = await this.requestPost<{ deal: FreeeDeal }>('/api/1/deals', {
      company_id: companyId,
      ...data,
    });
    return res.deal;
  }

  async deleteDeal(companyId: number, id: number): Promise<void> {
    await this.requestDelete(`/api/1/deals/${id}?company_id=${companyId}`);
  }

  // ── ManualJournal write ─────────────────────────────────────────────────

  async createManualJournal(companyId: number, data: ManualJournalData): Promise<FreeeManualJournal> {
    const res = await this.requestPost<{ manual_journal: FreeeManualJournal }>(
      '/api/1/manual_journals',
      { company_id: companyId, ...data }
    );
    return res.manual_journal;
  }

  async deleteManualJournal(companyId: number, id: number): Promise<void> {
    await this.requestDelete(`/api/1/manual_journals/${id}?company_id=${companyId}`);
  }
}
