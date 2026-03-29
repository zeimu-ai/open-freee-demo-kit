import type { PresetDefinition } from '../types/freee.js';

export interface AccountingIssue {
  severity: 'error' | 'warning';
  rule: string;
  message: string;
  context?: string;
}

export interface AccountingValidationResult {
  issues: AccountingIssue[];
  passed: boolean;
}

const OFFICER_KEYWORDS = ['取締役', '役員', '監査役'];

const TAX_CODE_RULES: Record<string, { allowedCodes: number[]; severity: 'error' | 'warning' }> = {
  '役員報酬':  { allowedCodes: [0],      severity: 'error' },
  '給料手当':  { allowedCodes: [0],      severity: 'error' },
  '外注費':    { allowedCodes: [34, 18], severity: 'error' },
  '売上高':    { allowedCodes: [21, 13], severity: 'error' },
  '交際費':    { allowedCodes: [34, 18], severity: 'warning' },
  '地代家賃':  { allowedCodes: [0, 34],  severity: 'warning' },
  '諸会費':    { allowedCodes: [0],      severity: 'warning' },
};

// 手動仕訳（振替・未払計上等）では tax_code:0 が正当な仕入・費用科目
// 例: 外注費の月末未払計上仕訳は tax_code:0 で問題なし
const JOURNAL_SKIP_ACCOUNTS = new Set(['外注費', '交際費', '地代家賃', '諸会費']);

const ENTERTAINMENT_MONTHLY_LIMIT = 667000;

export function runAccountingValidation(preset: PresetDefinition): AccountingValidationResult {
  const issues: AccountingIssue[] = [];

  // OFFICER-PAY-001
  for (const deal of preset.data.deals) {
    const partnerName = deal.partner_name ?? '';
    const isOfficer = OFFICER_KEYWORDS.some(kw => partnerName.includes(kw));
    if (!isOfficer) continue;
    for (const detail of deal.details) {
      if (detail.account_item_name === '給料手当') {
        issues.push({
          severity: 'error',
          rule: 'OFFICER-PAY-001',
          message: `役員報酬の誤計上: ${deal.issue_date} ${partnerName} — 「給料手当」は役員には不可。「役員報酬」を使用してください`,
        });
      }
    }
  }

  // TAX-CODE-001 — deals
  for (const deal of preset.data.deals) {
    for (const detail of deal.details) {
      const name = detail.account_item_name;
      if (!name) continue;
      const rule = TAX_CODE_RULES[name];
      if (!rule) continue;
      if (!rule.allowedCodes.includes(detail.tax_code)) {
        issues.push({
          severity: rule.severity,
          rule: 'TAX-CODE-001',
          message: `税区分不整合: ${deal.issue_date} 勘定科目「${name}」に tax_code:${detail.tax_code} が設定されています（期待値: ${rule.allowedCodes.join(',')}）`,
        });
      }
    }
  }

  // TAX-CODE-001 — manualJournals（仕入・費用科目の振替仕訳は tax_code:0 が正当なのでスキップ）
  for (const mj of preset.data.manualJournals) {
    for (const detail of mj.details) {
      const name = detail.account_item_name;
      if (!name) continue;
      if (JOURNAL_SKIP_ACCOUNTS.has(name)) continue;
      const rule = TAX_CODE_RULES[name];
      if (!rule) continue;
      if (!rule.allowedCodes.includes(detail.tax_code)) {
        issues.push({
          severity: rule.severity,
          rule: 'TAX-CODE-001',
          message: `税区分不整合: ${mj.issue_date} 勘定科目「${name}」に tax_code:${detail.tax_code} が設定されています（期待値: ${rule.allowedCodes.join(',')}）`,
        });
      }
    }
  }

  // ENTERTAINMENT-001
  const monthlyTotals = new Map<string, number>();
  for (const deal of preset.data.deals) {
    for (const detail of deal.details) {
      if (detail.account_item_name !== '交際費') continue;
      const [year, month] = deal.issue_date.split('-');
      const key = `${year}-${month}`;
      monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + detail.amount);
    }
  }
  for (const [key, total] of monthlyTotals) {
    if (total > ENTERTAINMENT_MONTHLY_LIMIT) {
      const [year, month] = key.split('-');
      issues.push({
        severity: 'warning',
        rule: 'ENTERTAINMENT-001',
        message: `交際費月次上限警告: ${year}年${month}月 合計¥${total.toLocaleString()} (目安¥667,000/月)`,
      });
    }
  }

  const passed = !issues.some(i => i.severity === 'error');
  return { issues, passed };
}
