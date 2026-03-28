import { loadTokens, saveTokens, isTokenExpired } from './token-store.js';
import type { FreeeTokens, FreeeUser, FreeeCompany } from '../types/freee.js';
import { createRequire } from 'node:module';
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

  private async request<T>(path: string): Promise<T> {
    const tokens = await this.getValidTokens();

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`freee API error: ${res.status} ${path}`);
    }

    return res.json() as Promise<T>;
  }

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
}
