import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('TITAN FIT shell', () => {
  it('renders the empty Today state without profile or workout data', () => {
    render(<App />);
    expect(screen.getByText('Nenhuma ficha ativa')).toBeInTheDocument();
    expect(screen.queryByText(/perfil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supino|agachamento|puxada/i)).not.toBeInTheDocument();
  });

  it('navigates through the five main areas', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /ficha/i }));
    expect(screen.getByText('Nenhuma ficha importada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cardio/i }));
    expect(screen.getByText('Cardio em breve')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /evolução/i }));
    expect(screen.getByText('Evolução em breve')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /mais/i }));
    expect(screen.getByText('TITAN FIT v0.1.0')).toBeInTheDocument();
  });
});
