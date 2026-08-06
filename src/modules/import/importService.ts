import { db, type TitanFitDatabase } from '../../database/database';
import type { TitanEnvelope } from '../../types/training';
import { titanEnvelopeSchema } from './schema';

export const MAX_TITAN_FILE_SIZE = 2 * 1024 * 1024;

export async function parseTitanFile(file: File): Promise<TitanEnvelope> {
  if (!file.name.endsWith('.titan.json')) throw new Error('Selecione um arquivo com extensão .titan.json.');
  if (file.size > MAX_TITAN_FILE_SIZE) throw new Error('O arquivo excede o limite de 2 MB.');
  let raw: unknown;
  try { raw = JSON.parse(await file.text()); } catch { throw new Error('O arquivo contém JSON inválido.'); }
  const result = titanEnvelopeSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  return result.data as TitanEnvelope;
}

export async function importTrainingPlan(envelope: TitanEnvelope, fileName: string, database: TitanFitDatabase = db) {
  const now = new Date().toISOString();
  try {
    await database.transaction('rw', database.trainingPlans, database.trainingPlanSessions, database.trainingPlanExercises, database.importHistory, async () => {
      await database.trainingPlans.where('status').equals('active').modify({ status: 'archived' });
      await database.trainingPlans.put({ id: envelope.payload.planId, name: envelope.payload.name, description: envelope.payload.description, author: envelope.author, createdAt: envelope.createdAt, importedAt: now, status: 'active', durationWeeks: envelope.payload.durationWeeks, effectiveFrom: envelope.payload.effectiveFrom, source: envelope });
      await database.trainingPlanSessions.bulkPut(envelope.payload.sessions.map((session) => ({ ...session, planId: envelope.payload.planId })));
      await database.trainingPlanExercises.bulkPut(envelope.payload.sessions.flatMap((session) => session.exercises.map((exercise) => ({ ...exercise, planId: envelope.payload.planId, sessionId: session.id }))));
      await database.importHistory.add({ occurredAt: now, status: 'success', planId: envelope.payload.planId, fileName: fileName.slice(0, 150), message: 'Ficha importada' });
    });
  } catch {
    await database.importHistory.add({ occurredAt: now, status: 'failure', fileName: fileName.slice(0, 150), message: 'Falha ao importar ficha' });
    throw new Error('Não foi possível importar a ficha. Nenhuma alteração foi aplicada.');
  }
}
