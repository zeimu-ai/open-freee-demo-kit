import { Command } from 'commander';
import http from 'node:http';
import { URL } from 'node:url';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce.js';
import { saveTokens, loadTokens, clearTokens, isTokenExpired } from '../utils/token-store.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { info, warn, error as logError } from '../utils/logger.js';
import type { FreeeTokens } from '../types/freee.js';

const FREEE_AUTH_URL = 'https://accounts.secure.freee.co.jp/public_api/authorize';
const FREEE_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token';
const CALLBACK_PORT = 8080;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

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

  if (!clientId) {
    throw new Error('FREEE_CLIENT_ID environment variable is not set');
  }
  if (!clientSecret) {
    throw new Error('FREEE_CLIENT_SECRET environment variable is not set');
  }

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

export const authCommand = new Command('auth')
  .description('Authenticate with freee via OAuth 2.0')
  .option('--status', 'Show current authentication status')
  .option('--logout', 'Remove stored credentials')
  .action(async (options) => {
    if (options.status) {
      const tokens = await loadTokens();
      if (!tokens) {
        console.log('Not authenticated. Run `fdk auth` to authenticate.');
        return;
      }
      const expired = isTokenExpired(tokens);
      const expiresAt = new Date(tokens.expires_at).toLocaleString('ja-JP');
      console.log(`Authentication status:`);
      console.log(`  Token: ${expired ? '⚠️  Expired' : '✅ Valid'}`);
      console.log(`  Expires at: ${expiresAt}`);
      if (tokens.company_id) {
        console.log(`  Company ID: ${tokens.company_id}`);
      }

      if (!expired) {
        try {
          const client = new FreeeApiClient();
          const me = await client.getMe();
          console.log(`  User: ${me.display_name} (${me.email})`);
        } catch {
          console.log('  (Could not fetch user info)');
        }
      }
      return;
    }

    if (options.logout) {
      await clearTokens();
      console.log('✅ Logged out. Credentials removed.');
      return;
    }

    // OAuth PKCE flow
    const clientId = process.env['FREEE_CLIENT_ID'];
    if (!clientId) {
      logError('FREEE_CLIENT_ID environment variable is not set.');
      logError('Set it with: export FREEE_CLIENT_ID=your_client_id');
      process.exit(1);
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

    console.log('\nOpening browser for freee authentication...');
    console.log(`If the browser does not open, visit:\n  ${authUrl.toString()}\n`);

    try {
      await openBrowser(authUrl.toString());
    } catch {
      warn('Could not open browser automatically. Please open the URL above manually.');
    }

    const { code, state: returnedState } = await startCallbackServer();

    if (returnedState !== state) {
      logError('OAuth state mismatch. Possible CSRF attack. Aborting.');
      process.exit(1);
    }

    info('Authorization code received. Exchanging for tokens...');
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    await saveTokens(tokens);

    // Fetch user info to confirm
    try {
      const client = new FreeeApiClient();
      const me = await client.getMe();
      console.log(`\n✅ Authenticated as: ${me.display_name} (${me.email})`);
      if (me.companies.length > 0) {
        console.log(`   Companies available: ${me.companies.map(c => `${c.name} (ID:${c.id})`).join(', ')}`);
      }
    } catch {
      console.log('\n✅ Authentication successful. Run `fdk whoami` to verify.');
    }
  });
