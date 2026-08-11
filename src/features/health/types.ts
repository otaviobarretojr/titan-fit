export type HealthMetricType = 'sleep' | 'heart-rate' | 'steps' | 'active-calories' | 'exercise' | 'distance' | 'body-composition' | 'nutrition';

export type HealthSample = {
  id: string;
  type: HealthMetricType;
  startedAt: string;
  endedAt?: string;
  value: number;
  unit: string;
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type DailyActivitySummary = {
  date: string;
  steps: number;
  activeCalories: number;
  activeMinutes: number;
  distanceMeters: number;
  activeMinutesSource?: 'exercise-duration' | 'activity-summary';
  source?: 'health-connect-aggregate' | 'samsung-health';
};

export type DailyNutritionSummary = {
  date: string;
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  fiberGrams: number;
  records: number;
  sources: string[];
  source: 'health-connect';
};

export type HealthMetricDiagnostic = {
  type: HealthMetricType;
  count: number;
  sources: string[];
  oldestAt?: string;
  newestAt?: string;
  error?: string;
};

export type HealthDiagnostics = {
  from: string;
  to: string;
  totalRecords: number;
  metrics: HealthMetricDiagnostic[];
};

export type HealthSyncStatus = {
  provider: 'health-connect';
  bridgeAvailable: boolean;
  permissionGranted: boolean;
  lastSyncAt?: string;
  lastSyncCount?: number;
  message?: string;
};

export type TitanHealthConnectBridge = {
  isAvailable: () => Promise<boolean>;
  requestPermissions: (types: HealthMetricType[]) => Promise<boolean>;
  readSamples: (types: HealthMetricType[], since?: string) => Promise<HealthSample[]>;
  readDailyActivitySummary?: () => Promise<DailyActivitySummary>;
  readDailyNutritionSummary?: () => Promise<DailyNutritionSummary>;
  diagnoseHealthData?: (types: HealthMetricType[], since?: string) => Promise<HealthDiagnostics>;
};
