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

  it('usa Samsung Health na navegação e mantém cardio fora da barra principal', () => {
    render(<App />);
    const nav = within(screen.getByRole('navigation', { name: /Navegação principal/i }));
    expect(nav.getByRole('button', { name: /^Hoje$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Programação$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Samsung Health$/i })).toBeInTheDocument();
    expect(nav.getByRole('button', { name: /^Progresso$/i })).toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Cardio$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Histórico$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Projeto$/i })).not.toBeInTheDocument();
    expect(nav.queryByRole('button', { name: /^Semana$/i })).not.toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Samsung Health$/i }));
    expect(screen.getByRole('heading', { name: 'Samsung Health' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar agora' })).toBeEnabled();
    expect(screen.getByRole('region', { name: 'Dados do relógio' })).toBeInTheDocument();

    fireEvent.click(nav.getByRole('button', { name: /^Programação$/i }));
    expect(screen.getByRole('heading', { name: 'Nenhum projeto ativo' })).toBeInTheDocument();
    fireEvent.click(nav.getByRole('button', { name: /^Configurações$/i }));
    expect(screen.getByText(`v${packageInfo.version}`)).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Perfil e objetivos' })).toHaveLength(1);
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
