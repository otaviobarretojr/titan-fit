import { getAllRecords, getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanPlan } from '../plan/types';
import type { TitanProjectRecord, TitanProjectStatus } from './types';

const ACTIVE_PROJECT_POINTER = 'active-project-id';

export async function loadProject(projectId: string): Promise<TitanProjectRecord | null> {
  return getRecord<TitanProjectRecord>(STORE_NAMES.projects, projectId);
}

export async function loadAllProjects(): Promise<TitanProjectRecord[]> {
  const records = await getAllRecords<TitanProjectRecord>(STORE_NAMES.projects);
  return records.map((record) => record.value).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadProjectsForProfile(profileId: string): Promise<TitanProjectRecord[]> {
  const projects = await loadAllProjects();
  return projects.filter((project) => project.profileId === profileId);
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

export async function updateProjectStatus(projectId: string, status: TitanProjectStatus): Promise<TitanProjectRecord | null> {
  const project = await loadProject(projectId);
  if (!project) return null;
  const now = new Date().toISOString();
  const updated: TitanProjectRecord = {
    ...project,
    status,
    endedAt: status === 'completed' || status === 'archived' ? project.endedAt ?? now : undefined,
    updatedAt: now,
  };
  await putRecord(STORE_NAMES.projects, updated.id, updated);
  return updated;
}

export async function assignProjectToProfile(projectId: string, profileId: string): Promise<TitanProjectRecord | null> {
  const project = await loadProject(projectId);
  if (!project) return null;
  const updated: TitanProjectRecord = { ...project, profileId, updatedAt: new Date().toISOString() };
  await putRecord(STORE_NAMES.projects, updated.id, updated);
  return updated;
}

export async function activateProjectRecord(projectId: string): Promise<TitanProjectRecord | null> {
  const projects = await loadAllProjects();
  const target = projects.find((project) => project.id === projectId);
  if (!target) return null;
  const now = new Date().toISOString();
  await Promise.all(projects.map(async (project) => {
    if (project.id === projectId) {
      await putRecord(STORE_NAMES.projects, project.id, { ...project, status: 'active', endedAt: undefined, updatedAt: now });
    } else if (project.status === 'active') {
      await putRecord(STORE_NAMES.projects, project.id, { ...project, status: 'paused', updatedAt: now });
    }
  }));
  await setActiveProjectId(projectId);
  return { ...target, status: 'active', endedAt: undefined, updatedAt: now };
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

export async function linkPlanToProject(plan: TitanPlan, profileId: string | null): Promise<TitanPlan> {
  const project = await ensureProjectForPlan(plan, profileId);
  return {
    ...plan,
    profileId: profileId ?? plan.profileId,
    projectId: project.id,
  };
}

export { ACTIVE_PROJECT_POINTER };
