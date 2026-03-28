import { describe, it, expect } from 'vitest';
import { validatePresetName } from '../../src/utils/preset-validator.js';

describe('validatePresetName', () => {
  it('accepts simple preset name', () => {
    expect(() => validatePresetName('accounting')).not.toThrow();
  });

  it('accepts preset with category slash', () => {
    expect(() => validatePresetName('accounting/quickstart')).not.toThrow();
  });

  it('accepts preset with hyphens and underscores', () => {
    expect(() => validatePresetName('my-preset_v2')).not.toThrow();
  });

  it('accepts multi-level preset path', () => {
    expect(() => validatePresetName('advanced/multi-company')).not.toThrow();
  });

  it('throws on path traversal with ../', () => {
    expect(() => validatePresetName('../etc/passwd')).toThrow(/invalid preset name/i);
  });

  it('throws on path traversal with ..', () => {
    expect(() => validatePresetName('accounting/../../etc')).toThrow(/invalid preset name/i);
  });

  it('throws on special characters', () => {
    expect(() => validatePresetName('a$b')).toThrow(/invalid preset name/i);
  });

  it('throws on spaces', () => {
    expect(() => validatePresetName('my preset')).toThrow(/invalid preset name/i);
  });

  it('throws on empty string', () => {
    expect(() => validatePresetName('')).toThrow(/invalid preset name/i);
  });

  it('throws on leading slash', () => {
    expect(() => validatePresetName('/absolute/path')).toThrow(/invalid preset name/i);
  });
});
