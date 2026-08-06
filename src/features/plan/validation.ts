import {
  TITAN_PLAN_SCHEMA_VERSION,
  type PlanValidationResult,
  type TitanCardioSession,
  type TitanExercise,
  type TitanPlan,
  type TitanProject,
  type TitanVideo,
  type TitanWorkoutDay
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const readNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    if (!['youtube.com', 'm.youtube.com'].includes(host)) return null;
    if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(segments[0] ?? '')) return segments[1] ?? null;
    return null;
  } catch { return null; }
}

function validateVideo(value: unknown, path: string, errors: string[]): TitanVideo | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) { errors.push(`${path}.video deve ser um objeto.`); return undefined; }
  const url = readString(value.url);
  const videoId = extractYouTubeVideoId(url);
  if (!url || !videoId) { errors.push(`${path}.video.url deve ser um link válido do YouTube.`); return undefined; }
  return { provider: 'youtube', url, videoId, ...(readString(value.title) ? { title: readString(value.title) } : {}) };
}

function validateExercise(value: unknown, path: string, errors: string[]): TitanExercise | null {
  if (!isRecord(value)) { errors.push(`${path} deve ser um objeto.`); return null; }
  const id = readString(value.id); const name = readString(value.name); const muscleGroup = readString(value.muscleGroup);
  const sets = readNumber(value.sets); const restSeconds = readNumber(value.restSeconds);
  if (!id) errors.push(`${path}.id é obrigatório.`); if (!name) errors.push(`${path}.name é obrigatório.`); if (!muscleGroup) errors.push(`${path}.muscleGroup é obrigatório.`);
  if (!sets || !Number.isInteger(sets) || sets < 1 || sets > 10) errors.push(`${path}.sets deve ser inteiro entre 1 e 10.`);
  if (restSeconds === undefined || restSeconds < 0 || restSeconds > 900) errors.push(`${path}.restSeconds deve estar entre 0 e 900.`);
  const minReps = readNumber(value.minReps); const maxReps = readNumber(value.maxReps); const durationSeconds = readNumber(value.durationSeconds);
  if (minReps === undefined && durationSeconds === undefined) errors.push(`${path} precisa de minReps ou durationSeconds.`);
  if (minReps !== undefined && (!Number.isInteger(minReps) || minReps < 1 || minReps > 100)) errors.push(`${path}.minReps é inválido.`);
  if (maxReps !== undefined && (!Number.isInteger(maxReps) || maxReps < (minReps ?? 1) || maxReps > 100)) errors.push(`${path}.maxReps é inválido.`);
  if (durationSeconds !== undefined && (durationSeconds < 1 || durationSeconds > 3600)) errors.push(`${path}.durationSeconds é inválido.`);
  const targetRir = readNumber(value.targetRir); if (targetRir !== undefined && (targetRir < 0 || targetRir > 10)) errors.push(`${path}.targetRir deve estar entre 0 e 10.`);
  const alternatives = Array.isArray(value.alternatives) ? value.alternatives.map(readString).filter(Boolean) : undefined;
  const commonMistakes = Array.isArray(value.commonMistakes) ? value.commonMistakes.map(readString).filter(Boolean) : undefined;
  const video = validateVideo(value.video, path, errors);
  if (!id || !name || !muscleGroup || !sets || restSeconds === undefined) return null;
  return { id, name, muscleGroup, sets, restSeconds,
    ...(minReps !== undefined ? { minReps } : {}), ...(maxReps !== undefined ? { maxReps } : {}), ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    ...(targetRir !== undefined ? { targetRir } : {}), ...(readString(value.technique) ? { technique: readString(value.technique) } : {}),
    ...(alternatives?.length ? { alternatives } : {}), ...(commonMistakes?.length ? { commonMistakes } : {}), ...(video ? { video } : {}) };
}

function validateWorkout(value: unknown, index: number, errors: string[]): TitanWorkoutDay | null {
  const path = `workouts[${index}]`;
  if (!isRecord(value)) { errors.push(`${path} deve ser um objeto.`); return null; }
  const id = readString(value.id); const day = readString(value.day); const title = readString(value.title);
  if (!id) errors.push(`${path}.id é obrigatório.`); if (!day) errors.push(`${path}.day é obrigatório.`); if (!title) errors.push(`${path}.title é obrigatório.`);
  if (!Array.isArray(value.exercises) || value.exercises.length === 0) errors.push(`${path}.exercises deve ter ao menos um exercício.`);
  const exercises = Array.isArray(value.exercises) ? value.exercises.map((exercise, exerciseIndex) => validateExercise(exercise, `${path}.exercises[${exerciseIndex}]`, errors)).filter((exercise): exercise is TitanExercise => exercise !== null) : [];
  if (!id || !day || !title || exercises.length === 0) return null;
  return { id, day, title, exercises, ...(readString(value.focus) ? { focus: readString(value.focus) } : {}) };
}

