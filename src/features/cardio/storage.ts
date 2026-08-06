import type { CardioPlan, CardioRecord } from './types';

const PLAN_KEY = 'titan-fit:cardio-plan';
const RECORDS_KEY = 'titan-fit:cardio-records';

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
}

export function removeCardioPlan() {
  localStorage.removeItem(PLAN_KEY);
}

export function loadCardioRecords(): CardioRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) as CardioRecord[] : [];
  } catch {
    return [];
  }
}

export function saveCardioRecord(record: CardioRecord) {
  const records = loadCardioRecords();
  localStorage.setItem(RECORDS_KEY, JSON.stringify([record, ...records]));
}

export function removeCardioRecord(id: string) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(loadCardioRecords().filter((record) => record.id !== id)));
}
