import { beforeEach, describe, expect, it } from 'vitest';
import { TESTER_CHECKLIST, buildTesterReport, clearTesterKit, loadTesterKit, saveTesterKit } from '../src/features/beta/testerKit';

describe('Kit do Testador Beta', () => {
  beforeEach(() => localStorage.clear());

  it('mantém um roteiro com as funções essenciais do beta', () => {
    expect(TESTER_CHECKLIST).toHaveLength(8);
    expect(TESTER_CHECKLIST.map((item) => item.id)).toEqual(['install','profile','plan','workout','cardio','progress','backup','feedback']);
  });

  it('salva e recupera o progresso local do testador', () => {
    const state = { testerName: 'Teste', startedAt: '2026-08-08T20:00:00.000Z', completedItems: ['install' as const, 'profile' as const] };
    saveTesterKit(state);
    expect(loadTesterKit()).toEqual(state);
    clearTesterKit();
    expect(loadTesterKit()).toBeNull();
  });

  it('exporta relatório identificável e sem misturar dados de treino', () => {
    const report = buildTesterReport({ testerName: 'Teste', startedAt: '2026-08-08T20:00:00.000Z', completedItems: ['install'] }, '0.37.0');
    expect(report.format).toBe('titan-fit-beta-report');
    expect(report.appVersion).toBe('0.37.0');
    expect(report.checklist.find((item) => item.id === 'install')?.completed).toBe(true);
    expect(report).not.toHaveProperty('workoutHistory');
  });
});
