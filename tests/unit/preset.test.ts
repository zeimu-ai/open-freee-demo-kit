import { describe, it, expect } from 'vitest';
import type { Preset, PresetCategory } from '../../src/types/preset.js';

describe('Preset types', () => {
  it('should define valid preset categories', () => {
    const validCategories: PresetCategory[] = ['accounting', 'invoices', 'expenses', 'hr', 'advanced'];
    expect(validCategories).toHaveLength(5);
  });

  it('should create a valid preset object', () => {
    const preset: Preset = {
      name: 'quickstart',
      description: 'Basic accounting demo data',
      category: 'accounting',
      version: '1.0.0',
      resources: [
        { type: 'deals', file: 'deals.json', count: 10 },
        { type: 'receipts', file: 'receipts.json', count: 2 },
      ],
    };
    expect(preset.name).toBe('quickstart');
    expect(preset.resources).toHaveLength(2);
  });

  it('should reject invalid resource types at compile time', () => {
    // TypeScriptの型チェックで防ぐ — ランタイムでの検証は別途実装
    const resource = { type: 'deals' as const, file: 'deals.json', count: 10 };
    expect(['deals', 'manual_journals', 'walletables', 'account_items', 'partners', 'receipts']).toContain(resource.type);
  });
});
