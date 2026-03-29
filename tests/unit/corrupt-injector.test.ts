import { describe, it, expect } from 'vitest';
import {
  injectOfficerPay,
  injectTaxCode,
  injectEntertainment,
  runCorrupt,
} from '../../src/utils/corrupt-injector.js';
import type { PresetDefinition } from '../../src/types/freee.js';

function makePreset(overrides: Partial<PresetDefinition['data']> = {}): PresetDefinition {
  return {
    name: 'テスト',
    description: 'テスト用',
    version: '1.0.0',
    expected: { walletables: 0, deals: 0, manualJournals: 0 },
    data: {
      walletables: [],
      deals: [],
      manualJournals: [],
      ...overrides,
    },
  };
}

// ─── injectOfficerPay ──────────────────────────────────────────────────────

describe('injectOfficerPay', () => {
  it('役員報酬 deal の account_item_name が給料手当に変わる', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    const { preset: corrupted } = injectOfficerPay(preset);
    expect(corrupted.data.deals[0].details[0].account_item_name).toBe('給料手当');
  });

  it('役員キーワードを含まない deal は変更されない', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '社員 山田太郎',
          details: [{ account_item_name: '給料手当', tax_code: 0, amount: 300000 }],
        },
      ],
    });
    const { preset: corrupted } = injectOfficerPay(preset);
    expect(corrupted.data.deals[0].details[0].account_item_name).toBe('給料手当');
  });

  it('変更された deal の manifest に OFFICER-PAY-001 が記録される', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    const { manifest } = injectOfficerPay(preset);
    expect(manifest).toHaveLength(1);
    expect(manifest[0].rule).toBe('OFFICER-PAY-001');
    expect(manifest[0].location).toContain('2026-01-25');
    expect(manifest[0].location).toContain('代表取締役社長山田');
  });

  it('役員報酬 deal がない preset は変更なし・manifest 空', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1000000 }],
        },
      ],
    });
    const { preset: corrupted, manifest } = injectOfficerPay(preset);
    expect(corrupted.data.deals[0].details[0].account_item_name).toBe('売上高');
    expect(manifest).toHaveLength(0);
  });

  it('元の preset を変更しない（イミュータブル）', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    injectOfficerPay(preset);
    expect(preset.data.deals[0].details[0].account_item_name).toBe('役員報酬');
  });
});

// ─── injectTaxCode ─────────────────────────────────────────────────────────

describe('injectTaxCode', () => {
  it('売上高 tax_code 21 → 0 に変わる', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1100000 }],
        },
      ],
    });
    const { preset: corrupted } = injectTaxCode(preset);
    expect(corrupted.data.deals[0].details[0].tax_code).toBe(0);
  });

  it('外注費 tax_code 34 → 0 に変わる', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: 'フリーランス 田中',
          details: [{ account_item_name: '外注費', tax_code: 34, amount: 330000 }],
        },
      ],
    });
    const { preset: corrupted } = injectTaxCode(preset);
    expect(corrupted.data.deals[0].details[0].tax_code).toBe(0);
  });

  it('manifest に TAX-CODE-001 が記録される', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1100000 }],
        },
      ],
    });
    const { manifest } = injectTaxCode(preset);
    expect(manifest).toHaveLength(1);
    expect(manifest[0].rule).toBe('TAX-CODE-001');
    expect(manifest[0].location).toContain('売上高');
  });

  it('tax_code チェック対象外の科目は変更されない', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '消耗品費', tax_code: 34, amount: 10000 }],
        },
      ],
    });
    const { preset: corrupted, manifest } = injectTaxCode(preset);
    expect(corrupted.data.deals[0].details[0].tax_code).toBe(34);
    expect(manifest).toHaveLength(0);
  });
});

// ─── injectEntertainment ───────────────────────────────────────────────────

describe('injectEntertainment', () => {
  it('交際費を月 667,000 超になるよう増幅する', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-15',
          type: 'expense',
          partner_name: '社員 青木',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 44000 }],
        },
      ],
    });
    const { preset: corrupted } = injectEntertainment(preset);
    const totalJan = corrupted.data.deals
      .filter(d => d.issue_date.startsWith('2026-01'))
      .flatMap(d => d.details)
      .filter(d => d.account_item_name === '交際費')
      .reduce((sum, d) => sum + d.amount, 0);
    expect(totalJan).toBeGreaterThan(667000);
  });

  it('manifest に ENTERTAINMENT-001 が記録される', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-02-10',
          type: 'expense',
          partner_name: '社員 松本',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 55000 }],
        },
      ],
    });
    const { manifest } = injectEntertainment(preset);
    expect(manifest).toHaveLength(1);
    expect(manifest[0].rule).toBe('ENTERTAINMENT-001');
  });

  it('交際費がない preset は変更なし・manifest 空', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1000000 }],
        },
      ],
    });
    const { preset: corrupted, manifest } = injectEntertainment(preset);
    expect(corrupted.data.deals[0].details[0].account_item_name).toBe('売上高');
    expect(manifest).toHaveLength(0);
  });
});

// ─── runCorrupt ────────────────────────────────────────────────────────────

describe('runCorrupt', () => {
  it('officer-pay ルールのみ適用', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    const { preset: corrupted, manifest } = runCorrupt(preset, { rules: ['officer-pay'] });
    expect(corrupted.data.deals[0].details[0].account_item_name).toBe('給料手当');
    expect(manifest.every(m => m.rule === 'OFFICER-PAY-001')).toBe(true);
  });

  it('複数ルールを組み合わせて適用できる', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
        {
          issue_date: '2026-01-10',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1000000 }],
        },
      ],
    });
    const { manifest } = runCorrupt(preset, { rules: ['officer-pay', 'tax-code'] });
    const rules = manifest.map(m => m.rule);
    expect(rules).toContain('OFFICER-PAY-001');
    expect(rules).toContain('TAX-CODE-001');
  });

  it('元の preset を変更しない（イミュータブル）', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役社長山田',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    runCorrupt(preset, { rules: ['officer-pay', 'tax-code', 'entertainment'] });
    expect(preset.data.deals[0].details[0].account_item_name).toBe('役員報酬');
  });
});
