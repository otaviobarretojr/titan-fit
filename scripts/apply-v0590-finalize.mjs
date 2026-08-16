import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);

let demo = read('src/features/demo/fullDemo.ts');
demo = demo.replace(/,\s*videoPolicy:\s*'required'/g, '').replace(/,\s*videoPolicy:\s*'not-required'/g, '').replace(/,\s*videoPolicy:\s*'optional'/g, '');
demo = demo.replace(/\s*videoLibrary:\s*\{[^\n]*\},\n/g, '');
write('src/features/demo/fullDemo.ts', demo);

const explicit = [
  'src/features/exercise-library/ExerciseLibraryPage.tsx',
  'src/features/exercise-library/ExerciseVideoPlayer.tsx',
  'src/features/exercise-library/TitanSubtitleGuide.tsx',
  'src/features/exercise-library/videos.ts',
  'src/features/exercise-library/videoRegistry.ts',
  'src/features/exercise-library/videoRegistryBatch2.ts',
  'src/features/exercise-library/videoRegistryBatch3.ts',
  'src/features/exercise-library/videoRegistryBatch4.ts',
  'src/features/exercise-library/videoRegistryBatch5.ts',
  'src/features/exercise-library/subtitleLibrary.ts',
  'src/features/exercise-library/subtitleLibrary.test.ts',
  'src/features/plan/WeeklyLibraryPage.tsx',
  'tests/exercise-video-full-coverage.test.ts',
  'tests/titan-engine-video-coverage.test.ts',
  'tests/workout-video-resolution.test.ts',
  'tests/exercise-video-registry.test.ts',
  'tests/exercise-video-validation.test.ts',
  'tests/exercise-video-quality.test.ts',
  'tests/video-registry.test.ts',
  'tests/video-registry-batch2.test.ts',
  'tests/video-registry-batch3.test.ts',
  'tests/video-registry-batch4.test.ts',
  'src/styles/exercise-library-v048.css',
  'src/styles/exercise-video-v059.css'
];
for (const path of explicit) if (fs.existsSync(path)) fs.rmSync(path);

for (const dir of ['src/features/exercise-library', 'tests']) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const lower = name.toLowerCase();
    if (lower.includes('video') && !lower.includes('visual')) {
      const path = `${dir}/${name}`;
      if (fs.statSync(path).isFile()) fs.rmSync(path);
    }
  }
}

let main = read('src/main.tsx');
main = main.replace("import './styles/weekly-library.css';\n", '').replace("import './styles/week-library-v0282.css';\n", '');
write('src/main.tsx', main);
