export type TitanProgressionSet = { weightKg: number | null; repetitions: number | null; rir: number | null };
export type TitanProgressionSession = { sets: TitanProgressionSet[] };
export type TitanProgressionPrescription = { minReps: number; maxReps: number; targetRir: number; loadIncrementPercent?: number };
export type TitanProgressionDecision = {
  status: 'insufficient' | 'maintain' | 'progress' | 'review';
  title: string;
  message: string;
  suggestedWeightKg: number | null;
  suggestedReps: number | null;
  confidence: 'low' | 'medium' | 'high';
  trend: 'first' | 'stable' | 'improving' | 'declining';
};

type Performance = {
  maxWeightKg: number;
  totalReps: number;
  averageReps: number;
  minimumReps: number;
  averageRir: number | null;
  validSets: number;
};

export function decideTitanProgression(
  sessionsDescending: TitanProgressionSession[],
  prescription: TitanProgressionPrescription,
): TitanProgressionDecision {
  const minReps = Math.max(1, prescription.minReps);
  const maxReps = Math.max(minReps, prescription.maxReps);
  const targetRir = Math.max(0, prescription.targetRir);
  const increment = Math.max(0.01, prescription.loadIncrementPercent ?? 0.025);
  const performances = sessionsDescending.slice(0, 3).map(summarize).filter((item) => item.validSets > 0);

  if (!performances.length) return decision('insufficient', 'Primeira referência', `Conclua o exercício em ${minReps}–${maxReps} reps e registre o RIR para criar a referência.`, null, null, 'low', 'first');
  const latest = performances[0];
  if (performances.length < 2) return decision('maintain', 'Consolidar referência', `Repita ${formatWeight(latest.maxWeightKg)} buscando ${minReps}–${maxReps} reps com RIR próximo de ${targetRir}.`, latest.maxWeightKg, clampRep(Math.round(latest.averageReps), minReps, maxReps), 'low', 'first');

  const previous = performances[1];
  const third = performances[2] ?? null;
  const trend = compare(latest, previous);
  const rirKnown = latest.averageRir !== null;
  const effortTooHigh = rirKnown && latest.averageRir! < Math.max(0, targetRir - 1);
  const belowRange = latest.minimumReps < minReps;
  const allAtTop = latest.minimumReps >= maxReps;
  const rirAllowsLoad = !rirKnown || latest.averageRir! >= targetRir;
  const repeatedStruggle = belowRange && effortTooHigh && third !== null && previous.minimumReps < minReps;

  if (repeatedStruggle) {
    const suggested = roundToIncrement(latest.maxWeightKg * (1 - increment), 0.5);
    return decision('review', 'Reduzir e reconstruir', `Duas sessões ficaram abaixo da faixa com esforço excessivo. Use ${formatWeight(suggested)} e reconstrua a partir de ${minReps} reps.`, suggested, minReps, 'high', 'declining');
  }
  if (belowRange || effortTooHigh) {
    const reason = belowRange ? `Houve série abaixo de ${minReps} reps.` : `O RIR médio ficou abaixo do alvo ${targetRir}.`;
    return decision('review', 'Não aumentar agora', `${reason} Mantenha ${formatWeight(latest.maxWeightKg)} e recupere a faixa antes de progredir.`, latest.maxWeightKg, minReps, performances.length >= 3 ? 'high' : 'medium', trend === 'declining' ? 'declining' : 'stable');
  }
  if (allAtTop && rirAllowsLoad) {
    const suggested = roundToIncrement(latest.maxWeightKg * (1 + increment), 0.5);
    return decision('progress', 'Subir carga', `Topo da faixa concluído com margem adequada. Próxima referência: ${formatWeight(suggested)}, retornando para ${minReps}–${Math.min(maxReps, minReps + 1)} reps.`, suggested, minReps, performances.length >= 3 ? 'high' : 'medium', 'improving');
  }
  if (latest.averageReps >= minReps && latest.averageReps < maxReps) {
    const nextRep = clampRep(Math.floor(latest.averageReps) + 1, minReps, maxReps);
    return decision('maintain', 'Progredir repetições', `Mantenha ${formatWeight(latest.maxWeightKg)} e busque cerca de ${nextRep} reps por série com RIR ${targetRir}.`, latest.maxWeightKg, nextRep, performances.length >= 3 ? 'high' : 'medium', trend);
  }
  return decision('maintain', 'Manter e consolidar', `Mantenha ${formatWeight(latest.maxWeightKg)} dentro de ${minReps}–${maxReps} reps com RIR ${targetRir}.`, latest.maxWeightKg, clampRep(Math.round(latest.averageReps), minReps, maxReps), performances.length >= 3 ? 'high' : 'medium', 'stable');
}

function summarize(session: TitanProgressionSession): Performance {
  const sets = session.sets.filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!sets.length) return { maxWeightKg: 0, totalReps: 0, averageReps: 0, minimumReps: 0, averageRir: null, validSets: 0 };
  const reps = sets.map((set) => set.repetitions ?? 0);
  const rir = sets.map((set) => set.rir).filter((value): value is number => value !== null);
  return {
    maxWeightKg: Math.max(...sets.map((set) => set.weightKg ?? 0)),
    totalReps: reps.reduce((sum, value) => sum + value, 0),
    averageReps: reps.reduce((sum, value) => sum + value, 0) / sets.length,
    minimumReps: Math.min(...reps),
    averageRir: rir.length ? rir.reduce((sum, value) => sum + value, 0) / rir.length : null,
    validSets: sets.length,
  };
}

function compare(current: Performance, previous: Performance): TitanProgressionDecision['trend'] {
  if (current.maxWeightKg > previous.maxWeightKg) return 'improving';
  if (current.maxWeightKg < previous.maxWeightKg) return 'declining';
  if (current.totalReps > previous.totalReps) return 'improving';
  if (current.totalReps < previous.totalReps) return 'declining';
  return 'stable';
}

function decision(status: TitanProgressionDecision['status'], title: string, message: string, suggestedWeightKg: number | null, suggestedReps: number | null, confidence: TitanProgressionDecision['confidence'], trend: TitanProgressionDecision['trend']): TitanProgressionDecision {
  return { status, title, message, suggestedWeightKg, suggestedReps, confidence, trend };
}
function clampRep(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function roundToIncrement(value: number, increment: number) { return Math.round(value / increment) * increment; }
function formatWeight(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`; }
