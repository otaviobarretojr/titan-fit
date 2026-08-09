import { useEffect, useState } from 'react';
import { loadPlanById, saveActivePlan } from '../plan/storage';
import type { TitanPlan } from '../plan/types';
import { loadActiveProfile } from '../profile/repository';
import type { TitanProfile } from '../profile/types';
import { activateProjectRecord, assignProjectToProfile, getActiveProjectId, loadAllProjects, updateProjectStatus } from './repository';
import type { TitanProjectRecord, TitanProjectStatus } from './types';

const STATUS_LABEL: Record<TitanProjectStatus, string> = {
  draft: 'Rascunho', active: 'Ativo', paused: 'Pausado', completed: 'Concluído', archived: 'Arquivado',
};

type Props = { onPlanActivated: (plan: TitanPlan) => void };

export function ProjectManagementPanel({ onPlanActivated }: Props) {
  const [projects, setProjects] = useState<TitanProjectRecord[]>([]);
  const [profile, setProfile] = useState<TitanProfile | null>(null);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      const [items, currentProfile, activeId] = await Promise.all([loadAllProjects(), loadActiveProfile(), getActiveProjectId()]);
      setProjects(items);
      setProfile(currentProfile);
      setActiveProjectIdState(activeId);
      setMessage('');
    } catch (error) {
      console.warn('Não foi possível carregar a gestão de projetos.', error);
      setProjects([]);
      setProfile(null);
      setActiveProjectIdState(null);
      setMessage('A gestão de projetos está indisponível neste ambiente. Seus dados não foram alterados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function activate(project: TitanProjectRecord) {
    try {
      if (!project.trainingPlanId) return setMessage('Este projeto ainda não possui plano de musculação associado.');
      const plan = await loadPlanById(project.trainingPlanId);
      if (!plan) return setMessage('O plano deste projeto não foi encontrado no aparelho.');
      await activateProjectRecord(project.id);
      const linkedPlan: TitanPlan = { ...plan, profileId: project.profileId ?? plan.profileId, projectId: project.id };
      saveActivePlan(linkedPlan);
      onPlanActivated(linkedPlan);
      setMessage(`${project.name} agora é o projeto ativo.`);
      await refresh();
    } catch (error) {
      console.warn('Não foi possível ativar o projeto.', error);
      setMessage('Não foi possível ativar este projeto agora.');
    }
  }

  async function changeStatus(project: TitanProjectRecord, status: TitanProjectStatus) {
    try {
      if (status === 'active') return activate(project);
      await updateProjectStatus(project.id, status);
      setMessage(`${project.name}: ${STATUS_LABEL[status].toLowerCase()}.`);
      await refresh();
    } catch (error) {
      console.warn('Não foi possível atualizar o status do projeto.', error);
      setMessage('Não foi possível atualizar este projeto agora.');
    }
  }

  async function assign(project: TitanProjectRecord) {
    try {
      if (!profile) return setMessage('Crie um perfil antes de associar este projeto.');
      await assignProjectToProfile(project.id, profile.id);
      setMessage(`${project.name} foi associado a ${profile.displayName}.`);
      await refresh();
    } catch (error) {
      console.warn('Não foi possível associar o projeto ao perfil.', error);
      setMessage('Não foi possível associar este projeto agora.');
    }
  }

  return <section className="settings-card project-manager" aria-label="Meus projetos">
    <div className="project-manager-heading"><div><span className="info-label">MEUS PROJETOS</span><strong>Projetos e ciclos</strong><small>Troque de objetivo sem apagar seu histórico anterior.</small></div><span className="project-count">{projects.length}</span></div>
    {loading && <p className="project-manager-empty">Carregando projetos…</p>}
    {!loading && projects.length === 0 && !message && <p className="project-manager-empty">Seu primeiro projeto aparecerá aqui após importar ou gerar um plano.</p>}
    <div className="project-manager-list">{projects.map((project) => {
      const isActive = project.id === activeProjectId;
      const unassigned = !project.profileId;
      return <article key={project.id} className={`project-manager-item ${isActive ? 'active' : ''}`}>
        <div className="project-manager-top"><div><strong>{project.name}</strong><small>{project.objective}</small></div><span className={`project-status status-${project.status}`}>{STATUS_LABEL[project.status]}</span></div>
        <div className="project-manager-meta"><span>{project.source === 'titan-generated' ? 'Gerado pelo TITAN' : project.source === 'manual' ? 'Manual' : 'Importado'}</span><span>{unassigned ? 'Sem perfil associado' : profile?.id === project.profileId ? profile.displayName : 'Outro perfil'}</span></div>
        <div className="project-manager-actions">
          {!isActive && project.status !== 'archived' && project.status !== 'completed' && <button type="button" className="secondary-action" onClick={() => void activate(project)}>Ativar projeto</button>}
          {isActive && <button type="button" className="secondary-action" onClick={() => void changeStatus(project, 'paused')}>Pausar</button>}
          {project.status === 'paused' && <button type="button" className="text-action" onClick={() => void changeStatus(project, 'completed')}>Concluir</button>}
          {project.status !== 'active' && project.status !== 'archived' && <button type="button" className="text-action" onClick={() => void changeStatus(project, 'archived')}>Arquivar</button>}
          {unassigned && profile && <button type="button" className="text-action" onClick={() => void assign(project)}>Associar a {profile.displayName}</button>}
        </div>
      </article>;
    })}</div>
    {message && <p className="project-manager-message" role="status">{message}</p>}
  </section>;
}
