import {
  TITAN_PLAN_SCHEMA_VERSION,
  type CardioProgressionStep,
  type ExerciseType,
  type ExerciseVideoPolicy,
  type PlanValidationResult,
  type TitanCardioSession,
  type TitanExercise,
  type TitanPlan,
  type TitanProject,
  type TitanVideo,
  type TitanVideoLibrary,
  type TitanWorkoutDay
} from './types';

const TYPES: ExerciseType[] = ['strength', 'distance', 'cardio', 'isometric', 'mobility'];
const VIDEO_POLICIES: ExerciseVideoPolicy[] = ['required', 'not-required', 'optional'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const readString = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const readNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const optionalNumber = (record: Record<string, unknown>, key: string) => readNumber(record[key]);

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url); const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    if (!['youtube.com', 'm.youtube.com'].includes(host)) return null;
    if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
    const segments = parsed.pathname.split('/').filter(Boolean);
    return ['shorts', 'embed', 'live'].includes(segments[0] ?? '') ? segments[1] ?? null : null;
  } catch { return null; }
}

function validateVideo(value: unknown, path: string, errors: string[]): TitanVideo | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) { errors.push(`${path}.video deve ser um objeto.`); return undefined; }
  const provider = readString(value.provider) || 'youtube';
  if (provider !== 'youtube') { errors.push(`${path}.video.provider deve ser youtube.`); return undefined; }
  const url = readString(value.url); const explicitId = readString(value.videoId); const videoId = explicitId || (url ? extractYouTubeVideoId(url) ?? '' : '');
  const status = readString(value.status);
  if (!videoId && status !== 'pending-curation') { errors.push(`${path}.video precisa de videoId ou url válida do YouTube.`); return undefined; }
  return {
    provider: 'youtube',
    ...(url ? { url } : {}),
    ...(videoId ? { videoId } : {}),
    ...(readString(value.title) ? { title: readString(value.title) } : {}),
    ...(readString(value.channel) ? { channel: readString(value.channel) } : {}),
    ...(status === 'curated' || status === 'pending-curation' ? { status } : {}),
    ...(readString(value.searchQuery) ? { searchQuery: readString(value.searchQuery) } : {})
  };
}

function validateProgression(value: unknown, path: string, errors: string[]): CardioProgressionStep[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) { errors.push(`${path}.progression deve ser uma lista.`); return undefined; }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) { errors.push(`${path}.progression[${index}] deve ser objeto.`); return []; }
    const startWeek = optionalNumber(item, 'startWeek'); const endWeek = optionalNumber(item, 'endWeek');
    if (!startWeek || !endWeek || !Number.isInteger(startWeek) || !Number.isInteger(endWeek) || endWeek < startWeek) { errors.push(`${path}.progression[${index}] possui semanas inválidas.`); return []; }
    return [{ startWeek, endWeek,
      ...(optionalNumber(item, 'durationSeconds') !== undefined ? { durationSeconds: optionalNumber(item, 'durationSeconds') } : {}),
      ...(optionalNumber(item, 'speedKmh') !== undefined ? { speedKmh: optionalNumber(item, 'speedKmh') } : {}),
      ...(optionalNumber(item, 'speedMinKmh') !== undefined ? { speedMinKmh: optionalNumber(item, 'speedMinKmh') } : {}),
      ...(optionalNumber(item, 'speedMaxKmh') !== undefined ? { speedMaxKmh: optionalNumber(item, 'speedMaxKmh') } : {}),
      ...(optionalNumber(item, 'inclinePercent') !== undefined ? { inclinePercent: optionalNumber(item, 'inclinePercent') } : {}),
      ...(readString(item.cardioZone) ? { cardioZone: readString(item.cardioZone) } : {}),
      ...(readString(item.note) ? { note: readString(item.note) } : {}) }];
  });
}

