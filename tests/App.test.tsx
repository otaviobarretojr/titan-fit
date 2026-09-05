import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import packageInfo from '../package.json';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT workout-first', () => {
  it('abre direto na experiência essencial de treino', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TITAN' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Navegação principal/i })).toBeInTheDocument();
    expect(screen.queryByText(/Score TITAN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nutrição de hoje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Coach TITAN/i)).not.toBeInTheDocument();
  });

  it('mantém somente Hoje, Treinos e Histórico na navegação principal', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Treinos$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Histórico$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /Saúde|Programação|Cardio|Progresso|Ajustes/i })).not.toBeInTheDocument();
  });

  it('mantém ajustes fora da navegação principal e exibe manutenção essencial', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir ajustes' }));
    expect(screen.getByRole('heading', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.getByText(`v${packageInfo.version}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Resetar aplicativo' })).toBeEnabled();
    expect(screen.queryByText(/Modo Demonstração/i)).not.toBeInTheDocument();
  });
});
