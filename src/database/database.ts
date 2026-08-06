import Dexie, { type EntityTable } from 'dexie';
import type { PlanExercise, PlanSession, TrainingPlanRecord } from '../types/training';

export interface ImportHistory { id?: number; occurredAt: string; status: 'success' | 'failure'; planId?: string; fileName: string; message: string }
export interface BackupRecord { id?: number; createdAt: string; version: 1; data: string }
export interface GenericRecord { id?: number | string; [key: string]: unknown }

export class TitanFitDatabase extends Dexie {
  trainingPlans!: EntityTable<TrainingPlanRecord, 'id'>;
  trainingPlanSessions!: EntityTable<PlanSession & { planId: string }, 'id'>;
  trainingPlanExercises!: EntityTable<PlanExercise & { planId: string; sessionId: string }, 'id'>;
  exerciseDefinitions!: EntityTable<GenericRecord, 'id'>; trainingSessions!: EntityTable<GenericRecord, 'id'>; setExecutions!: EntityTable<GenericRecord, 'id'>;
  cardioPlans!: EntityTable<GenericRecord, 'id'>; cardioExecutions!: EntityTable<GenericRecord, 'id'>; importHistory!: EntityTable<ImportHistory, 'id'>;
  appPreferences!: EntityTable<GenericRecord, 'id'>; backups!: EntityTable<BackupRecord, 'id'>;
  constructor(name = 'TitanFitDatabase') {
    super(name);
    this.version(1).stores({
      trainingPlans: 'id,status,importedAt', trainingPlanSessions: 'id,planId,sequence', trainingPlanExercises: 'id,planId,sessionId,exerciseId,sequence',
      exerciseDefinitions: 'id', trainingSessions: 'id,planId,startedAt', setExecutions: 'id,trainingSessionId', cardioPlans: 'id', cardioExecutions: 'id,performedAt',
      importHistory: '++id,occurredAt,status,planId', appPreferences: 'id', backups: '++id,createdAt'
    });
  }
}
export const db = new TitanFitDatabase();
