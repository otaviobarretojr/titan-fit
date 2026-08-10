import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Android Health Connect foundation', () => {
  it('mantém o container Capacitor preparado para o TITAN FIT', () => {
    const config = JSON.parse(read('capacitor.config.json')) as { appId: string; appName: string; webDir: string };
    expect(config.appId).toBe('com.otaviobarretojr.titanfit');
    expect(config.appName).toBe('TITAN FIT');
    expect(config.webDir).toBe('dist');
  });

  it('mantém o plugin nativo e os tipos usados pela aba Samsung Health', () => {
    const plugin = read('native/android-health-connect/TitanHealthConnectPlugin.kt');
    expect(plugin).toContain('@CapacitorPlugin(name = "TitanHealthConnect")');
    expect(plugin).toContain('SleepSessionRecord');
    expect(plugin).toContain('HeartRateRecord');
    expect(plugin).toContain('StepsRecord');
    expect(plugin).toContain('ActiveCaloriesBurnedRecord');
    expect(plugin).toContain('ExerciseSessionRecord');
    expect(plugin).toContain('DistanceRecord');
    expect(plugin).toContain('BodyFatRecord');
    expect(plugin).toContain('requestPermissions');
    expect(plugin).toContain('readSamples');
  });

  it('mantém permissões e dependência do Health Connect documentadas para o projeto Android', () => {
    const manifest = read('native/android-health-connect/AndroidManifest.health-connect.xml');
    const gradle = read('native/android-health-connect/health-connect.gradle.kts');
    const mainActivity = read('native/android-health-connect/MainActivity.kt');
    expect(manifest).toContain('android.permission.health.READ_SLEEP');
    expect(manifest).toContain('android.permission.health.READ_HEART_RATE');
    expect(manifest).toContain('com.google.android.apps.healthdata');
    expect(gradle).toContain('androidx.health.connect:connect-client:1.1.0');
    expect(mainActivity).toContain('registerPlugin(TitanHealthConnectPlugin::class.java)');
  });
});
