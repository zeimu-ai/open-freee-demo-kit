import type { PresetDefinition, ErrorManifestItem, DealData } from '../types/freee.js';

export interface CorruptOptions {
  rules: ('officer-pay' | 'tax-code' | 'entertainment')[];
}

export interface CorruptResult {
  preset: PresetDefinition;
  manifest: ErrorManifestItem[];
}

const OFFICER_KEYWORDS = ['取締役', '役員', '監査役'];

// 各科目で注入するエラー税区分（正しい値と逆を設定）
const TAX_CODE_INJECT: Record<string, number> = {
  '役員報酬': 34,  // 正: 0 → 誤: 34
  '給料手当': 34,  // 正: 0 → 誤: 34
  '外注費':   0,   // 正: 34 → 誤: 0
  '売上高':   0,   // 正: 21 → 誤: 0
};

/** ディープクローン */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** OFFICER-PAY-001: 役員報酬 → 給料手当 に置換 */
export function injectOfficerPay(preset: PresetDefinition): CorruptResult {
  const cloned = deepClone(preset);
  const manifest: ErrorManifestItem[] = [];

  for (const deal of cloned.data.deals) {
    const partnerName = deal.partner_name ?? '';
    const isOfficer = OFFICER_KEYWORDS.some(kw => partnerName.includes(kw));
    if (!isOfficer) continue;

    for (const detail of deal.details) {
      if (detail.account_item_name === '役員報酬') {
        detail.account_item_name = '給料手当';
        manifest.push({
          rule: 'OFFICER-PAY-001',
          location: `${deal.issue_date} ${partnerName}`,
          description: '役員報酬を「給料手当」に誤計上',
          expected_fix: '「役員報酬」科目に変更してください',
        });
      }
    }
  }

  return { preset: cloned, manifest };
}

/** TAX-CODE-001: 対象科目の税区分を誤った値に置換 */
export function injectTaxCode(preset: PresetDefinition): CorruptResult {
  const cloned = deepClone(preset);
  const manifest: ErrorManifestItem[] = [];

  for (const deal of cloned.data.deals) {
    for (const detail of deal.details) {
      const name = detail.account_item_name;
      if (!name || !(name in TAX_CODE_INJECT)) continue;
      const wrongCode = TAX_CODE_INJECT[name];
      if (detail.tax_code !== wrongCode) {
        detail.tax_code = wrongCode;
        manifest.push({
          rule: 'TAX-CODE-001',
          location: `${deal.issue_date} 勘定科目「${name}」`,
          description: `tax_code を ${wrongCode} に誤設定`,
          expected_fix: '正しい税区分に変更してください',
        });
      }
    }
  }

  return { preset: cloned, manifest };
}

const ENTERTAINMENT_LIMIT = 667000;
const ENTERTAINMENT_TARGET = 750000; // 注入後の目標月合計

/** ENTERTAINMENT-001: 交際費の月合計が 667,000 超になるよう増幅 */
export function injectEntertainment(preset: PresetDefinition): CorruptResult {
  const cloned = deepClone(preset);
  const manifest: ErrorManifestItem[] = [];

  // 月ごとに交際費 deal を収集
  const byMonth = new Map<string, DealData[]>();
  for (const deal of cloned.data.deals) {
    const [year, month] = deal.issue_date.split('-');
    const key = `${year}-${month}`;
    const hasEntertainment = deal.details.some(d => d.account_item_name === '交際費');
    if (!hasEntertainment) continue;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(deal);
  }

  for (const [monthKey, deals] of byMonth) {
    const currentTotal = deals
      .flatMap(d => d.details)
      .filter(d => d.account_item_name === '交際費')
      .reduce((sum, d) => sum + d.amount, 0);

    if (currentTotal >= ENTERTAINMENT_LIMIT) continue; // すでに超過していれば注入不要

    // 最後の交際費 detail の amount を増加させて目標値に到達させる
    const multiplier = Math.ceil(ENTERTAINMENT_TARGET / currentTotal);
    for (const deal of deals) {
      for (const detail of deal.details) {
        if (detail.account_item_name === '交際費') {
          detail.amount = detail.amount * multiplier;
        }
      }
    }

    const [year, month] = monthKey.split('-');
    manifest.push({
      rule: 'ENTERTAINMENT-001',
      location: `${year}年${month}月 交際費`,
      description: `交際費月合計を ¥667,000 超になるよう増幅（${multiplier}倍）`,
      expected_fix: '交際費を分散するか月次上限内に収めてください',
    });
  }

  return { preset: cloned, manifest };
}

/** 複数ルールを順次適用して CorruptResult を返す */
export function runCorrupt(preset: PresetDefinition, options: CorruptOptions): CorruptResult {
  let current = deepClone(preset);
  const allManifest: ErrorManifestItem[] = [];

  for (const rule of options.rules) {
    let result: CorruptResult;
    if (rule === 'officer-pay') {
      result = injectOfficerPay(current);
    } else if (rule === 'tax-code') {
      result = injectTaxCode(current);
    } else {
      result = injectEntertainment(current);
    }
    current = result.preset;
    allManifest.push(...result.manifest);
  }

  return { preset: current, manifest: allManifest };
}
