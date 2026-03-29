import { describe, it, expect } from 'vitest';
import { validateAccountingBalance } from '../../src/commands/validate.js';

type MinimalPreset = Parameters<typeof validateAccountingBalance>[0];

function makePreset(journals: Array<{ issue_date: string; details: Array<{ entry_side: 'debit' | 'credit'; amount: number; account_item_name: string }> }>): MinimalPreset {
  return {
    name: 'test',
    description: 'test',
    version: '1.0.0',
    expected: { walletables: 0, deals: 0, manualJournals: journals.length },
    data: {
      walletables: [],
      deals: [],
      manualJournals: journals,
    },
  } as unknown as MinimalPreset;
}

describe('validateAccountingBalance', () => {
  it('貸借一致の場合はエラーなし', () => {
    const preset = makePreset([
      {
        issue_date: '2026-01-31',
        details: [
          { entry_side: 'debit', amount: 100000, account_item_name: '売掛金' },
          { entry_side: 'credit', amount: 100000, account_item_name: '売上高' },
        ],
      },
    ]);
    expect(validateAccountingBalance(preset)).toEqual([]);
  });

  it('借方 > 貸方の場合はエラーメッセージを返す', () => {
    const preset = makePreset([
      {
        issue_date: '2026-01-31',
        details: [
          { entry_side: 'debit', amount: 150000, account_item_name: '売掛金' },
          { entry_side: 'credit', amount: 100000, account_item_name: '売上高' },
        ],
      },
    ]);
    const errors = validateAccountingBalance(preset);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('2026-01-31');
    expect(errors[0]).toContain('150,000');
    expect(errors[0]).toContain('100,000');
  });

  it('貸方 > 借方の場合もエラーを返す', () => {
    const preset = makePreset([
      {
        issue_date: '2026-02-28',
        details: [
          { entry_side: 'debit', amount: 50000, account_item_name: '現金' },
          { entry_side: 'credit', amount: 80000, account_item_name: '売掛金' },
        ],
      },
    ]);
    const errors = validateAccountingBalance(preset);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('2026-02-28');
  });

  it('複数仕訳で不一致のものだけエラーになる', () => {
    const preset = makePreset([
      {
        issue_date: '2026-01-31',
        details: [
          { entry_side: 'debit', amount: 100000, account_item_name: '売掛金' },
          { entry_side: 'credit', amount: 100000, account_item_name: '売上高' },
        ],
      },
      {
        issue_date: '2026-02-28',
        details: [
          { entry_side: 'debit', amount: 200000, account_item_name: '売掛金' },
          { entry_side: 'credit', amount: 180000, account_item_name: '売上高' },
        ],
      },
    ]);
    const errors = validateAccountingBalance(preset);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('2026-02-28');
  });

  it('manualJournals が空の場合はエラーなし', () => {
    const preset = makePreset([]);
    expect(validateAccountingBalance(preset)).toEqual([]);
  });
});
