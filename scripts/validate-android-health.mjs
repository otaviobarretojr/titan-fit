import { readFile } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const [
  configText,
  packageText,
  lockText,
  viteConfig,
  bootstrapWorkflow,
  releaseWorkflow,
  plugin,
  manifest,
  gradle,
  mainActivity,
  rationaleActivity,
  androidManifest,
  androidGradle,
] = await Promise.all([
  read('capacitor.config.json'),
  read('package.json'),
  read('package-lock.json'),
  read('vite.config.ts'),
  read('.github/workflows/android-bootstrap.yml'),
  read('.github/workflows/android-release.yml'),
  read('native/android-health-connect/TitanHealthConnectPlugin.kt'),
  read('native/android-health-connect/AndroidManifest.health-connect.xml'),
  read('native/android-health-connect/health-connect.gradle.kts'),
  read('native/android-health-connect/MainActivity.kt'),
  read('native/android-health-connect/PermissionsRationaleActivity.kt'),
  read('android/app/src/main/AndroidManifest.xml'),
  read('android/app/build.gradle'),
]);

const config = JSON.parse(configText);
const pkg = JSON.parse(packageText);
const lock = JSON.parse(lockText);
const [major, minor, patch] = pkg.version.split('.').map(Number);
const expectedVersionCode = major * 1000000 + minor * 1000 + patch;

assert(config.appId === 'com.otaviobarretojr.titanfit', 'Capacitor deve manter o appId oficial do TITAN FIT');
assert(config.appName === 'TITAN FIT', 'Capacitor deve manter o nome oficial do aplicativo');
assert(config.webDir === 'dist', 'Capacitor deve empacotar o build Vite em dist');
assert(lock.version === pkg.version && lock.packages?.['']?.version === pkg.version, 'package-lock deve usar a mesma versão do package.json');
assert(androidGradle.includes(`versionName "${pkg.version}"`) && androidGradle.includes(`versionCode ${expectedVersionCode}`), 'APK Android deve usar a mesma versão oficial do TITAN FIT');
assert(androidGradle.includes('minSdkVersion 26'), 'Health Connect exige minSdk Android compatível');

assert(pkg.scripts?.['build:android']?.includes('vite build --mode android'), 'package.json deve manter build Android dedicado');
assert(viteConfig.includes("mode === 'android'"), 'Vite deve distinguir o alvo Android');
assert(viteConfig.includes("base: isAndroid ? './' : '/titan-fit/'"), 'Build Android deve usar assets relativos e Pages deve manter /titan-fit/');
assert(viteConfig.includes("isAndroid\n          ? []"), 'Build Android não deve registrar o Service Worker PWA');
assert(bootstrapWorkflow.includes('npm run build:android'), 'Bootstrap Android deve usar o build nativo');
assert(releaseWorkflow.includes('npm run build:android'), 'Release Android deve usar o build nativo');
assert(releaseWorkflow.includes('Guard Android bundle paths'), 'Release Android deve validar caminhos antes de gerar APK');

assert(plugin.includes('@CapacitorPlugin(name = "TitanHealthConnect")'), 'Plugin nativo TitanHealthConnect deve existir');
for (const record of ['SleepSessionRecord', 'HeartRateRecord', 'StepsRecord', 'ActiveCaloriesBurnedRecord', 'ExerciseSessionRecord', 'DistanceRecord', 'BodyFatRecord']) {
  assert(plugin.includes(record), `Plugin Health Connect deve mapear ${record}`);
}
assert(plugin.includes('requestHealthPermissions') && plugin.includes('readSamples'), 'Plugin nativo deve expor permissões e leitura de amostras');
assert(plugin.includes('CoroutineScope') && plugin.includes('Dispatchers.IO'), 'Leituras Health Connect devem executar em coroutine de IO');

for (const permission of ['READ_SLEEP', 'READ_HEART_RATE', 'READ_STEPS', 'READ_ACTIVE_CALORIES_BURNED', 'READ_EXERCISE', 'READ_DISTANCE', 'READ_BODY_FAT']) {
  assert(manifest.includes(`android.permission.health.${permission}`), `Manifesto-base Health Connect deve declarar ${permission}`);
  assert(androidManifest.includes(`android.permission.health.${permission}`), `Manifesto Android gerado deve declarar ${permission}`);
}
assert(manifest.includes('com.google.android.apps.healthdata') && androidManifest.includes('com.google.android.apps.healthdata'), 'Manifestos devem consultar o provedor Health Connect');
assert(androidManifest.includes('androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'), 'Android deve expor a justificativa das permissões Health Connect até Android 13');
assert(androidManifest.includes('android.intent.action.VIEW_PERMISSION_USAGE') && androidManifest.includes('android.intent.category.HEALTH_PERMISSIONS'), 'Android deve expor a justificativa das permissões Health Connect no Android 14+');
assert(rationaleActivity.includes('Dados de saúde') && rationaleActivity.includes('não são vendidos nem usados para publicidade'), 'TITAN deve explicar de forma clara o uso local dos dados de saúde');
assert(gradle.includes('androidx.health.connect:connect-client:1.1.0') && androidGradle.includes('androidx.health.connect:connect-client:1.1.0'), 'Android deve usar Health Connect estável 1.1.0');
assert(mainActivity.includes('registerPlugin(TitanHealthConnectPlugin::class.java)'), 'MainActivity deve registrar o plugin TitanHealthConnect');

if (failures.length) {
  console.error('Validação Android/Health Connect falhou:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`Validação Android/Health Connect v${pkg.version} concluída com sucesso.`);
