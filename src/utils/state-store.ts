import fs from 'node:fs/promises';
import { CONFIG_DIR, STATE_FILE } from './config.js';
import type { PresetState } from '../types/freee.js';

type StateMap = Record<string, PresetState>;

async function readStateMap(): Promise<StateMap> {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as StateMap;
  } catch {
    return {};
  }
}

async function writeStateMap(map: StateMap): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(STATE_FILE, JSON.stringify(map, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export async function saveState(state: PresetState): Promise<void> {
  const map = await readStateMap();
  map[state.preset] = state;
  await writeStateMap(map);
}

export async function loadState(preset: string): Promise<PresetState | null> {
  const map = await readStateMap();
  return map[preset] ?? null;
}

export async function clearState(preset: string): Promise<void> {
  const map = await readStateMap();
  delete map[preset];
  await writeStateMap(map);
}

export async function listAllStates(): Promise<PresetState[]> {
  const map = await readStateMap();
  return Object.values(map);
}
