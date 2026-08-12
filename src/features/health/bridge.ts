import type { DailyActivitySummary, HealthDiagnostics, HealthMetricType, HealthSample, TitanHealthConnectBridge } from './types';

type NativeHealthConnectPlugin = {
  isAvailable: () => Promise<{ available?: boolean } | boolean>;
  requestHealthPermissions: (options: { types: HealthMetricType[] }) => Promise<{ granted?: boolean } | boolean>;
  readSamples: (options: { types: HealthMetricType[]; since?: string }) => Promise<{ samples?: HealthSample[] } | HealthSample[]>;
  readDailyActivitySummary?: () => Promise<DailyActivitySummary>;
  diagnoseHealthData?: (options: { types: HealthMetricType[]; since?: string }) => Promise<HealthDiagnostics>;
};

export type SamsungHealthConnectionStatus = {
  available: boolean;
  granted: boolean;
  message?: string;
};

type NativeSamsungHealthPlugin = {
  isAvailable: () => Promise<{ available?: boolean; granted?: boolean; message?: string }>;
  requestSamsungHealthPermissions: () => Promise<{ granted?: boolean; message?: string }>;
  readDailyActivitySummary: () => Promise<DailyActivitySummary>;
  readRecentSignals?: () => Promise<{ samples?: HealthSample[] } | HealthSample[]>;
};

declare global {
  interface Window {
    TitanHealthConnect?: TitanHealthConnectBridge;
    Capacitor?: {
      Plugins?: {
        TitanHealthConnect?: NativeHealthConnectPlugin;
        TitanSamsungHealth?: NativeSamsungHealthPlugin;
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
    async isAvailable() { const result = await plugin.isAvailable(); return typeof result === 'boolean' ? result : Boolean(result.available); },
    async requestPermissions(types) { const result = await plugin.requestHealthPermissions({ types }); return typeof result === 'boolean' ? result : Boolean(result.granted); },
    async readSamples(types, since) { const result = await plugin.readSamples({ types, since }); return Array.isArray(result) ? result : result.samples ?? []; },
    readDailyActivitySummary: plugin.readDailyActivitySummary ? () => plugin.readDailyActivitySummary!() : undefined,
    diagnoseHealthData: plugin.diagnoseHealthData ? (types, since) => plugin.diagnoseHealthData!({ types, since }) : undefined,
  };
}

function samsungPlugin(): NativeSamsungHealthPlugin | null {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.TitanSamsungHealth ?? null;
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

export async function samsungHealthStatus(): Promise<SamsungHealthConnectionStatus> {
  const plugin = samsungPlugin();
  if (!plugin) return { available: false, granted: false, message: 'Plugin Samsung Health não carregado no APK.' };
  try {
    const result = await plugin.isAvailable();
    return { available: Boolean(result.available), granted: Boolean(result.granted), message: result.message };
  } catch (error) {
    return { available: false, granted: false, message: error instanceof Error ? error.message : 'Falha ao consultar Samsung Health.' };
  }
}

export async function requestSamsungHealthPermissions(): Promise<SamsungHealthConnectionStatus> {
  const plugin = samsungPlugin();
  if (!plugin) return { available: false, granted: false, message: 'Plugin Samsung Health não carregado no APK.' };
  try {
    const result = await plugin.requestSamsungHealthPermissions();
    const status = await samsungHealthStatus();
    return {
      available: status.available,
      granted: Boolean(result.granted) || status.granted,
      message: result.message ?? status.message,
    };
  } catch (error) {
    return { available: true, granted: false, message: error instanceof Error ? error.message : 'Falha ao solicitar autorização Samsung Health.' };
  }
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

export async function readSamsungHealthSignals(): Promise<HealthSample[]> {
  const plugin = samsungPlugin();
  if (!plugin?.readRecentSignals) return [];
  try {
    const status = await plugin.isAvailable();
    if (!status.available || !status.granted) return [];
    const result = await plugin.readRecentSignals();
    return Array.isArray(result) ? result : result.samples ?? [];
  } catch {
    return [];
  }
}

export async function readDailyActivitySummary(): Promise<DailyActivitySummary | null> {
  const samsung = samsungPlugin();
  if (samsung) {
    try {
      const status = await samsung.isAvailable();
      if (status.available && status.granted) return await samsung.readDailyActivitySummary();
    } catch {
      // Fall through to Health Connect aggregation.
    }
  }
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
      return { type, count: metricSamples.length, sources: [...new Set(metricSamples.map((sample) => sample.source).filter((source): source is string => Boolean(source)))], oldestAt: dates[0], newestAt: dates.at(-1) };
    }),
  };
}
