import { describe, expect, it } from 'vitest';
import { buildBetaFeedbackEntry } from '../src/features/beta/feedback';

describe('feedback beta', () => {
  it('normaliza mensagem, tela e versão do aplicativo', () => {
    const entry = buildBetaFeedbackEntry('bug', '  botão não respondeu  ', '0.37.0', '  Treino  ');
    expect(entry.kind).toBe('bug');
    expect(entry.message).toBe('botão não respondeu');
    expect(entry.screen).toBe('Treino');
    expect(entry.appVersion).toBe('0.37.0');
    expect(entry.id.length).toBeGreaterThan(5);
    expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
  });

  it('não grava tela vazia', () => {
    const entry = buildBetaFeedbackEntry('idea', 'melhorar resumo', '0.37.0', '   ');
    expect(entry.screen).toBeUndefined();
  });
});
