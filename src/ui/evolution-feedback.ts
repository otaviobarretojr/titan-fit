import { loadHealthSamples } from '../features/health/repository';
import type { HealthSample } from '../features/health/types';

type TrendTone = 'favorable' | 'unfavorable' | 'neutral';
type Period = 7 | 30 | 90 | 'all';
type DailyBodyFat = { date: string; recordedAt: string; value: number; source?: string };

const LOWER_IS_BETTER = new Set(['gordura', 'cintura']);
const HIGHER_IS_BETTER = new Set(['massa muscular', 'massa magra']);
let activePeriod: Period = 30;
let bioimpedanceRenderQueued = false;

function classify(label: string, diff: number): TrendTone {
  const normalized = label.trim().toLocaleLowerCase('pt-BR');
  if (Math.abs(diff) < 0.05) return 'neutral';
  if (LOWER_IS_BETTER.has(normalized)) return diff < 0 ? 'favorable' : 'unfavorable';
  if (HIGHER_IS_BETTER.has(normalized)) return diff > 0 ? 'favorable' : 'unfavorable';
  return 'neutral';
}

function parseDiff(value: string): number | null {
  const match = value.replace(',', '.').match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function decorateComparisonCards() {
  document.querySelectorAll<HTMLElement>('.comparison-item').forEach((card) => {
    const label = card.querySelector('span')?.textContent ?? '';
    const strong = card.querySelector('strong');
    const diff = parseDiff(strong?.textContent ?? '');
    if (diff === null) return;
    const tone = classify(label, diff);
    card.dataset.trendTone = tone;
    card.dataset.trendDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  });
}

function dailyBodyFat(samples: HealthSample[]): DailyBodyFat[] {
  const byDay = new Map<string, DailyBodyFat>();
  for (const sample of samples) {
    if (sample.type !== 'body-composition' || !Number.isFinite(sample.value)) continue;
    const date = sample.startedAt.slice(0, 10);
    const current = byDay.get(date);
    if (!current || sample.startedAt > current.recordedAt) byDay.set(date, { date, recordedAt: sample.startedAt, value: sample.value, source: sample.source });
  }
  return [...byDay.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

function filterPeriod(values: DailyBodyFat[], period: Period) {
  if (period === 'all') return values;
  const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;
  return values.filter((item) => new Date(item.recordedAt).getTime() >= cutoff);
}

function sourceLabel(source?: string) {
  if (!source) return 'Health Connect';
  if (source.includes('shealth')) return 'Samsung Health';
  return source.includes('healthconnect') ? 'Health Connect' : 'Relógio';
}

function periodLabel(period: Period) { return period === 'all' ? 'Tudo' : period === 90 ? '3 meses' : `${period} dias`; }
function formatDay(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`)); }

function buildPolyline(values: DailyBodyFat[]) {
  if (!values.length) return { points: '', dots: '', min: 0, max: 0 };
  const numeric = values.map((item) => item.value);
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const spread = Math.max(max - min, .2);
  const padding = Math.max(spread * .22, .15);
  const floor = min - padding;
  const ceiling = max + padding;
  const range = ceiling - floor;
  const points = values.map((item, index) => ({ ...item, x: 7 + (index / Math.max(values.length - 1, 1)) * 86, y: 88 - ((item.value - floor) / range) * 72 }));
  return { points: points.map((point) => `${point.x},${point.y}`).join(' '), dots: points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="2.4"><title>${formatDay(point.date)} · ${point.value.toFixed(1)}%</title></circle>`).join(''), min, max };
}

function renderBioimpedanceSection(values: DailyBodyFat[]) {
  const bodyPage = document.querySelector<HTMLElement>('.body-evolution');
  if (!bodyPage) { document.getElementById('titan-health-bioimpedance-progress')?.remove(); return; }

  const filtered = filterPeriod(values, activePeriod);
  let section = document.getElementById('titan-health-bioimpedance-progress');
  if (!section) {
    section = document.createElement('section');
    section.id = 'titan-health-bioimpedance-progress';
    section.className = 'health-bio-progress';
    const hero = bodyPage.querySelector('.evolution-hero');
    if (hero) hero.insertAdjacentElement('afterend', section); else bodyPage.prepend(section);
  }

  if (!values.length) {
    section.innerHTML = `<div class="health-bio-heading"><div><span class="eyebrow">BIOIMPEDÂNCIA AUTOMÁTICA</span><h3>Composição corporal</h3></div></div><div class="health-bio-empty"><strong>Sem medições sincronizadas ainda</strong><p>Meça pelo Galaxy Watch e sincronize a aba Saúde. O TITAN registra a evolução automaticamente, sem digitação manual.</p></div>`;
    return;
  }

  const visible = filtered.length ? filtered : values.slice(-1);
  const latest = visible[visible.length - 1];
  const previous = visible.length > 1 ? visible[visible.length - 2] : null;
  const first = visible[0];
  const variation = previous ? latest.value - previous.value : null;
  const periodVariation = visible.length > 1 ? latest.value - first.value : null;
  const trend = periodVariation === null || Math.abs(periodVariation) < .1 ? 'Estável' : periodVariation < 0 ? 'Em queda' : 'Em alta';
  const graph = buildPolyline(visible);
  const periodButtons: Period[] = [7, 30, 90, 'all'];

  section.innerHTML = `
    <div class="health-bio-heading"><div><span class="eyebrow">BIOIMPEDÂNCIA AUTOMÁTICA</span><h3>Composição corporal</h3><p>Sincronizada pelo relógio</p></div><small>${values.length} ${values.length === 1 ? 'dia medido' : 'dias medidos'}</small></div>
    <div class="health-bio-periods" role="group" aria-label="Período do gráfico">${periodButtons.map((period) => `<button type="button" data-bio-period="${period}" class="${activePeriod === period ? 'active' : ''}">${periodLabel(period)}</button>`).join('')}</div>
    <div class="health-bio-metrics">
      <div><span>Gordura corporal</span><strong>${latest.value.toFixed(1)}%</strong><small>${formatDay(latest.date)} · ${sourceLabel(latest.source)}</small></div>
      <div><span>Vs. anterior</span><strong>${variation === null ? '—' : `${variation > 0 ? '+' : ''}${variation.toFixed(1)} p.p.`}</strong><small>${previous ? `${formatDay(previous.date)} → ${formatDay(latest.date)}` : 'Aguardando outra medição'}</small></div>
      <div><span>Tendência</span><strong>${trend}</strong><small>${periodVariation === null ? 'Base inicial' : `${periodVariation > 0 ? '+' : ''}${periodVariation.toFixed(1)} p.p. no período`}</small></div>
    </div>
    <article class="health-bio-chart-card"><header><div><span>Evolução diária</span><strong>${latest.value.toFixed(1)}%</strong></div><small>${periodLabel(activePeriod)}</small></header>
      ${visible.length > 1 ? `<div class="health-bio-chart-wrap"><div class="health-bio-y"><span>${graph.max.toFixed(1)}%</span><span>${((graph.max + graph.min) / 2).toFixed(1)}%</span><span>${graph.min.toFixed(1)}%</span></div><div class="health-bio-plot"><i></i><i></i><i></i><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Evolução diária da gordura corporal"><polyline points="${graph.points}" fill="none" vector-effect="non-scaling-stroke"></polyline>${graph.dots}</svg><div class="health-bio-x"><span>${formatDay(visible[0].date)}</span><span>${formatDay(visible[Math.floor((visible.length - 1) / 2)].date)}</span><span>${formatDay(latest.date)}</span></div></div></div>` : `<div class="health-bio-empty compact"><p>Uma segunda medição libera a linha de tendência.</p></div>`}
    </article>
    <p class="health-bio-note">A bioimpedância do relógio é usada como tendência. Hidratação, alimentação e horário podem alterar uma medição isolada.</p>`;

  section.querySelectorAll<HTMLButtonElement>('[data-bio-period]').forEach((button) => button.addEventListener('click', () => { const raw = button.dataset.bioPeriod; activePeriod = raw === 'all' ? 'all' : Number(raw) as 7 | 30 | 90; renderBioimpedanceSection(values); }));
}

async function refreshBioimpedanceProgress() {
  if (!document.querySelector('.body-evolution')) return;
  try { renderBioimpedanceSection(dailyBodyFat(await loadHealthSamples())); } catch { renderBioimpedanceSection([]); }
}

function queueBioimpedanceRender() {
  if (bioimpedanceRenderQueued) return;
  bioimpedanceRenderQueued = true;
  window.setTimeout(() => { bioimpedanceRenderQueued = false; void refreshBioimpedanceProgress(); }, 80);
}

export function enableEvolutionFeedback() {
  if (typeof document === 'undefined') return;
  decorateComparisonCards();
  queueBioimpedanceRender();
  const observer = new MutationObserver(() => { decorateComparisonCards(); queueBioimpedanceRender(); });
  observer.observe(document.body, { childList: true, subtree: true });
}
