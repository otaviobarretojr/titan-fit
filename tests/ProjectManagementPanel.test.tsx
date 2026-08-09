import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectManagementPanel } from '../src/features/project/ProjectManagementPanel';

const mocks = vi.hoisted(() => ({
  loadAllProjects: vi.fn(),
  loadActiveProfile: vi.fn(),
  loadActiveAssessment: vi.fn(),
  saveActiveProfile: vi.fn(),
  saveActiveAssessment: vi.fn(),
  updateProfile: vi.fn(),
  getActiveProjectId: vi.fn(),
  activateProjectRecord: vi.fn(),
  assignProjectToProfile: vi.fn(),
  updateProjectStatus: vi.fn(),
  loadPlanById: vi.fn(),
  saveActivePlan: vi.fn(),
}));

vi.mock('../src/features/project/repository', () => ({
  loadAllProjects: mocks.loadAllProjects,
  getActiveProjectId: mocks.getActiveProjectId,
  activateProjectRecord: mocks.activateProjectRecord,
  assignProjectToProfile: mocks.assignProjectToProfile,
  updateProjectStatus: mocks.updateProjectStatus,
}));
vi.mock('../src/features/profile/repository', () => ({
  loadActiveProfile: mocks.loadActiveProfile,
  loadActiveAssessment: mocks.loadActiveAssessment,
  saveActiveProfile: mocks.saveActiveProfile,
  saveActiveAssessment: mocks.saveActiveAssessment,
  updateProfile: mocks.updateProfile,
}));
vi.mock('../src/features/plan/storage', () => ({ loadPlanById: mocks.loadPlanById, saveActivePlan: mocks.saveActivePlan }));

const profile = { id: 'profile-1', displayName: 'Otávio', heightCm: 176, currentWeightKg: 92, primaryGoal: 'hypertrophy' as const, createdAt: '', updatedAt: '', onboardingCompleted: true };
const assessment = { id: 'assessment-1', profileId: 'profile-1', experience: 'intermediate' as const, trainingDaysPerWeek: 5, preferredSessionMinutes: 70, equipmentAccess: 'full-gym' as const, cardioGoal: '5k' as const, cardioDaysPerWeek: 2, currentCardioLevel: 'moderate' as const, createdAt: '', updatedAt: '' };
const project = {
  id: 'project-1', profileId: null, name: 'Hipertrofia 2026', objective: 'Ganhar massa', source: 'imported' as const,
  status: 'paused' as const, trainingPlanId: 'plan-1', createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
};
const plan = { schemaVersion: 1 as const, id: 'plan-1', name: 'Plano A', createdAt: '2026-08-09T00:00:00.000Z', workouts: [] };

describe('ProjectManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadAllProjects.mockResolvedValue([project]);
    mocks.loadActiveProfile.mockResolvedValue(profile);
    mocks.loadActiveAssessment.mockResolvedValue(assessment);
    mocks.saveActiveProfile.mockResolvedValue(undefined);
    mocks.saveActiveAssessment.mockResolvedValue(undefined);
    mocks.updateProfile.mockImplementation((current, patch) => ({ ...current, ...patch }));
    mocks.getActiveProjectId.mockResolvedValue(null);
    mocks.activateProjectRecord.mockResolvedValue({ ...project, status: 'active' });
    mocks.assignProjectToProfile.mockResolvedValue({ ...project, profileId: 'profile-1' });
    mocks.updateProjectStatus.mockResolvedValue(project);
    mocks.loadPlanById.mockResolvedValue(plan);
  });

  it('exibe projeto importado e permite associar ao perfil', async () => {
    render(<ProjectManagementPanel onPlanActivated={() => undefined} />);
    expect(await screen.findByText('Hipertrofia 2026')).toBeInTheDocument();
    expect(screen.getByText('Otávio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Associar a Otávio' }));
    await waitFor(() => expect(mocks.assignProjectToProfile).toHaveBeenCalledWith('project-1', 'profile-1'));
  });

  it('ativa o plano associado sem apagar o projeto anterior', async () => {
    const onPlanActivated = vi.fn();
    render(<ProjectManagementPanel onPlanActivated={onPlanActivated} />);
    await screen.findByText('Hipertrofia 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Ativar projeto' }));
    await waitFor(() => expect(mocks.activateProjectRecord).toHaveBeenCalledWith('project-1'));
    expect(mocks.loadPlanById).toHaveBeenCalledWith('plan-1');
    expect(mocks.saveActivePlan).toHaveBeenCalled();
    expect(onPlanActivated).toHaveBeenCalled();
  });
});