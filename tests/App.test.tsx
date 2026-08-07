import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.23.1', () => {
  it('renderiza o estado vazio e oferece importação de projeto', () => {
    render(<App />);
    expect(screen.getByText('Nenhum projeto ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar projeto' })).toBeEnabled();
    expect(screen.getByText('SEU PROJETO COMEÇA AQUI')).toBeInTheDocument();
  });

  it('usa Histórico no lugar de Projeto e concentra gestão em Configurações', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Histórico$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Projeto$/i })).not.toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Semana$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Progresso$/i })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Histórico$/i }));
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Configurações$/i }));
    expect(screen.getByText('v0.23.1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ativar demonstração completa' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Resetar TITAN FIT' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
  });

  it('exibe saída específica quando o modo demonstração está ativo', () => {
    localStorage.setItem('titan-fit:demo-mode', 'true');
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    fireEvent.click(nav.getByRole('button', { name: /^Configurações$/i }));
    expect(screen.getByRole('button', { name: 'Remover dados da demonstração' })).toBeEnabled();
    expect(screen.getByText('Demonstração ativa')).toBeInTheDocument();
  });
});
