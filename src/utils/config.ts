import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_DIR = join(homedir(), '.config', 'fdk');
export const TOKEN_FILE = join(CONFIG_DIR, 'tokens.json');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface FdkConfig {
  defaultCompanyId?: number;
  apiDelay?: number;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getTokenFile(): string {
  return TOKEN_FILE;
}
