import { useEffect, useState } from 'react';
import { loadBodyEvolution } from '../evolution/storage';
import type { BodyEvolutionEntry } from '../evolution/types';
import { loadHealthSamples } from '../health/repository';
import type { HealthSample } from '../health/types';
import { loadWorkoutHistory } from '../history/storage';
import { buildTitanReport, type TitanReport, type TitanReportComparison, type TitanReportPeriod } from './engine';

export function ReportsPanel() {
  const [period, setPeriod] = useState<TitanReportPeriod>(7);
  const [report, setReport] = useState<TitanReport | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      let healthSamples: HealthSample[] = [];
      let bodyEntries: BodyEvolutionEntry[] = [];
      try {
        const [samples, bodyState] = await Promise.all([loadHealthSamples(), loadBodyEvolution()]);
        healthSamples = samples;
        bodyEntries = bodyState.entries;
      } catch {
        // O relatório segue com as fontes disponíveis.
      }
      if (!active) return;
      setReport(buildTitanReport({ workouts: loadWorkoutHistory(), healthSamples, bodyEntries }, period));
    }

    void load();
    const refresh = () => void load();
    window.addEventListener('titan:health-changed', refresh);
    window.addEventListener('titan:evolution-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      active = false;
      window.removeEventListener('titan:health-changed', refresh);
      window.removeEventListener('titan:evolution-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [period]);

  return <div className="reports-panel-v055">
    <section className="section-header">
      <span className="eyebrow">RELATÓRIOS TITAN</span>
      <h2>Seu período em números</h2>
      <p>Treino, recuperação e evolução reunidos a partir dos registros existentes.</p>
    </section>

    <div className="report-period-switch" role="tablist" aria-label="Período do relatório">
      <button type="button" role="tab" aria-selected={period === 7} className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 dias</button>
      <button type="button" role="tab" aria-selected={period === 30} className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 dias</button>
    </div>

    {!report ? <section className="hero-card compact"><strong>Montando relatório</strong><p>Reunindo os dados disponíveis.</p></section> : <>
      <section className="report-coverage-card">
        <span className="eyebrow">COBERTURA DOS DADOS</span>
        <strong>{report.availableSections}/3 áreas com registros</strong>
        <p>{coverageMessage(report)}</p>
      </section>

      <section className="report-trend-summary" aria-label="Comparação com período anterior">
        <span className="eyebrow">VS. {period} DIAS ANTERIORES</span>
        <strong>{trendHeadline(report)}</strong>
        <p>{trendSummary(report)}</p>
      </section>

      <div className="report-grid report-grid-three">
        <ReportCard title="Treino" primary={`${report.training.sessions} sessões`} secondary={`${formatNumber(report.training.totalVolumeKg)} kg de volume registrado`} comparison={report.training.sessionsComparison} comparisonLabel="sessões" />
        <ReportCard title="Recuperação" primary={report.recovery.averageSleepHours === null ? 'Sem dados' : `${report.recovery.averageSleepHours} h`} secondary={report.recovery.sleepDays ? `média em ${report.recovery.sleepDays} registros de sono` : 'Sincronize o sono para incluir recuperação'} comparison={report.recovery.sleepComparison} comparisonLabel="sono médio" suffix=" h" />
        <ReportCard title="Evolução" primary={report.evolution.latestWeightKg === null ? 'Sem peso' : `${report.evolution.latestWeightKg} kg`} secondary={evolutionSummary(report)} comparison={report.evolution.weightComparison} comparisonLabel="peso" suffix=" kg" />
      </div>

      <section className="report-priority-card">
        <span className="eyebrow">LEITURA DO PERÍODO</span>
        <strong>{priorityMessage(report).title}</strong>
        <p>{priorityMessage(report).message}</p>
      </section>
    </>}
  </div>;
}

function ReportCard({ title, primary, secondary, comparison, comparisonLabel, suffix = '' }: { title: string; primary: string; secondary: string; comparison: TitanReportComparison; comparisonLabel: string; suffix?: string }) {
  return <article className="report-card"><span>{title}</span><strong>{primary}</strong><p>{secondary}</p><ComparisonLine comparison={comparison} label={comparisonLabel} suffix={suffix} /></article>;
}

function ComparisonLine({ comparison, label, suffix }: { comparison: TitanReportComparison; label: string; suffix: string }) {
  if (comparison.trend === 'unavailable' || comparison.delta === null) return <small className="report-comparison unavailable">Sem comparação anterior para {label}</small>;
  const arrow = comparison.trend === 'up' ? '↑' : comparison.trend === 'down' ? '↓' : '→';
  const sign = comparison.delta > 0 ? '+' : '';
  return <small className={`report-comparison ${comparison.trend}`}>{arrow} {sign}{comparison.delta}{suffix} vs. período anterior</small>;
}

function evolutionSummary(report: TitanReport) {
  if (!report.evolution.records) return 'Registre peso, medidas ou bioimpedância para acompanhar tendência.';
  if (report.evolution.weightChangeKg === null) return `${report.evolution.records} registro${report.evolution.records === 1 ? '' : 's'} corporal${report.evolution.records === 1 ? '' : 'is'} no período`;
  const sign = report.evolution.weightChangeKg > 0 ? '+' : '';
  return `${sign}${report.evolution.weightChangeKg} kg no período · ${report.evolution.records} registros`;
}

function coverageMessage(report: TitanReport) {
  if (!report.availableSections) return 'Ainda não há registros suficientes neste período.';
  if (!report.previousAvailableSections) return 'Já existe leitura atual, mas ainda falta base no período anterior para comparação completa.';
  return `O período anterior tinha ${report.previousAvailableSections}/3 áreas com registros. Comparações só aparecem quando os dois lados possuem dados.`;
}

function trendHeadline(report: TitanReport) {
  const comparisons = primaryComparisons(report).filter((item) => item.trend !== 'unavailable');
  if (!comparisons.length) return 'Construindo base comparativa';
  const positive = comparisons.filter((item) => item.trend === 'up').length;
  const negative = comparisons.filter((item) => item.trend === 'down').length;
  if (positive > negative) return 'Mais indicadores avançaram';
  if (negative > positive) return 'Há sinais para revisar';
  return 'Período relativamente estável';
}

function trendSummary(report: TitanReport) {
  const available = primaryComparisons(report).filter((item) => item.trend !== 'unavailable').length;
  if (!available) return 'Registre dados em dois períodos consecutivos para liberar tendências reais.';
  return `${available} de 3 indicadores principais possuem comparação válida com o período anterior.`;
}

function priorityMessage(report: TitanReport) {
  const recovery = report.recovery.sleepComparison;
  const training = report.training.sessionsComparison;

  if (recovery.trend === 'down' && (recovery.delta ?? 0) <= -0.5) return { title: 'Priorizar recuperação', message: 'A média de sono caiu de forma relevante. Considere recuperação antes de aumentar esforço ou volume de treino.' };
  if (training.trend === 'down') return { title: 'Reforçar consistência de treino', message: 'O número de sessões caiu em relação ao período anterior. O primeiro objetivo é recuperar regularidade antes de buscar mais volume.' };
  if (report.availableSections < 2) return { title: 'Completar os registros', message: 'O relatório ainda tem poucas áreas cobertas. Mais dados de sono e evolução tornam as tendências mais confiáveis.' };
  return { title: 'Consolidar o que está funcionando', message: 'Não há queda dominante entre os indicadores comparáveis. Mantenha consistência e acompanhe o próximo período antes de fazer mudanças grandes.' };
}

function primaryComparisons(report: TitanReport) {
  return [report.training.sessionsComparison, report.recovery.sleepComparison, report.evolution.weightComparison];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}
