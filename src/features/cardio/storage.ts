import { deleteRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { CardioPlan, CardioRecord } from './types';

const PLAN_KEY = 'titan-fit:cardio-plan';
const RECORDS_KEY = 'titan-fit:cardio-records';

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível espelhar os dados de cardio no IndexedDB.', error);
}

export function loadCardioPlan(): CardioPlan | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) as CardioPlan : null;
  } catch {
    return null;
  }
}

export function saveCardioPlan(plan: CardioPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  void putRecord(STORE_NAMES.cardioPlans, 'active', plan).catch(reportMirrorFailure);
}

export function removeCardioPlan() {
  localStorage.removeItem(PLAN_KEY);
  void deleteRecord(STORE_NAMES.cardioPlans, 'active').catch(reportMirrorFailure);
}

export function loadCardioRecords(): CardioRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) as CardioRecord[] : [];
  } catch {
    return [];
  }
}

function persistCardioRecords(records: CardioRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  void putRecord(STORE_NAMES.cardioRecords, 'records', records).catch(reportMirrorFailure);
}

export function saveCardioRecord(record: CardioRecord) {
  const records = loadCardioRecords().filter((item) => item.id !== record.id);
  persistCardioRecords([record, ...records]);
}

export function removeCardioRecord(id: string) {
  persistCardioRecords(loadCardioRecords().filter((record) => record.id !== id));
}
