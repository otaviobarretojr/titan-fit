import type { WorkoutHistoryRecord } from '../history/types';

const DAY = 86_400_000;
const FIVE_K_METERS = 5000;

export type CardioEvolutionPeriod = 7 | 30;
export type CardioTrend = 'improved' | 'declined' | 'stable' | 'unavailable';

export type CardioEvolution = {
  periodDays: CardioEvolutionPeriod;
  sessions: number;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  bestDistanceMeters: number;
  averagePaceSecondsPerKm: number | null;
  averageHeartRate: number | null;
  fiveKmProgressPercent: number;
  fiveKmReached: boolean;
  sessionsDelta: number | null;
  distanceDeltaMeters: number | null;
  paceDeltaSecondsPerKm: number | null;
  paceTrend: CardioTrend;
  insight: { title: string; message: string };
};

type WindowSummary = Omit<CardioEvolution, 'periodDays' | 'sessionsDelta' | 'distanceDeltaMeters' | 'paceDeltaSecondsPerKm' | 'paceTrend' | 'insight'>;
type CardioEntry = { record: WorkoutHistoryRecord; exercise: WorkoutHistoryRecord['exercises'][number] };

export function buildCardioEvolution(records: WorkoutHistoryRecord[], periodDays: CardioEvolutionPeriod, now = new Date()): CardioEvolution {
  const current = summarize(records, periodDays, now, 0);
  const previous = summarize(records, periodDays, now, periodDays);
  const sessionsDelta = previous.sessions || current.sessions ? current.sessions - previous.sessions : null;
  const distanceDeltaMeters = previous.totalDistanceMeters || current.totalDistanceMeters ? current.totalDistanceMeters - previous.totalDistanceMeters : null;
  const paceDeltaSecondsPerKm = current.averagePaceSecondsPerKm !== null && previous.averagePaceSecondsPerKm !== null
    ? Math.round(current.averagePaceSecondsPerKm - previous.averagePaceSecondsPerKm)
    : null;
  const paceTrend = paceDeltaSecondsPerKm === null ? 'unavailable' : Math.abs(paceDeltaSecondsPerKm) <= 3 ? 'stable' : paceDeltaSecondsPerKm < 0 ? 'improved' : 'declined';

  return {
    ...current,
    periodDays,
    sessionsDelta,
    distanceDeltaMeters,
    paceDeltaSecondsPerKm,
    paceTrend,
    insight: buildInsight(current, previous, paceTrend),
  };
}

function summarize(records: WorkoutHistoryRecord[], periodDays: CardioEvolutionPeriod, now: Date, offsetDays: number): WindowSummary {
  const end = now.getTime() - offsetDays * DAY;
  const start = end - periodDays * DAY;
  const entries: CardioEntry[] = records
    .filter((record) => {
      const time = new Date(record.completedAt).getTime();
      return time >= start && time < end;
    })
    .flatMap((record) => record.exercises
      .filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance')
      .map((exercise) => ({ record, exercise })));

  const sessions = entries.length;
  const totalDurationSeconds = entries.reduce((sum, item) => sum + Math.max(0, item.exercise.totalDurationSeconds || 0), 0);
  const totalDistanceMeters = entries.reduce((sum, item) => sum + Math.max(0, item.exercise.totalDistanceMeters || 0), 0);
  const runWalkEntries = entries.filter(isRunWalkEntry);
  const bestDistanceMeters = runWalkEntries.reduce((best, item) => Math.max(best, item.exercise.totalDistanceMeters || 0), 0);
  const distanceForPace = runWalkEntries.reduce((sum, item) => {
    const distance = item.exercise.totalDistanceMeters || 0;
    const duration = item.exercise.totalDurationSeconds || 0;
    return distance > 0 && duration > 0 ? sum + distance : sum;
  }, 0);
  const durationForPace = runWalkEntries.reduce((sum, item) => {
    const distance = item.exercise.totalDistanceMeters || 0;
    const duration = item.exercise.totalDurationSeconds || 0;
    return distance > 0 && duration > 0 ? sum + duration : sum;
  }, 0);
  const averagePaceSecondsPerKm = distanceForPace > 0 ? Math.round(durationForPace / (distanceForPace / 1000)) : null;
  const heartRates = entries.map((item) => item.exercise.averageHeartRate).filter((value): value is number => typeof value === 'number' && value > 0);
  const averageHeartRate = heartRates.length ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length) : null;

  return {
    sessions,
    totalDurationSeconds,
    totalDistanceMeters,
    bestDistanceMeters,
    averagePaceSecondsPerKm,
    averageHeartRate,
    fiveKmProgressPercent: Math.min(100, Math.round((bestDistanceMeters / FIVE_K_METERS) * 100)),
    fiveKmReached: bestDistanceMeters >= FIVE_K_METERS,
  };
}

function isRunWalkEntry({ record, exercise }: CardioEntry) {
  const text = `${record.workoutTitle} ${exercise.name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return !/(bike|biciclet|ciclismo|escada|stairs|remo|rowing|eliptic)/.test(text);
}

function buildInsight(current: WindowSummary, previous: WindowSummary, paceTrend: CardioTrend) {
  if (!current.sessions) return { title: 'Construindo base cardiovascular', message: 'Conclua sessões de cardio para acompanhar distância, ritmo, frequência cardíaca e progresso rumo aos 5 km.' };
  if (current.fiveKmReached) return { title: 'Marco de 5 km alcançado', message: `Sua melhor distância terrestre no período foi ${formatDistance(current.bestDistanceMeters)}. Agora o foco pode avançar para consistência e ritmo.` };
  if (paceTrend === 'improved') return { title: 'Ritmo evoluindo', message: 'Seu ritmo médio de corrida/caminhada melhorou em relação ao período anterior. Mantenha a progressão sem transformar sessões leves em treinos intensos.' };
  if (paceTrend === 'declined' && current.sessions >= previous.sessions) return { title: 'Ritmo caiu apesar da consistência', message: 'Você manteve as sessões, mas o ritmo terrestre médio ficou mais lento. Observe esforço, recuperação e objetivo de cada sessão antes de aumentar intensidade.' };
  if (current.bestDistanceMeters > 0) return { title: 'Avançando rumo aos 5 km', message: `Melhor distância terrestre: ${formatDistance(current.bestDistanceMeters)} · ${current.fiveKmProgressPercent}% do marco de 5 km.` };
  return { title: 'Consistência cardiovascular', message: `${current.sessions} sessão${current.sessions === 1 ? '' : 'ões'} registrada${current.sessions === 1 ? '' : 's'} no período. Continue registrando duração e esforço para ampliar a análise.` };
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
