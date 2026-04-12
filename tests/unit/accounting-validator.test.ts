import { describe, it, expect } from 'vitest';
import { runAccountingValidation } from '../../src/utils/accounting-validator.js';
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
      receipts: [],
      ...overrides,
    },
  };
}

describe('OFFICER-PAY-001: 役員報酬の科目チェック', () => {
  it('社員名 + 給料手当 → issue なし', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '社員 山田',
          details: [{ account_item_name: '給料手当', tax_code: 0, amount: 280000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'OFFICER-PAY-001')).toHaveLength(0);
  });

  it('代表取締役 + 給料手当 → error', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役 田中',
          details: [{ account_item_name: '給料手当', tax_code: 0, amount: 600000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    const issues = result.issues.filter(i => i.rule === 'OFFICER-PAY-001');
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('代表取締役 田中');
  });

  it('役員 + 給料手当 → error', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '役員 鈴木',
          details: [{ account_item_name: '給料手当', tax_code: 0, amount: 500000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'OFFICER-PAY-001')).toHaveLength(1);
  });

  it('代表取締役 + 役員報酬 → issue なし', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役 田中',
          details: [{ account_item_name: '役員報酬', tax_code: 0, amount: 600000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'OFFICER-PAY-001')).toHaveLength(0);
  });
});

describe('TAX-CODE-001: 税区分整合性チェック', () => {
  it('売上高 tax_code 21 → issue なし', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-05',
          type: 'income',
          partner_name: '株式会社テスト',
          details: [{ account_item_name: '売上高', tax_code: 21, amount: 1100000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'TAX-CODE-001')).toHaveLength(0);
  });

  it('売上高 tax_code 22（輸出売上）→ issue なし', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-05',
          type: 'income',
          partner_name: 'Northwind Labs Pte. Ltd.',
          details: [{ account_item_name: '売上高', tax_code: 22, amount: 1100000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'TAX-CODE-001')).toHaveLength(0);
  });

  it('外注費 tax_code 0 → error', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: 'フリーランス 田中',
          details: [{ account_item_name: '外注費', tax_code: 0, amount: 330000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    const issues = result.issues.filter(i => i.rule === 'TAX-CODE-001');
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('外注費');
    expect(issues[0].message).toContain('tax_code:0');
  });

  it('交際費 tax_code 34 → issue なし（許可値）', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: '社員 青木',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 44000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'TAX-CODE-001')).toHaveLength(0);
  });

  it('manualJournal の details もチェック対象になる', () => {
    const preset = makePreset({
      manualJournals: [
        {
          issue_date: '2026-01-31',
          details: [
            { entry_side: 'debit', account_item_name: '売上高', tax_code: 0, amount: 100000 },
            { entry_side: 'credit', account_item_name: '売掛金', tax_code: 0, amount: 100000 },
          ],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    const issues = result.issues.filter(i => i.rule === 'TAX-CODE-001');
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('売上高');
  });
});

describe('ENTERTAINMENT-001: 交際費月次上限', () => {
  it('月合計 500,000円 → issue なし', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: '社員 青木',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 300000 }],
        },
        {
          issue_date: '2026-01-20',
          type: 'expense',
          partner_name: '社員 松本',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 200000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.issues.filter(i => i.rule === 'ENTERTAINMENT-001')).toHaveLength(0);
  });

  it('月合計 700,000円 → warning', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: '社員 青木',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 400000 }],
        },
        {
          issue_date: '2026-01-20',
          type: 'expense',
          partner_name: '社員 松本',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 300000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    const issues = result.issues.filter(i => i.rule === 'ENTERTAINMENT-001');
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].message).toContain('¥700,000');
  });
});

describe('passed フラグ', () => {
  it('error がなければ passed=true（warning のみでも）', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-10',
          type: 'expense',
          partner_name: '社員 青木',
          details: [{ account_item_name: '交際費', tax_code: 34, amount: 700000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.passed).toBe(true);
  });

  it('error があれば passed=false', () => {
    const preset = makePreset({
      deals: [
        {
          issue_date: '2026-01-25',
          type: 'expense',
          partner_name: '代表取締役 田中',
          details: [{ account_item_name: '給料手当', tax_code: 0, amount: 600000 }],
        },
      ],
    });
    const result = runAccountingValidation(preset);
    expect(result.passed).toBe(false);
  });
});
