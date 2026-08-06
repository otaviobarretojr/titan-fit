import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { App } from '../src/app/App';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() })
}));

beforeEach(() => localStorage.clear());

describe('TITAN FIT v0.8', () => {
  it('renderiza o estado vazio e oferece importação', () => {
    render(<App />);
    expect(screen.getByText('Nenhuma ficha ativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar ficha' })).toBeEnabled();
  });

  it('mantém as seis áreas e expõe backup local', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    fireEvent.click(nav.getByRole('button', { name: /^Coach$/i }));
    expect(screen.getByText('Leitura dos seus dados')).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Mais$/i }));
    expect(screen.getByText('v0.8.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeEnabled();
  });

  it('não inventa pilares sem dados registrados', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Coach TITAN' }));
    expect(screen.getByText(/não considera sono, nutrição, hidratação ou recuperação/i)).toBeInTheDocument();
  });
});
