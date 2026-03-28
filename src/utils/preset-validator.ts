import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Presets directory is at project root: <repo>/presets/
const PRESETS_DIR = path.resolve(__dirname, '../../presets');

/**
 * Validates a preset name for security:
 * - Only alphanumeric characters, /, -, _ are allowed
 * - Path traversal (../) is rejected
 * - Leading slash is rejected
 */
export function validatePresetName(preset: string): void {
  if (!preset || !/^[a-zA-Z0-9/_-]+$/.test(preset)) {
    throw new Error(
      `Invalid preset name: "${preset}". Use only alphanumeric characters, /, -, _`
    );
  }

  // Prevent path traversal by resolving and checking prefix
  const resolved = path.resolve(PRESETS_DIR, preset);
  if (!resolved.startsWith(PRESETS_DIR + path.sep) && resolved !== PRESETS_DIR) {
    throw new Error(
      `Invalid preset name: "${preset}" — path traversal detected`
    );
  }
}

export { PRESETS_DIR };
