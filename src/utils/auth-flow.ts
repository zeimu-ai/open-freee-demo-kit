import http from 'node:http';
import { URL } from 'node:url';
import { generateCodeVerifier, generateCodeChallenge } from './pkce.js';
import { saveTokens } from './token-store.js';
import { FreeeApiClient } from './freee-api.js';
import { info, warn, error as logError } from './logger.js';
import type { FreeeTokens } from '../types/freee.js';

const FREEE_AUTH_URL = 'https://accounts.secure.freee.co.jp/public_api/authorize';
const FREEE_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token';
const CALLBACK_PORT = 8080;
export const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

export interface AuthResult {
  displayName: string;
  email: string;
  companies: { id: number; name: string }[];
}

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('node:child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function startCallbackServer(): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth callback timed out after 120 seconds'));
    }, 120_000);

    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      if (url.pathname !== '/callback') return;

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const errorParam = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:2rem">
        <h2>✅ freee 認証完了</h2>
        <p>このタブを閉じてターミナルに戻ってください。</p>
        </body></html>
      `);

      server.close();
      clearTimeout(timeout);

      if (errorParam || !code || !state) {
        reject(new Error(`OAuth error: ${errorParam ?? 'missing code or state'}`));
      } else {
        resolve({ code, state });
      }
    });

    server.listen(CALLBACK_PORT, () => {
      info(`Waiting for OAuth callback on port ${CALLBACK_PORT}...`);
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<FreeeTokens> {
  const clientId = process.env['FREEE_CLIENT_ID'];
  const clientSecret = process.env['FREEE_CLIENT_SECRET'];

  if (!clientId) throw new Error('FREEE_CLIENT_ID environment variable is not set');
  if (!clientSecret) throw new Error('FREEE_CLIENT_SECRET environment variable is not set');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(FREEE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    created_at: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_at: (data.created_at + data.expires_in) * 1000,
  };
}

/**
 * freee OAuth PKCE フローを実行してトークンを保存する。
 * 認証後のユーザー情報を返す。
 *
 * @param onBrowserOpen - ブラウザを開く前に URL を受け取るコールバック（省略可）
 */
export async function runOAuthPkceFlow(
  onBrowserOpen?: (url: string) => void
): Promise<AuthResult> {
  const clientId = process.env['FREEE_CLIENT_ID'];
  if (!clientId) {
    logError('FREEE_CLIENT_ID environment variable is not set.');
    throw new Error('FREEE_CLIENT_ID is not set');
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = Math.random().toString(36).slice(2);

  const authUrl = new URL(FREEE_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const urlString = authUrl.toString();
  onBrowserOpen?.(urlString);

  try {
    await openBrowser(urlString);
  } catch {
    warn('Could not open browser automatically. Please open the URL above manually.');
  }

  const { code, state: returnedState } = await startCallbackServer();

  if (returnedState !== state) {
    throw new Error('OAuth state mismatch. Possible CSRF attack.');
  }

  const tokens = await exchangeCodeForTokens(code, codeVerifier);
  await saveTokens(tokens);

  try {
    const client = new FreeeApiClient();
    const me = await client.getMe();
    return {
      displayName: me.display_name,
      email: me.email,
      companies: me.companies.map(c => ({ id: c.id, name: c.name })),
    };
  } catch {
    return { displayName: '（ユーザー情報取得失敗）', email: '', companies: [] };
  }
}
