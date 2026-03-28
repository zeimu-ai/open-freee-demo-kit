/**
 * 実名混入防止テスト
 * @faker-js/faker（jaロケール、seed固定）を使い、
 * ブロックリスト方式で実在企業名・人物名がプリセットデータに含まれないことを確認する。
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { fakerJA as faker } from '@faker-js/faker';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRESETS_DIR = path.resolve(__dirname, '../../presets');

// ブロックリスト：実在する企業名・人物名・ブランド名（最低20件）
const BLOCK_LIST = [
  // 金融機関
  '三菱UFJ',
  'みずほ',
  '三井住友',
  'りそな',
  'ゆうちょ',
  // 通信・インフラ
  'NTT',
  'ソフトバンク',
  'KDDI',
  'au ',
  '東京電力',
  // IT・クラウド
  'AWS',
  'Amazon',
  'Google',
  'Microsoft',
  'Apple',
  // 実在人名（タスク要件より）
  '瀧田',
  '田中',
  // 交通
  'JR東日本',
  'JR西日本',
  'JR',
  // M&A・金融系
  '株式会社M&Aナビ',
  'freee',
  // その他大手
  'ソニー',
  'トヨタ',
  'パナソニック',
];

/** preset.json の全テキストを再帰的に収集する */
async function collectAllPresetJsonTexts(dir: string): Promise<{ file: string; content: string }[]> {
  const results: { file: string; content: string }[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory()) {
      results.push(...(await collectAllPresetJsonTexts(fullPath)));
    } else if (entry === 'preset.json') {
      const content = await fs.readFile(fullPath, 'utf-8');
      results.push({ file: fullPath, content });
    }
  }
  return results;
}

describe('実名混入防止テスト', () => {
  let presets: { file: string; content: string }[];

  beforeAll(async () => {
    presets = await collectAllPresetJsonTexts(PRESETS_DIR);
  });

  it('プリセットが1件以上存在する', () => {
    expect(presets.length).toBeGreaterThan(0);
  });

  it('faker jaロケールが日本語テキストを生成できる（seed固定）', () => {
    faker.seed(12345);
    const name = faker.company.name();
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  for (const blockedTerm of BLOCK_LIST) {
    it(`ブロックワード「${blockedTerm}」がいずれのプリセットにも含まれない`, async () => {
      // presets が beforeAll で設定される前のケースに備え、直接読み込む
      const allPresets = await collectAllPresetJsonTexts(PRESETS_DIR);
      for (const { file, content } of allPresets) {
        const relativePath = path.relative(PRESETS_DIR, file);
        expect(
          content,
          `「${blockedTerm}」が ${relativePath} に含まれています`,
        ).not.toContain(blockedTerm);
      }
    });
  }
});
