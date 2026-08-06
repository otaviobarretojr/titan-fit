export const TITAN_DB_NAME = 'titan-fit';
export const TITAN_DB_VERSION = 1;

export const STORE_NAMES = {
  metadata: 'metadata',
  plans: 'plans',
  workoutHistory: 'workout-history',
  cardioPlans: 'cardio-plans',
  cardioRecords: 'cardio-records',
  activeSessions: 'active-sessions',
  preferences: 'preferences'
} as const;

export type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES];

export type DatabaseRecord<T = unknown> = {
  id: string;
  value: T;
  updatedAt: string;
};

export type DatabaseMetadata = {
  schemaVersion: number;
  migratedFromLocalStorageAt?: string;
  lastBackupAt?: string;
};
