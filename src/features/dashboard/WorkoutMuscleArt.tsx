type WorkoutVisual = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'full';

export function getWorkoutVisual(title = '', focus = ''): WorkoutVisual {
  const value = `${title} ${focus}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/leg|perna|quadr|posterior|glute|panturr/.test(value)) return 'legs';
  if (/peit|peitor|chest|push/.test(value)) return 'chest';
  if (/cost|dors|back|pull/.test(value)) return 'back';
  if (/ombro|delto|shoulder/.test(value)) return 'shoulders';
  if (/biceps|triceps|braco|arm/.test(value)) return 'arms';
  return 'full';
}

export function WorkoutMuscleArt({ visual }: { visual: WorkoutVisual }) {
  return <svg className={`workout-muscle-art visual-${visual}`} viewBox="0 0 180 330" aria-hidden="true">
    <defs>
      <linearGradient id="bodyBase" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="currentColor" stopOpacity=".1" />
        <stop offset="1" stopColor="currentColor" stopOpacity=".025" />
      </linearGradient>
      <linearGradient id="muscleGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4ea0ff" stopOpacity=".68" />
        <stop offset="1" stopColor="#1764dd" stopOpacity=".12" />
      </linearGradient>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <g className="body-base" fill="url(#bodyBase)" stroke="currentColor" strokeOpacity=".12" strokeWidth="1.2">
      <ellipse cx="90" cy="28" rx="22" ry="26" />
      <path d="M69 54c-14 8-22 27-24 50l-5 70c-2 20 11 25 19 9l15-50 3 70-13 92c-2 18 6 29 15 17l19-79 18 79c9 12 17 1 15-17l-12-92 3-70 14 50c8 16 21 11 19-9l-5-70c-2-23-10-42-24-50-11-7-36-7-47 0Z" />
    </g>

    <g className="muscle-highlight" fill="url(#muscleGlow)" filter="url(#softGlow)">
      <g className="muscle chest"><path d="M61 76c8-10 19-13 29-9v37c-14 3-25-2-31-12-3-6-2-11 2-16Z"/><path d="M119 76c-8-10-19-13-29-9v37c14 3 25-2 31-12 3-6 2-11-2-16Z"/></g>
      <g className="muscle back"><path d="M59 78c8-12 18-15 31-12v74c-14-4-25-15-31-30-5-13-5-24 0-32Z"/><path d="M121 78c-8-12-18-15-31-12v74c14-4 25-15 31-30 5-13 5-24 0-32Z"/></g>
      <g className="muscle shoulders"><ellipse cx="56" cy="82" rx="15" ry="20"/><ellipse cx="124" cy="82" rx="15" ry="20"/></g>
      <g className="muscle arms"><path d="M42 95c-7 14-8 39-5 69 2 18 12 21 18 6l10-55c3-14-3-24-10-26-5-2-10 0-13 6Z"/><path d="M138 95c7 14 8 39 5 69-2 18-12 21-18 6l-10-55c-3-14 3-24 10-26 5-2 10 0 13 6Z"/></g>
      <g className="muscle legs"><path d="M65 174c-6 28-10 66-12 104-1 30 15 35 24 11l13-63v-57c-9-4-18-2-25 5Z"/><path d="M115 174c6 28 10 66 12 104 1 30-15 35-24 11l-13-63v-57c9-4 18-2 25 5Z"/><path d="M55 250c-3 19-4 43-2 61 2 15 12 18 19 5l9-36-26-30Z"/><path d="M125 250c3 19 4 43 2 61-2 15-12 18-19 5l-9-36 26-30Z"/></g>
      <g className="muscle full"><ellipse cx="90" cy="112" rx="35" ry="49"/><ellipse cx="69" cy="221" rx="19" ry="61"/><ellipse cx="111" cy="221" rx="19" ry="61"/></g>
    </g>
  </svg>;
}
