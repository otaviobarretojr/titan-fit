import { useEffect, useState } from 'react';
import { loadBodyEvolution } from '../evolution/storage';
import type { BodyEvolutionEntry } from '../evolution/types';
import { loadHealthSamples } from '../health/repository';
import type { HealthSample } from '../health/types';
import { loadWorkoutHistory } from '../history/storage';
import { loadNutritionExecutions } from '../nutrition/execution';
import { loadActiveNutritionPlan } from '../nutrition/storage';
import { buildTitanReport, type TitanReport, type TitanReportPeriod } from './engine';

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
      setReport(buildTitanReport({
        workouts: loadWorkoutHistory(),
        nutritionPlan: loadActiveNutritionPlan(),
        nutritionExecutions: loadNutritionExecutions(),
        healthSamples,
        bodyEntries,
      }, period));
    }

    void load();
    const refresh = () => void load();
    window.addEventListener('titan:nutrition-changed', refresh);
    window.addEventListener('titan:health-changed', refresh);
    window.addEventListener('titan:evolution-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      active = false;
      window.removeEventListener('titan:nutrition-changed', refresh);
      window.removeEventListener('titan:health-changed', refresh);
      window.removeEventListener('titan:evolution-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [period]);

  return <div className="reports-panel-v055">
    <section className="section-header">
      <span className="eyebrow">RELATÓRIOS TITAN</span>
      <h2>Seu período em números</h2>
      <p>Resumo construído somente com registros existentes no TITAN FIT.</p>
    </section>

    <div className="report-period-switch" role="tablist" aria-label="Período do relatório">
      <button type="button" role="tab" aria-selected={period === 7} className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>7 dias</button>
      <button type="button" role="tab" aria-selected={period === 30} className={period === 30 ? 'active' : ''} onClick={() => setPeriod(30)}>30 dias</button>
    </div>

    {!report ? <section className="hero-card compact"><strong>Montando relatório</strong><p>Reunindo os dados disponíveis.</p></section> : <>
      <section className="report-coverage-card">
        <span className="eyebrow">COBERTURA DOS DADOS</span>
        <strong>{report.availableSections}/4 áreas com registros</strong>
        <p>Treino, nutrição, recuperação e evolução entram no relatório somente quando possuem dados reais no período.</p>
      </section>

      <div className="report-grid">
        <ReportCard title="Treino" primary={`${report.training.sessions} sessões`} secondary={`${formatNumber(report.training.totalVolumeKg)} kg de volume registrado`} />
        <ReportCard title="Nutrição" primary={`${report.nutrition.registeredDays} dias`} secondary={nutritionSummary(report)} />
        <ReportCard title="Recuperação" primary={report.recovery.averageSleepHours === null ? 'Sem dados' : `${report.recovery.averageSleepHours} h`} secondary={report.recovery.sleepDays ? `média em ${report.recovery.sleepDays} registros de sono` : 'Sincronize o sono para incluir recuperação'} />
        <ReportCard title="Evolução" primary={report.evolution.latestWeightKg === null ? 'Sem peso' : `${report.evolution.latestWeightKg} kg`} secondary={evolutionSummary(report)} />
      </div>
    </>}
  </div>;
}

function ReportCard({ title, primary, secondary }: { title: string; primary: string; secondary: string }) {
  return <article className="report-card"><span>{title}</span><strong>{primary}</strong><p>{secondary}</p></article>;
}

function nutritionSummary(report: TitanReport) {
  if (!report.nutrition.registeredDays) return 'Registre refeições para liberar médias e aderência.';
  const calories = report.nutrition.averageCaloriesKcal === null ? '—' : `${report.nutrition.averageCaloriesKcal} kcal`;
  const protein = report.nutrition.averageProteinG === null ? '—' : `${report.nutrition.averageProteinG} g proteína`;
  const adherence = report.nutrition.calorieAdherencePercent === null ? '' : ` · ${report.nutrition.calorieAdherencePercent}% calorias`;
  return `${calories} · ${protein}${adherence}`;
}

function evolutionSummary(report: TitanReport) {
  if (!report.evolution.records) return 'Registre peso, medidas ou bioimpedância para acompanhar tendência.';
  if (report.evolution.weightChangeKg === null) return `${report.evolution.records} registro${report.evolution.records === 1 ? '' : 's'} corporal${report.evolution.records === 1 ? '' : 'is'} no período`;
  const sign = report.evolution.weightChangeKg > 0 ? '+' : '';
  return `${sign}${report.evolution.weightChangeKg} kg no período · ${report.evolution.records} registros`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}
