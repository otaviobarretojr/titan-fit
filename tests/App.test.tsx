import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import packageInfo from '../package.json';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT', () => {
  it('inicia com a rotina TITAN fixa ativa', () => {
    render(<App />);
    expect(screen.getByText('PPL + Ombros — Rotina Fixa')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum projeto ativo')).not.toBeInTheDocument();
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

    fireEvent.click(nav.getByRole('button', { name: /^Saúde$/i }));
    expect(screen.getByRole('heading', { name: 'Saúde' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar agora' })).toBeEnabled();
    expect(screen.getByRole('region', { name: 'Resumo do relógio' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Evolução' }));
    expect(screen.getByRole('tab', { name: 'Corpo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Treino' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Nutrição' })).not.toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Programação$/i }));
    expect(screen.getByRole('heading', { name: 'Tabela completa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ativar treino/i })).not.toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Ajustes$/i }));
    expect(screen.getByText(`v${packageInfo.version}`)).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Perfil e objetivos' })).toHaveLength(1);
    expect(screen.queryByRole('region', { name: 'Programação nutricional' })).not.toBeInTheDocument();
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