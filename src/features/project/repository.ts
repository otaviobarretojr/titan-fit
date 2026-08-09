import { getAllRecords, getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanPlan } from '../plan/types';
import type { TitanProjectRecord } from './types';

const ACTIVE_PROJECT_POINTER = 'active-project-id';

export async function loadProject(projectId: string): Promise<TitanProjectRecord | null> {
  return getRecord<TitanProjectRecord>(STORE_NAMES.projects, projectId);
}

export async function loadProjectsForProfile(profileId: string): Promise<TitanProjectRecord[]> {
  const records = await getAllRecords<TitanProjectRecord>(STORE_NAMES.projects);
  return records.map((record) => record.value).filter((project) => project.profileId === profileId);
}

export async function getActiveProjectId(): Promise<string | null> {
  return getRecord<string>(STORE_NAMES.preferences, ACTIVE_PROJECT_POINTER);
}

export async function setActiveProjectId(projectId: string): Promise<void> {
  await putRecord(STORE_NAMES.preferences, ACTIVE_PROJECT_POINTER, projectId);
}

export async function loadActiveProject(): Promise<TitanProjectRecord | null> {
  const projectId = await getActiveProjectId();
  return projectId ? loadProject(projectId) : null;
}

export async function createProjectForPlan(plan: TitanPlan, profileId: string | null, source = plan.project?.source ?? 'imported'): Promise<TitanProjectRecord> {
  const now = new Date().toISOString();
  const project: TitanProjectRecord = {
    id: crypto.randomUUID(),
    profileId,
    name: plan.project?.name ?? plan.name,
    objective: plan.project?.objective ?? plan.description ?? 'Projeto TITAN FIT',
    source,
    status: 'active',
    trainingPlanId: plan.id,
    startedAt: plan.project?.startDate,
    createdAt: now,
    updatedAt: now,
  };
  await putRecord(STORE_NAMES.projects, project.id, project);
  await setActiveProjectId(project.id);
  return project;
}

export async function ensureProjectForPlan(plan: TitanPlan, profileId: string | null): Promise<TitanProjectRecord> {
  if (plan.projectId) {
    const existing = await loadProject(plan.projectId);
    if (existing) {
      await setActiveProjectId(existing.id);
      return existing;
    }
  }
  return createProjectForPlan(plan, profileId, plan.project?.source ?? 'imported');
}
