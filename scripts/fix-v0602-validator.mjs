import fs from 'node:fs';
const path = 'scripts/validate-project.mjs';
let text = fs.readFileSync(path, 'utf8');
const before = "assert(programmingPage.includes('musculação e cardio integrado') && programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\"), 'Programação deve reunir musculação e cardio no projeto');";
const after = "assert(programmingPage.includes(\"exercise.exerciseType === 'cardio'\") && programmingPage.includes(\"exercise.exerciseType === 'distance'\") && programmingPage.includes('workoutSummary'), 'Programação deve reunir musculação e cardio no projeto');";
if (!text.includes(before)) throw new Error('Validator marker not found');
fs.writeFileSync(path, text.replace(before, after));
