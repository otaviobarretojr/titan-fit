import type { HealthMetricType, HealthSample, TitanHealthConnectBridge } from './types';

type NativeHealthConnectPlugin = {
  isAvailable: () => Promise<{ available?: boolean } | boolean>;
  requestHealthPermissions: (options: { types: HealthMetricType[] }) => Promise<{ granted?: boolean } | boolean>;
  readSamples: (options: { types: HealthMetricType[]; since?: string }) => Promise<{ samples?: HealthSample[] } | HealthSample[]>;
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