function validateCardioSession(value: unknown, index: number, errors: string[]): TitanCardioSession | null {
  const path = `project.cardioSchedule[${index}]`;
  if (!isRecord(value)) { errors.push(`${path} deve ser um objeto.`); return null; }
  const id = readString(value.id); const day = readString(value.day); const startTime = readString(value.startTime); const title = readString(value.title); const type = readString(value.type) as TitanCardioSession['type'];
  const durationMinutes = readNumber(value.durationMinutes);
  const allowed = ['walk','zone2','run-walk','run','hiit','bike','stairs','other'];
  if (!id) errors.push(`${path}.id é obrigatório.`); if (!day) errors.push(`${path}.day é obrigatório.`); if (!/^\d{2}:\d{2}$/.test(startTime)) errors.push(`${path}.startTime deve usar HH:MM.`);
  if (!title) errors.push(`${path}.title é obrigatório.`); if (!allowed.includes(type)) errors.push(`${path}.type é inválido.`);
  if (!durationMinutes || durationMinutes < 5 || durationMinutes > 180) errors.push(`${path}.durationMinutes deve estar entre 5 e 180.`);
  if (!id || !day || !startTime || !title || !allowed.includes(type) || !durationMinutes) return null;
  const instructions = Array.isArray(value.instructions) ? value.instructions.map(readString).filter(Boolean) : undefined;
  return { id, day, startTime, title, type, durationMinutes, ...(readString(value.goal) ? { goal: readString(value.goal) } : {}), ...(instructions?.length ? { instructions } : {}) };
}

function validateProject(value: unknown, errors: string[]): TitanProject | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) { errors.push('project deve ser um objeto.'); return undefined; }
  const name = readString(value.name); const objective = readString(value.objective);
  if (!name) errors.push('project.name é obrigatório.'); if (!objective) errors.push('project.objective é obrigatório.');
  const durationWeeks = readNumber(value.durationWeeks);
  if (durationWeeks !== undefined && (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52)) errors.push('project.durationWeeks deve estar entre 1 e 52.');
  const cardioSchedule = Array.isArray(value.cardioSchedule) ? value.cardioSchedule.map((session, index) => validateCardioSession(session, index, errors)).filter((session): session is TitanCardioSession => session !== null) : undefined;
  if (!name || !objective) return undefined;
  return { name, objective, ...(readString(value.startDate) ? { startDate: readString(value.startDate) } : {}), ...(durationWeeks !== undefined ? { durationWeeks } : {}),
    ...(readString(value.strengthStartTime) ? { strengthStartTime: readString(value.strengthStartTime) } : {}), ...(readString(value.cardioGoal) ? { cardioGoal: readString(value.cardioGoal) } : {}), ...(cardioSchedule?.length ? { cardioSchedule } : {}) };
}

export function validateTitanPlan(input: unknown): PlanValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['O arquivo precisa conter um objeto JSON.'] };
  if (input.schemaVersion !== TITAN_PLAN_SCHEMA_VERSION) errors.push(`schemaVersion deve ser ${TITAN_PLAN_SCHEMA_VERSION}.`);
  const id = readString(input.id); const name = readString(input.name); const createdAt = readString(input.createdAt);
  if (!id) errors.push('id é obrigatório.'); if (!name) errors.push('name é obrigatório.'); if (!createdAt || Number.isNaN(Date.parse(createdAt))) errors.push('createdAt deve ser uma data ISO válida.');
  if (!Array.isArray(input.workouts) || input.workouts.length === 0) errors.push('workouts deve ter ao menos um treino.');
  const workouts = Array.isArray(input.workouts) ? input.workouts.map((workout, index) => validateWorkout(workout, index, errors)).filter((workout): workout is TitanWorkoutDay => workout !== null) : [];
  const workoutIds = workouts.map((workout) => workout.id); if (new Set(workoutIds).size !== workoutIds.length) errors.push('Os IDs dos treinos precisam ser únicos.');
  const exerciseIds = workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.id)); if (new Set(exerciseIds).size !== exerciseIds.length) errors.push('Os IDs dos exercícios precisam ser únicos dentro da ficha.');
  if (!workouts.some((workout) => workout.exercises.some((exercise) => exercise.video))) warnings.push('O projeto não possui vídeos vinculados. Isso não impede a importação.');
  const project = validateProject(input.project, errors);
  if (errors.length || !id || !name || !createdAt || workouts.length === 0) return { ok: false, errors };
  const plan: TitanPlan = { schemaVersion: TITAN_PLAN_SCHEMA_VERSION, id, name, createdAt, workouts,
    ...(readString(input.description) ? { description: readString(input.description) } : {}), ...(readString(input.author) ? { author: readString(input.author) } : {}), ...(project ? { project } : {}) };
  return { ok: true, plan, warnings };
}
