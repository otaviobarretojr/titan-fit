import type { HealthMetricType, HealthSample, TitanHealthConnectBridge } from './types';

declare global {
  interface Window {
    TitanHealthConnect?: TitanHealthConnectBridge;
  }
}

export const DEFAULT_HEALTH_METRICS: HealthMetricType[] = ['sleep', 'heart-rate', 'steps', 'active-calories', 'exercise', 'distance', 'body-composition'];

export function getHealthConnectBridge(): TitanHealthConnectBridge | null {
  return typeof window !== 'undefined' ? window.TitanHealthConnect ?? null : null;
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
