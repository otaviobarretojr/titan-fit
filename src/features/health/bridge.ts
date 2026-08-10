import type { DailyActivitySummary, HealthDiagnostics, HealthMetricType, HealthSample, TitanHealthConnectBridge } from './types';

type NativeHealthConnectPlugin = {
  isAvailable: () => Promise<{ available?: boolean } | boolean>;
  requestHealthPermissions: (options: { types: HealthMetricType[] }) => Promise<{ granted?: boolean } | boolean>;
  readSamples: (options: { types: HealthMetricType[]; since?: string }) => Promise<{ samples?: HealthSample[] } | HealthSample[]>;
  readDailyActivitySummary?: () => Promise<DailyActivitySummary>;
  diagnoseHealthData?: (options: { types: HealthMetricType[]; since?: string }) => Promise<HealthDiagnostics>;
};

declare global {
  interface Window {
    TitanHealthConnect?: TitanHealthConnectBridge;
    Capacitor?: {
      Plugins?: {
        TitanHealthConnect?: NativeHealthConnectPlugin;
      };
    };
  }
}

export const DEFAULT_HEALTH_METRICS: HealthMetricType[] = ['sleep', 'heart-rate', 'steps', 'active-calories', 'exercise', 'distance', 'body-composition'];

function capacitorBridge(): TitanHealthConnectBridge | null {
  if (typeof window === 'undefined') return null;
  const plugin = window.Capacitor?.Plugins?.TitanHealthConnect;
  if (!plugin) return null;

  return {
    async isAvailable() {
      const result = await plugin.isAvailable();
      return typeof result === 'boolean' ? result : Boolean(result.available);
    },
    async requestPermissions(types) {
      const result = await plugin.requestHealthPermissions({ types });
      return typeof result === 'boolean' ? result : Boolean(result.granted);
    },
    async readSamples(types, since) {
      const result = await plugin.readSamples({ types, since });
      return Array.isArray(result) ? result : result.samples ?? [];
    },
    readDailyActivitySummary: plugin.readDailyActivitySummary
      ? () => plugin.readDailyActivitySummary!()
      : undefined,
    diagnoseHealthData: plugin.diagnoseHealthData
      ? (types, since) => plugin.diagnoseHealthData!({ types, since })
      : undefined,
  };
}

export function getHealthConnectBridge(): TitanHealthConnectBridge | null {
  if (typeof window === 'undefined') return null;
  return window.TitanHealthConnect ?? capacitorBridge();
}

export async function healthConnectAvailable(): Promise<boolean> {
  const bridge = getHealthConnectBridge();
  if (!bridge) return false;
  try { return await bridge.isAvailable(); } catch { return false; }
}

export async function requestHealthPermissions(types = DEFAULT_HEALTH_METRICS): Promise<boolean> {
  const bridge = getHealthConnectBridge();
  if (!bridge) return false;
  return bridge.requestPermissions(types);
}

export async function readHealthSamples(types = DEFAULT_HEALTH_METRICS, since?: string): Promise<HealthSample[]> {
  const bridge = getHealthConnectBridge();
  if (!bridge) return [];
  return bridge.readSamples(types, since);
}

export async function readDailyActivitySummary(): Promise<DailyActivitySummary | null> {
  const bridge = getHealthConnectBridge();
  if (!bridge?.readDailyActivitySummary) return null;
  try { return await bridge.readDailyActivitySummary(); } catch { return null; }
}

export async function diagnoseHealthData(types = DEFAULT_HEALTH_METRICS, since?: string): Promise<HealthDiagnostics | null> {
  const bridge = getHealthConnectBridge();
  if (!bridge) return null;
  if (bridge.diagnoseHealthData) return bridge.diagnoseHealthData(types, since);

  const samples = await bridge.readSamples(types, since);
  const from = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  return {
    from,
    to,
    totalRecords: samples.length,
    metrics: types.map((type) => {
      const metricSamples = samples.filter((sample) => sample.type === type);
      const dates = metricSamples.map((sample) => sample.startedAt).sort();
      return {
        type,
        count: metricSamples.length,
        sources: [...new Set(metricSamples.map((sample) => sample.source).filter((source): source is string => Boolean(source)))],
        oldestAt: dates[0],
        newestAt: dates.at(-1),
      };
    }),
  };
}
