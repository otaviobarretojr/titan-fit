import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealthConnectBridge, healthConnectAvailable, readHealthSamples, requestHealthPermissions } from '../src/features/health/bridge';

afterEach(() => {
  delete window.TitanHealthConnect;
  delete window.Capacitor;
});

describe('Health Connect bridge', () => {
  it('permanece indisponível no PWA sem camada nativa', async () => {
    expect(getHealthConnectBridge()).toBeNull();
    await expect(healthConnectAvailable()).resolves.toBe(false);
  });

  it('usa o plugin Capacitor quando instalado no app Android', async () => {
    const isAvailable = vi.fn().mockResolvedValue({ available: true });
    const requestHealthPermissionsNative = vi.fn().mockResolvedValue({ granted: true });
    const readSamplesNative = vi.fn().mockResolvedValue({ samples: [{ id: 'steps-1', type: 'steps', startedAt: '2026-08-10T08:00:00.000Z', value: 4321, unit: 'passos' }] });

    window.Capacitor = { Plugins: { TitanHealthConnect: { isAvailable, requestHealthPermissions: requestHealthPermissionsNative, readSamples: readSamplesNative } } };

    await expect(healthConnectAvailable()).resolves.toBe(true);
    await expect(requestHealthPermissions(['steps'])).resolves.toBe(true);
    await expect(readHealthSamples(['steps'], '2026-08-09T00:00:00.000Z')).resolves.toHaveLength(1);
    expect(requestHealthPermissionsNative).toHaveBeenCalledWith({ types: ['steps'] });
    expect(readSamplesNative).toHaveBeenCalledWith({ types: ['steps'], since: '2026-08-09T00:00:00.000Z' });
  });

  it('mantém compatibilidade com ponte injetada diretamente', async () => {
    window.TitanHealthConnect = {
      isAvailable: vi.fn().mockResolvedValue(true),
      requestPermissions: vi.fn().mockResolvedValue(true),
      readSamples: vi.fn().mockResolvedValue([]),
    };

    await expect(healthConnectAvailable()).resolves.toBe(true);
  });
});
