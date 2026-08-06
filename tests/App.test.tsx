import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn()
  })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.4', () => {
  it('renderiza o estado vazio e oferece importação', () => {
    render(<App />);
    expect(screen.getByText('Nenhuma ficha ativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar ficha' })).toBeEnabled();
  });

  it('navega pelas cinco áreas', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    fireEvent.click(nav.getByRole('button', { name: /^Ficha$/i }));
    expect(screen.getByText('Arquivo TITAN FIT')).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Cardio$/i }));
    expect(screen.getByText('Cardio em breve')).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Evolução$/i }));
    expect(screen.getByText('Evolução em breve')).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Mais$/i }));
    expect(screen.getByText('v0.4.0')).toBeInTheDocument();
  });

  it('não possui perfil, login ou treino predefinido', () => {
    render(<App />);
    expect(screen.queryByText(/Perfil do Atleta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entrar|Login|Cadastro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Supino|Agachamento|Puxada/i)).not.toBeInTheDocument();
  });
});
