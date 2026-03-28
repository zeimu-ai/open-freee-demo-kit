import fs from 'node:fs/promises';
import { CONFIG_DIR, TOKEN_FILE } from './config.js';
import type { FreeeTokens } from '../types/freee.js';

export async function saveTokens(tokens: FreeeTokens): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export async function loadTokens(): Promise<FreeeTokens | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(raw) as FreeeTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch {
    // ignore — file may not exist
  }
}

export function isTokenExpired(tokens: FreeeTokens): boolean {
  return Date.now() >= tokens.expires_at;
}
