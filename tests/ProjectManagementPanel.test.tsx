import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectManagementPanel } from '../src/features/project/ProjectManagementPanel';

const loadAllProjects = vi.fn();
const loadActiveProfile = vi.fn();
const getActiveProjectId = vi.fn();
const activateProjectRecord = vi.fn();
const assignProjectToProfile = vi.fn();
const updateProjectStatus = vi.fn();
const loadPlanById = vi.fn();
const saveActivePlan = vi.fn();

vi.mock('../src/features/project/repository', () => ({
  loadAllProjects, getActiveProjectId, activateProjectRecord, assignProjectToProfile, updateProjectStatus,
}));
vi.mock('../src/features/profile/repository', () => ({ loadActiveProfile }));
vi.mock('../src/features/plan/storage', () => ({ loadPlanById, saveActivePlan }));

const project = {
  id: 'project-1', profileId: null, name: 'Hipertrofia 2026', objective: 'Ganhar massa', source: 'imported' as const,
  status: 'paused' as const, trainingPlanId: 'plan-1', createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
};
const plan = { schemaVersion: 1 as const, id: 'plan-1', name: 'Plano A', createdAt: '2026-08-09T00:00:00.000Z', workouts: [] };

describe('ProjectManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadAllProjects.mockResolvedValue([project]);
    loadActiveProfile.mockResolvedValue({ id: 'profile-1', displayName: 'Otávio', createdAt: '', updatedAt: '', onboardingCompleted: true });
    getActiveProjectId.mockResolvedValue(null);
    activateProjectRecord.mockResolvedValue({ ...project, status: 'active' });
    assignProjectToProfile.mockResolvedValue({ ...project, profileId: 'profile-1' });
    updateProjectStatus.mockResolvedValue(project);
    loadPlanById.mockResolvedValue(plan);
  });

  it('exibe projeto importado e permite associar ao perfil', async () => {
    render(<ProjectManagementPanel onPlanActivated={() => undefined} />);
    expect(await screen.findByText('Hipertrofia 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Associar a Otávio' }));
    await waitFor(() => expect(assignProjectToProfile).toHaveBeenCalledWith('project-1', 'profile-1'));
  });

  it('ativa o plano associado sem apagar o projeto anterior', async () => {
    const onPlanActivated = vi.fn();
    render(<ProjectManagementPanel onPlanActivated={onPlanActivated} />);
    await screen.findByText('Hipertrofia 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Ativar projeto' }));
    await waitFor(() => expect(activateProjectRecord).toHaveBeenCalledWith('project-1'));
    expect(loadPlanById).toHaveBeenCalledWith('plan-1');
    expect(saveActivePlan).toHaveBeenCalled();
    expect(onPlanActivated).toHaveBeenCalled();
  });
});
