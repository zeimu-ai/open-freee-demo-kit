import { describe, it, expect } from 'vitest';
import { getConfigDir, getTokenFile, CONFIG_DIR, TOKEN_FILE } from '../../src/utils/config.js';
import { homedir } from 'os';
import { join } from 'path';

describe('Config utils', () => {
  it('should return config directory under home', () => {
    const configDir = getConfigDir();
    expect(configDir).toBe(join(homedir(), '.config', 'fdk'));
  });

  it('should return token file path inside config dir', () => {
    const tokenFile = getTokenFile();
    expect(tokenFile).toBe(join(CONFIG_DIR, 'tokens.json'));
  });

  it('should export CONFIG_DIR and TOKEN_FILE constants', () => {
    expect(CONFIG_DIR).toContain('.config/fdk');
    expect(TOKEN_FILE).toContain('tokens.json');
  });
});
