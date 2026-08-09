export type HealthMetricType = 'sleep' | 'heart-rate' | 'steps' | 'active-calories' | 'exercise' | 'distance' | 'body-composition';

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
};