function validateExercise(value: unknown, path: string, errors: string[]): TitanExercise | null {
  if (!isRecord(value)) { errors.push(`${path} deve ser um objeto.`); return null; }
  const id = readString(value.id); const name = readString(value.name); const muscleGroup = readString(value.muscleGroup);
  const exerciseType = (readString(value.exerciseType) || 'strength') as ExerciseType;
  if (!id) errors.push(`${path}.id é obrigatório.`); if (!name) errors.push(`${path}.name é obrigatório.`); if (!muscleGroup) errors.push(`${path}.muscleGroup é obrigatório.`);
  if (!TYPES.includes(exerciseType)) errors.push(`${path}.exerciseType é inválido.`);
  const sets = optionalNumber(value, 'sets'); const restSeconds = optionalNumber(value, 'restSeconds'); const minReps = optionalNumber(value, 'minReps'); const maxReps = optionalNumber(value, 'maxReps');
  const durationSeconds = optionalNumber(value, 'durationSeconds'); const distanceMeters = optionalNumber(value, 'distanceMeters'); const minDistanceMeters = optionalNumber(value, 'minDistanceMeters'); const maxDistanceMeters = optionalNumber(value, 'maxDistanceMeters');
  if (['strength', 'distance', 'isometric'].includes(exerciseType) && (!sets || !Number.isInteger(sets) || sets < 1 || sets > 20)) errors.push(`${path}.sets deve ser inteiro entre 1 e 20.`);
  if (exerciseType === 'mobility' && sets !== undefined && (!Number.isInteger(sets) || sets < 1 || sets > 20)) errors.push(`${path}.sets é inválido.`);
  if (restSeconds !== undefined && (restSeconds < 0 || restSeconds > 1800)) errors.push(`${path}.restSeconds é inválido.`);
  if (exerciseType === 'strength') { if (minReps === undefined) errors.push(`${path}.minReps é obrigatório para strength.`); if (minReps !== undefined && (!Number.isInteger(minReps) || minReps < 1 || minReps > 200)) errors.push(`${path}.minReps é inválido.`); if (maxReps !== undefined && (!Number.isInteger(maxReps) || maxReps < (minReps ?? 1))) errors.push(`${path}.maxReps é inválido.`); }
  if (exerciseType === 'distance' && distanceMeters === undefined && minDistanceMeters === undefined) errors.push(`${path} precisa de distanceMeters ou minDistanceMeters.`);
  if (['cardio', 'isometric', 'mobility'].includes(exerciseType) && durationSeconds === undefined) errors.push(`${path}.durationSeconds é obrigatório para ${exerciseType}.`);
  const targetRir = optionalNumber(value, 'targetRir'); const alternatives = Array.isArray(value.alternatives) ? value.alternatives.map(readString).filter(Boolean) : undefined; const commonMistakes = Array.isArray(value.commonMistakes) ? value.commonMistakes.map(readString).filter(Boolean) : undefined;
  const video = validateVideo(value.video, path, errors); const progression = validateProgression(value.progression, path, errors); const rawPolicy = readString(value.videoPolicy); const videoPolicy = VIDEO_POLICIES.includes(rawPolicy as ExerciseVideoPolicy) ? rawPolicy as ExerciseVideoPolicy : undefined;
  if (!id || !name || !muscleGroup || !TYPES.includes(exerciseType)) return null;
  return { id, name, muscleGroup, exerciseType,
    ...(sets !== undefined ? { sets } : {}), ...(restSeconds !== undefined ? { restSeconds } : {}), ...(minReps !== undefined ? { minReps } : {}), ...(maxReps !== undefined ? { maxReps } : {}), ...(targetRir !== undefined ? { targetRir } : {}),
    ...(durationSeconds !== undefined ? { durationSeconds } : {}), ...(distanceMeters !== undefined ? { distanceMeters } : {}), ...(minDistanceMeters !== undefined ? { minDistanceMeters } : {}), ...(maxDistanceMeters !== undefined ? { maxDistanceMeters } : {}),
    ...(optionalNumber(value, 'speedKmh') !== undefined ? { speedKmh: optionalNumber(value, 'speedKmh') } : {}), ...(optionalNumber(value, 'speedMinKmh') !== undefined ? { speedMinKmh: optionalNumber(value, 'speedMinKmh') } : {}), ...(optionalNumber(value, 'speedMaxKmh') !== undefined ? { speedMaxKmh: optionalNumber(value, 'speedMaxKmh') } : {}),
    ...(optionalNumber(value, 'inclinePercent') !== undefined ? { inclinePercent: optionalNumber(value, 'inclinePercent') } : {}), ...(readString(value.averagePace) ? { averagePace: readString(value.averagePace) } : {}), ...(optionalNumber(value, 'averageHeartRate') !== undefined ? { averageHeartRate: optionalNumber(value, 'averageHeartRate') } : {}),
    ...(optionalNumber(value, 'targetHeartRateMin') !== undefined ? { targetHeartRateMin: optionalNumber(value, 'targetHeartRateMin') } : {}), ...(optionalNumber(value, 'targetHeartRateMax') !== undefined ? { targetHeartRateMax: optionalNumber(value, 'targetHeartRateMax') } : {}), ...(optionalNumber(value, 'calories') !== undefined ? { calories: optionalNumber(value, 'calories') } : {}),
    ...(readString(value.cardioZone) ? { cardioZone: readString(value.cardioZone) } : {}), ...(readString(value.notes) ? { notes: readString(value.notes) } : {}), ...(progression?.length ? { progression } : {}), ...(readString(value.technique) ? { technique: readString(value.technique) } : {}),
    ...(alternatives?.length ? { alternatives } : {}), ...(commonMistakes?.length ? { commonMistakes } : {}), ...(video ? { video } : {}), ...(videoPolicy ? { videoPolicy } : {}) };
}

