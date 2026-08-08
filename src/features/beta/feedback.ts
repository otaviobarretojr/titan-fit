import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';

export type BetaFeedbackKind = 'bug' | 'idea' | 'confusing' | 'positive';
export type BetaFeedbackEntry = {
  id: string;
  kind: BetaFeedbackKind;
  message: string;
  appVersion: string;
  createdAt: string;
  screen?: string;
};

const FEEDBACK_RECORD_ID = 'beta-feedback-v1';

export function buildBetaFeedbackEntry(kind: BetaFeedbackKind, message: string, appVersion: string, screen?: string): BetaFeedbackEntry {
  return {
    id: crypto.randomUUID(),
    kind,
    message: message.trim(),
    appVersion,
    createdAt: new Date().toISOString(),
    ...(screen?.trim() ? { screen: screen.trim() } : {}),
  };
}

export async function loadBetaFeedback(): Promise<BetaFeedbackEntry[]> {
  return (await getRecord<BetaFeedbackEntry[]>(STORE_NAMES.preferences, FEEDBACK_RECORD_ID)) ?? [];
}

export async function saveBetaFeedback(entry: BetaFeedbackEntry): Promise<BetaFeedbackEntry[]> {
  const current = await loadBetaFeedback();
  const next = [entry, ...current].slice(0, 50);
  await putRecord(STORE_NAMES.preferences, FEEDBACK_RECORD_ID, next);
  return next;
}

export function downloadBetaFeedback(entries: BetaFeedbackEntry[]) {
  const payload = { format: 'titan-fit-beta-feedback', exportedAt: new Date().toISOString(), entries };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `titan-fit-feedback-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
