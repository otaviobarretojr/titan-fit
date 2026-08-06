import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn()
  })
}));

describe('TITAN FIT shell', () => {
  it('renderiza o estado vazio da tela Hoje', () => {
    render(<App />);
    expect(screen.getByText('Nenhuma ficha ativa')).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('navega pelas cinco áreas sem dados fictícios', () => {
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: /Navegação principal/i });
    const nav = within(navigation);

    fireEvent.click(nav.getByRole('button', { name: /^Ficha$/i }));
    expect(screen.getByText('Nenhuma ficha importada')).toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Cardio$/i }));
    expect(screen.getByText('Cardio em breve')).toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Evolução$/i }));
    expect(screen.getByText('Evolução em breve')).toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Mais$/i }));
    expect(screen.getByText('Sobre o TITAN FIT')).toBeInTheDocument();
  });

  it('não possui perfil, login ou treino predefinido', () => {
    render(<App />);
    expect(screen.queryByText(/Perfil do Atleta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entrar|Login|Cadastro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Supino|Agachamento|Puxada/i)).not.toBeInTheDocument();
  });
});