function validateWorkout(value: unknown, index: number, errors: string[]): TitanWorkoutDay | null {
  const path = `workouts[${index}]`; if (!isRecord(value)) { errors.push(`${path} deve ser um objeto.`); return null; }
  const id = readString(value.id); const day = readString(value.day); const title = readString(value.title); const exercises = Array.isArray(value.exercises) ? value.exercises.map((exercise, exerciseIndex) => validateExercise(exercise, `${path}.exercises[${exerciseIndex}]`, errors)).filter((exercise): exercise is TitanExercise => exercise !== null) : [];
  if (!id) errors.push(`${path}.id é obrigatório.`); if (!day) errors.push(`${path}.day é obrigatório.`); if (!title) errors.push(`${path}.title é obrigatório.`); if (!exercises.length) errors.push(`${path}.exercises deve ter exercícios.`);
  return id && day && title && exercises.length ? { id, day, title, exercises, ...(readString(value.focus) ? { focus: readString(value.focus) } : {}) } : null;
}

function validateCardioSession(value: unknown, index: number, errors: string[]): TitanCardioSession | null {
  const path = `project.cardioSchedule[${index}]`; if (!isRecord(value)) return null;
  const id = readString(value.id); const day = readString(value.day); const startTime = readString(value.startTime); const title = readString(value.title); const type = readString(value.type) as TitanCardioSession['type']; const durationMinutes = readNumber(value.durationMinutes); const allowed = ['walk','zone2','run-walk','run','hiit','bike','stairs','other'];
  if (!id || !day || !/^\d{2}:\d{2}$/.test(startTime) || !title || !allowed.includes(type) || !durationMinutes) { errors.push(`${path} é inválido.`); return null; }
  const instructions = Array.isArray(value.instructions) ? value.instructions.map(readString).filter(Boolean) : undefined;
  return { id, day, startTime, title, type, durationMinutes, ...(readString(value.goal) ? { goal: readString(value.goal) } : {}), ...(instructions?.length ? { instructions } : {}) };
}

function validateProject(value: unknown, errors: string[]): TitanProject | undefined {
  if (!isRecord(value)) return undefined; const name = readString(value.name); const objective = readString(value.objective); if (!name || !objective) { errors.push('project é inválido.'); return undefined; }
  const durationWeeks = readNumber(value.durationWeeks); const cardioSchedule = Array.isArray(value.cardioSchedule) ? value.cardioSchedule.map((session, index) => validateCardioSession(session, index, errors)).filter((session): session is TitanCardioSession => session !== null) : undefined;
  return { name, objective, ...(readString(value.startDate) ? { startDate: readString(value.startDate) } : {}), ...(durationWeeks !== undefined ? { durationWeeks } : {}), ...(readString(value.strengthStartTime) ? { strengthStartTime: readString(value.strengthStartTime) } : {}), ...(readString(value.cardioGoal) ? { cardioGoal: readString(value.cardioGoal) } : {}), ...(cardioSchedule?.length ? { cardioSchedule } : {}) };
}

function validateVideoLibrary(value: unknown): TitanVideoLibrary | undefined {
  if (!isRecord(value)) return undefined;
  return { ...(readString(value.version) ? { version: readString(value.version) } : {}), ...(readNumber(value.curatedVideos) !== undefined ? { curatedVideos: readNumber(value.curatedVideos) } : {}), ...(readNumber(value.pendingCuration) !== undefined ? { pendingCuration: readNumber(value.pendingCuration) } : {}), ...(readNumber(value.cardioWithoutVideo) !== undefined ? { cardioWithoutVideo: readNumber(value.cardioWithoutVideo) } : {}) };
}

export function validateTitanPlan(input: unknown): PlanValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['O arquivo precisa conter um objeto JSON.'] };
  if (input.schemaVersion !== TITAN_PLAN_SCHEMA_VERSION) errors.push(`schemaVersion deve ser ${TITAN_PLAN_SCHEMA_VERSION}.`);
  const id = readString(input.id); const name = readString(input.name); const createdAt = readString(input.createdAt); const workouts = Array.isArray(input.workouts) ? input.workouts.map((workout, index) => validateWorkout(workout, index, errors)).filter((workout): workout is TitanWorkoutDay => workout !== null) : [];
  if (!id) errors.push('id é obrigatório.'); if (!name) errors.push('name é obrigatório.'); if (!createdAt || Number.isNaN(Date.parse(createdAt))) errors.push('createdAt deve ser data ISO.'); if (!workouts.length) errors.push('workouts deve ter treinos.');
  const exerciseIds = workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.id)); if (new Set(exerciseIds).size !== exerciseIds.length) errors.push('Os IDs dos exercícios precisam ser únicos.');
  if (!workouts.some((workout) => workout.exercises.some((exercise) => exercise.video?.videoId))) warnings.push('O projeto não possui vídeos reproduzíveis vinculados.');
  const project = validateProject(input.project, errors); const videoLibrary = validateVideoLibrary(input.videoLibrary);
  if (errors.length || !id || !name || !createdAt || !workouts.length) return { ok: false, errors };
  return { ok: true, plan: { schemaVersion: TITAN_PLAN_SCHEMA_VERSION, id, name, createdAt, workouts, ...(readString(input.description) ? { description: readString(input.description) } : {}), ...(readString(input.author) ? { author: readString(input.author) } : {}), ...(project ? { project } : {}), ...(videoLibrary ? { videoLibrary } : {}) }, warnings };
}
