import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.9', () => {
  it('renderiza o estado vazio e oferece importação', () => {
    render(<App />);
    expect(screen.getByText('Nenhuma ficha ativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar ficha' })).toBeEnabled();
    expect(screen.getByText('SEU TREINO COMEÇA AQUI')).toBeInTheDocument();
  });

  it('mantém a navegação focada em treino e expõe backup local', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Ficha$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Progresso$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Cardio$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Coach$/i })).not.toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Mais$/i }));
    expect(screen.getByText('v0.9.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
  });

  it('oferece acesso direto à ficha e ao progresso', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Organize seus treinos/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Cargas e histórico/i })).toBeEnabled();
  });
});
