import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import packageInfo from '../package.json';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT', () => {
  it('renderiza o estado vazio e oferece inserção de projeto', () => {
    render(<App />);
    expect(screen.getByText('Nenhum projeto ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inserir projeto' })).toBeEnabled();
    expect(screen.getByText('SEU PROJETO COMEÇA AQUI')).toBeInTheDocument();
  });

  it('usa a navegação principal consolidada e integra evolução em Saúde', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Programação$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Saúde$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Ajustes$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Progresso$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Cardio$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Histórico$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Projeto$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Semana$/i })).not.toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Saúde$/i }));
    expect(screen.getByRole('heading', { name: 'Saúde' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar agora' })).toBeEnabled();
    expect(screen.getByRole('region', { name: 'Resumo do relógio' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Evolução' }));
    expect(screen.getByRole('tab', { name: 'Corpo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Treino' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Nutrição' }));
    expect(screen.getByText('Sem plano nutricional ativo')).toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Programação$/i }));
    expect(screen.getByRole('heading', { name: 'Nenhum projeto de treino ativo' })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Ajustes$/i }));
    expect(screen.getByText(`v${packageInfo.version}`)).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Perfil e objetivos' })).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Programação nutricional' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Baixar modelo de dieta TITAN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ativar demonstração completa' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Resetar todos os dados' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
  });

  it('exibe saída específica quando o modo demonstração está ativo', () => {
    localStorage.setItem('titan-fit:demo-mode', 'true');
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    fireEvent.click(nav.getByRole('button', { name: /^Ajustes$/i }));
    expect(screen.getByRole('button', { name: 'Remover dados da demonstração' })).toBeEnabled();
    expect(screen.getByText('Demonstração ativa')).toBeInTheDocument();
  });
});
