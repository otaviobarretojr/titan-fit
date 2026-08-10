import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { BodyEvolutionState } from './types';

const RECORD_ID = 'body-evolution-v1';
const EMPTY_STATE: BodyEvolutionState = { version: 1, entries: [] };

export async function loadBodyEvolution(): Promise<BodyEvolutionState> {
  const saved = await getRecord<BodyEvolutionState>(STORE_NAMES.preferences, RECORD_ID);
  if (!saved || saved.version !== 1 || !Array.isArray(saved.entries)) return EMPTY_STATE;
  return { version: 1, entries: [...saved.entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) };
}

export async function saveBodyEvolution(state: BodyEvolutionState): Promise<void> {
  await putRecord(STORE_NAMES.preferences, RECORD_ID, state);
  window.dispatchEvent(new CustomEvent('titan:evolution-changed', { detail: { entries: state.entries.length } }));
}
