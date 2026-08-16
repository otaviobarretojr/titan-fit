import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, v) => fs.writeFileSync(p, v);

let demo = read('src/features/demo/fullDemo.ts');
demo = demo.replace(/,\s*videoPolicy:\s*'required'/g, '').replace(/,\s*videoPolicy:\s*'not-required'/g, '').replace(/,\s*videoPolicy:\s*'optional'/g, '');
demo = demo.replace(/\s*videoLibrary:\s*\{[^\n]*\},\n/g, '');
write('src/features/demo/fullDemo.ts', demo);

for (const path of [
  'src/features/exercise-library/ExerciseLibraryPage.tsx',
  'src/features/exercise-library/ExerciseVideoPlayer.tsx',
  'src/features/exercise-library/videos.ts',
  'src/features/exercise-library/TitanSubtitleGuide.tsx',
  'src/features/exercise-library/subtitleLibrary.ts',
  'src/features/exercise-library/subtitleLibrary.test.ts'
]) {
  if (fs.existsSync(path)) fs.rmSync(path);
}

for (const path of ['src/styles/exercise-library-v048.css', 'src/styles/exercise-video-v059.css']) {
  if (fs.existsSync(path)) fs.rmSync(path);
}
