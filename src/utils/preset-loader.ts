import fs from 'node:fs/promises';
import path from 'node:path';
import { PRESETS_DIR } from './preset-validator.js';
import type { PresetDefinition, ReceiptData } from '../types/freee.js';

function isValidPreset(obj: unknown): obj is PresetDefinition {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p['name'] === 'string' &&
    typeof p['description'] === 'string' &&
    typeof p['version'] === 'string' &&
    typeof p['expected'] === 'object' &&
    p['expected'] !== null &&
    typeof p['data'] === 'object' &&
    p['data'] !== null &&
    Array.isArray((p['data'] as Record<string, unknown>)['walletables']) &&
    Array.isArray((p['data'] as Record<string, unknown>)['deals']) &&
    Array.isArray((p['data'] as Record<string, unknown>)['manualJournals'])
  );
}

export async function loadPreset(presetName: string): Promise<PresetDefinition> {
  const presetDir = path.resolve(PRESETS_DIR, presetName);
  const presetFile = path.join(presetDir, 'preset.json');

  try {
    await fs.access(presetDir);
  } catch {
    throw new Error(`Preset not found: "${presetName}". Run \`fdk list\` to see available presets.`);
  }

  let raw: string;
  try {
    raw = await fs.readFile(presetFile, 'utf-8');
  } catch {
    throw new Error(`Preset not found: "${presetName}" has no preset.json.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid preset JSON in "${presetName}": ${String(e)}`);
  }

  if (!isValidPreset(parsed)) {
    throw new Error(
      `Invalid preset "${presetName}": missing required fields (name, description, version, expected, data.walletables, data.deals, data.manualJournals)`
    );
  }

  const preset = parsed as PresetDefinition & {
    expected: PresetDefinition['expected'] & { receipts?: number };
    data: PresetDefinition['data'] & { receipts?: ReceiptData[] };
  };

  return {
    ...preset,
    expected: {
      ...preset.expected,
      receipts: preset.expected.receipts ?? 0,
    },
    data: {
      ...preset.data,
      receipts: preset.data.receipts ?? [],
    },
  };
}
