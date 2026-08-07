import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.18', () => {
  it('renderiza o estado vazio e oferece importação de projeto', () => {
    render(<App />);
    expect(screen.getByText('Nenhum projeto ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar projeto' })).toBeEnabled();
    expect(screen.getByText('SEU PROJETO COMEÇA AQUI')).toBeInTheDocument();
  });

  it('mantém a navegação focada no treino e expõe backup local', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Projeto$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Progresso$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Cardio$/i })).not.toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Mais$/i }));
    expect(screen.getByText('v0.18.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
  });
});
