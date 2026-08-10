import { readFile } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const [configText, plugin, manifest, gradle, mainActivity] = await Promise.all([
  read('capacitor.config.json'),
  read('native/android-health-connect/TitanHealthConnectPlugin.kt'),
  read('native/android-health-connect/AndroidManifest.health-connect.xml'),
  read('native/android-health-connect/health-connect.gradle.kts'),
  read('native/android-health-connect/MainActivity.kt'),
]);

const config = JSON.parse(configText);
assert(config.appId === 'com.otaviobarretojr.titanfit', 'Capacitor deve manter o appId oficial do TITAN FIT');
assert(config.appName === 'TITAN FIT', 'Capacitor deve manter o nome oficial do aplicativo');
assert(config.webDir === 'dist', 'Capacitor deve empacotar o build Vite em dist');
assert(plugin.includes('@CapacitorPlugin(name = "TitanHealthConnect")'), 'Plugin nativo TitanHealthConnect deve existir');
for (const record of ['SleepSessionRecord', 'HeartRateRecord', 'StepsRecord', 'ActiveCaloriesBurnedRecord', 'ExerciseSessionRecord', 'DistanceRecord', 'BodyFatRecord']) {
  assert(plugin.includes(record), `Plugin Health Connect deve mapear ${record}`);
}
assert(plugin.includes('requestHealthPermissions') && plugin.includes('readSamples'), 'Plugin nativo deve expor permissões e leitura de amostras');
assert(plugin.includes('CoroutineScope') && plugin.includes('Dispatchers.IO'), 'Leituras Health Connect devem executar em coroutine de IO');
for (const permission of ['READ_SLEEP', 'READ_HEART_RATE', 'READ_STEPS', 'READ_ACTIVE_CALORIES_BURNED', 'READ_EXERCISE', 'READ_DISTANCE', 'READ_BODY_FAT']) {
  assert(manifest.includes(`android.permission.health.${permission}`), `Manifesto Health Connect deve declarar ${permission}`);
}
assert(manifest.includes('com.google.android.apps.healthdata'), 'Manifesto deve consultar o provedor Health Connect');
assert(gradle.includes('androidx.health.connect:connect-client:1.1.0'), 'Android deve usar Health Connect estável 1.1.0');
assert(mainActivity.includes('registerPlugin(TitanHealthConnectPlugin::class.java)'), 'MainActivity deve registrar o plugin TitanHealthConnect');

if (failures.length) {
  console.error('Validação Android/Health Connect falhou:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Validação Android/Health Connect concluída com sucesso.');
