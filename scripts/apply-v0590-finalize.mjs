import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);

let demo = read('src/features/demo/fullDemo.ts');
demo = demo.replace(/,\s*videoPolicy:\s*'required'/g, '').replace(/,\s*videoPolicy:\s*'not-required'/g, '').replace(/,\s*videoPolicy:\s*'optional'/g, '');
demo = demo.replace(/\s*videoLibrary:\s*\{[^\n]*\},\n/g, '');
write('src/features/demo/fullDemo.ts', demo);

const removeFiles = [
  'src/features/exercise-library/ExerciseLibraryPage.tsx',
  'src/features/exercise-library/ExerciseVideoPlayer.tsx',
  'src/features/exercise-library/videos.ts',
  'src/features/exercise-library/TitanSubtitleGuide.tsx',
  'src/features/exercise-library/subtitleLibrary.ts',
  'src/features/exercise-library/subtitleLibrary.test.ts',
  'src/features/plan/WeeklyLibraryPage.tsx',
  'tests/exercise-video-full-coverage.test.ts',
  'tests/titan-engine-video-coverage.test.ts',
  'tests/workout-video-resolution.test.ts',
  'src/styles/exercise-library-v048.css',
  'src/styles/exercise-video-v059.css'
];
for (const path of removeFiles) if (fs.existsSync(path)) fs.rmSync(path);

let main = read('src/main.tsx');
main = main.replace("import './styles/weekly-library.css';\n", '').replace("import './styles/week-library-v0282.css';\n", '');
write('src/main.tsx', main);
