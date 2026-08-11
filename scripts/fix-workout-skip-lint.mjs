import fs from 'node:fs';
const file='src/features/workout/WorkoutExecutionView.tsx';
let source=fs.readFileSync(file,'utf8');
source=source.replace(/\\\"/g,'"');
fs.writeFileSync(file,source);
console.log('Workout skip lint escapes fixed.');
