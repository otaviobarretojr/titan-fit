import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.37.0', () => {
  it('renderiza o estado vazio e oferece importação de projeto', () => {
    render(<App />);
    expect(screen.getByText('Nenhum projeto ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar projeto' })).toBeEnabled();
    expect(screen.getByText('SEU PROJETO COMEÇA AQUI')).toBeInTheDocument();
  });

  it('usa Programação, Cardio e concentra gestão em Configurações', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Programação$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Histórico$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Projeto$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Semana$/i })).not.toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Cardio$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Progresso$/i })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Cardio$/i }));
    expect(screen.getByRole('heading', { name: 'Condicionamento + 5 km' })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Programação$/i }));
    expect(screen.getByRole('heading', { name: 'Nenhum projeto ativo' })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Configurações$/i }));
    expect(screen.getByText('v0.37.0')).toBeInTheDocument();
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
