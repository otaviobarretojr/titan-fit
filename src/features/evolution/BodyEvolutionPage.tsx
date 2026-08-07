import { useEffect, useMemo, useState } from 'react';
import { loadBodyEvolution, saveBodyEvolution } from './storage';
import type { BodyEvolutionEntry, BodyEvolutionState, EvolutionPhoto } from './types';

const emptyState: BodyEvolutionState = { version: 1, entries: [] };
type FormState = { recordedAt: string; weightKg: string; waistCm: string; armCm: string; chestCm: string; thighCm: string; calfCm: string; bodyFatPercent: string; muscleMassKg: string; leanMassKg: string; visceralFat: string; bodyWaterPercent: string; basalMetabolicRate: string; notes: string };
function today() { return new Date().toISOString().slice(0, 10); }
const initialForm = (): FormState => ({ recordedAt: today(), weightKg: '', waistCm: '', armCm: '', chestCm: '', thighCm: '', calfCm: '', bodyFatPercent: '', muscleMassKg: '', leanMassKg: '', visceralFat: '', bodyWaterPercent: '', basalMetabolicRate: '', notes: '' });
const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Number(value.replace(',', '.'));

type Metric = { label: string; value?: number; suffix: string; decimals?: number };

export function BodyEvolutionPage() {
  const [state, setState] = useState<BodyEvolutionState>(emptyState);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<EvolutionPhoto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => { void loadBodyEvolution().then((saved) => { setState(saved); setStatus('ready'); }).catch(() => setStatus('error')); }, []);

  const entries = state.entries;
  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;
  const latestPhotos = entries.find((entry) => entry.photos?.length) ?? null;
  const chartEntries = useMemo(() => [...entries].slice(0, 3).reverse(), [entries]);
  const selectedEntry = selectedEntryId ? entries.find((entry) => entry.id === selectedEntryId) ?? null : null;

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function openRegister() { setForm(initialForm()); setPhotos([]); setRegisterOpen(true); }
  function closeRegister() { setRegisterOpen(false); setForm(initialForm()); setPhotos([]); }

  async function addPhoto(angle: EvolutionPhoto['angle'], file?: File) {
    if (!file) return;
    try { const dataUrl = await compressImage(file); setPhotos((current) => [...current.filter((photo) => photo.angle !== angle), { id: `${angle}-${Date.now()}`, angle, dataUrl }]); }
    catch { setStatus('error'); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const recordedAt = new Date(`${form.recordedAt}T12:00:00`).toISOString();
    const entry: BodyEvolutionEntry = {
      id: `body-${Date.now()}`, recordedAt,
      weightKg: numberOrUndefined(form.weightKg),
      measurements: compact({ waistCm: numberOrUndefined(form.waistCm), armCm: numberOrUndefined(form.armCm), chestCm: numberOrUndefined(form.chestCm), thighCm: numberOrUndefined(form.thighCm), calfCm: numberOrUndefined(form.calfCm) }),
      bioimpedance: compact({ bodyFatPercent: numberOrUndefined(form.bodyFatPercent), muscleMassKg: numberOrUndefined(form.muscleMassKg), leanMassKg: numberOrUndefined(form.leanMassKg), visceralFat: numberOrUndefined(form.visceralFat), bodyWaterPercent: numberOrUndefined(form.bodyWaterPercent), basalMetabolicRate: numberOrUndefined(form.basalMetabolicRate) }),
      photos: photos.length ? photos : undefined,
      notes: form.notes.trim() || undefined
    };
    if (!entry.weightKg && !entry.measurements && !entry.bioimpedance && !entry.photos?.length && !entry.notes) return;
    setStatus('saving');
    const next = { version: 1 as const, entries: [entry, ...entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) };
    try { await saveBodyEvolution(next); setState(next); setStatus('ready'); closeRegister(); } catch { setStatus('error'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover esta avaliação corporal?')) return;
    const next = { version: 1 as const, entries: entries.filter((entry) => entry.id !== id) };
    await saveBodyEvolution(next); setState(next); setSelectedEntryId(null);
  }

  if (registerOpen) return <RegistrationScreen form={form} photos={photos} status={status} onClose={closeRegister} onUpdate={update} onPhoto={addPhoto} onSubmit={submit} />;
  if (selectedEntry) return <EvaluationDetail entry={selectedEntry} onClose={() => setSelectedEntryId(null)} onRemove={() => void remove(selectedEntry.id)} />;

  return <div className="body-evolution body-dashboard-v22">
    <section className="evolution-hero"><div><span className="eyebrow">EVOLUÇÃO CORPORAL · v0.22</span><h2>Seu corpo hoje</h2><p>Avaliação mensal, comparação e histórico no mesmo painel.</p></div>{status === 'error' && <span className="evolution-error">Falha ao acessar os dados locais.</span>}</section>

    {!latest ? <section className="body-dashboard-empty"><strong>Nenhuma avaliação corporal ainda.</strong><p>Faça a primeira avaliação completa para liberar comparações, gráficos e histórico.</p><button type="button" className="primary-action" onClick={openRegister}>＋ Nova avaliação corporal</button></section> : <>
      <LatestAssessment entry={latest} />
      <button type="button" className="primary-action evolution-main-add" onClick={openRegister}>＋ Nova avaliação corporal</button>

      <section className="body-comparison-section"><div className="section-title-row"><div><span className="eyebrow">COMPARAÇÃO</span><h3>Última vs. anterior</h3></div>{previous && <small>{formatDate(previous.recordedAt)} → {formatDate(latest.recordedAt)}</small>}</div>{previous ? <ComparisonGrid latest={latest} previous={previous} /> : <div className="comparison-empty">Faça mais uma avaliação para liberar o comparativo mensal.</div>}</section>

      <section className="body-chart-section"><div className="section-title-row"><div><span className="eyebrow">ÚLTIMAS AVALIAÇÕES</span><h3>Evolução mensal</h3></div><small>até 3 registros</small></div>{chartEntries.length > 1 ? <div className="body-chart-grid"><MetricTrendCard title="Peso" entries={chartEntries} getValue={(entry) => entry.weightKg} suffix="kg" /><MetricTrendCard title="Gordura corporal" entries={chartEntries} getValue={(entry) => entry.bioimpedance?.bodyFatPercent} suffix="%" /><MetricTrendCard title="Massa muscular" entries={chartEntries} getValue={(entry) => entry.bioimpedance?.muscleMassKg} suffix="kg" /><MetricTrendCard title="Cintura" entries={chartEntries} getValue={(entry) => entry.measurements?.waistCm} suffix="cm" /></div> : <div className="comparison-empty">O gráfico aparece a partir da segunda avaliação.</div>}</section>

      {latestPhotos?.photos?.length ? <section className="body-photo-section"><div className="section-title-row"><div><span className="eyebrow">FOTOS</span><h3>Registro mais recente</h3></div><small>{formatDate(latestPhotos.recordedAt)}</small></div><div className="body-photo-grid">{latestPhotos.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={`${angleLabel(photo.angle)} ${formatDate(latestPhotos.recordedAt)}`} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div></section> : null}
    </>}

    <section className="evolution-timeline compact-timeline"><div className="section-title-row"><div><span className="eyebrow">HISTÓRICO</span><h3>Avaliações corporais</h3></div><small>{entries.length} {entries.length === 1 ? 'registro' : 'registros'}</small></div>{!entries.length ? null : entries.map((entry) => <button type="button" className="evaluation-history-row" key={entry.id} onClick={() => setSelectedEntryId(entry.id)}><div><span>{formatDate(entry.recordedAt)}</span><strong>{entry.weightKg !== undefined ? `${entry.weightKg.toFixed(1)} kg` : 'Avaliação corporal'}</strong></div><div className="evaluation-history-meta">{entry.bioimpedance?.bodyFatPercent !== undefined && <span>{entry.bioimpedance.bodyFatPercent}% gordura</span>}{entry.measurements?.waistCm !== undefined && <span>{entry.measurements.waistCm} cm cintura</span>}</div><span aria-hidden="true">›</span></button>)}</section>
  </div>;
}

function LatestAssessment({ entry }: { entry: BodyEvolutionEntry }) {
  const metrics: Metric[] = [
    { label: 'Peso', value: entry.weightKg, suffix: 'kg' },
    { label: 'Gordura', value: entry.bioimpedance?.bodyFatPercent, suffix: '%' },
    { label: 'Massa muscular', value: entry.bioimpedance?.muscleMassKg, suffix: 'kg' },
    { label: 'Cintura', value: entry.measurements?.waistCm, suffix: 'cm' }
  ];
  return <section className="latest-assessment-card"><header><div><span className="eyebrow">ÚLTIMA AVALIAÇÃO</span><h3>{formatDate(entry.recordedAt)}</h3></div><span className="assessment-badge">Atual</span></header><div className="latest-metric-grid">{metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{formatMetric(metric.value, metric.suffix)}</strong></div>)}</div></section>;
}

function ComparisonGrid({ latest, previous }: { latest: BodyEvolutionEntry; previous: BodyEvolutionEntry }) {
  const metrics = [
    { label: 'Peso', latest: latest.weightKg, previous: previous.weightKg, suffix: 'kg' },
    { label: 'Gordura', latest: latest.bioimpedance?.bodyFatPercent, previous: previous.bioimpedance?.bodyFatPercent, suffix: 'p.p.' },
    { label: 'Massa muscular', latest: latest.bioimpedance?.muscleMassKg, previous: previous.bioimpedance?.muscleMassKg, suffix: 'kg' },
    { label: 'Massa magra', latest: latest.bioimpedance?.leanMassKg, previous: previous.bioimpedance?.leanMassKg, suffix: 'kg' },
    { label: 'Cintura', latest: latest.measurements?.waistCm, previous: previous.measurements?.waistCm, suffix: 'cm' },
    { label: 'Água corporal', latest: latest.bioimpedance?.bodyWaterPercent, previous: previous.bioimpedance?.bodyWaterPercent, suffix: 'p.p.' }
  ];
  return <div className="comparison-grid">{metrics.map((metric) => <ComparisonItem key={metric.label} {...metric} />)}</div>;
}

function ComparisonItem({ label, latest, previous, suffix }: { label: string; latest?: number; previous?: number; suffix: string }) {
  const available = latest !== undefined && previous !== undefined;
  const diff = available ? latest - previous : 0;
  const sign = diff > 0 ? '+' : '';
  return <article className="comparison-item"><span>{label}</span><strong>{available ? `${sign}${diff.toFixed(1)} ${suffix}` : '—'}</strong>{available && <small>{previous.toFixed(1)} → {latest.toFixed(1)}</small>}</article>;
}

function MetricTrendCard({ title, entries, getValue, suffix }: { title: string; entries: BodyEvolutionEntry[]; getValue: (entry: BodyEvolutionEntry) => number | undefined; suffix: string }) {
  const values = entries.map((entry) => ({ date: entry.recordedAt, value: getValue(entry) })).filter((item): item is { date: string; value: number } => item.value !== undefined);
  if (values.length < 2) return <article className="trend-card body-trend-card"><header><div><span className="info-label">{title}</span><strong>Sem dados suficientes</strong></div></header></article>;
  const numeric = values.map((entry) => entry.value); const min = Math.min(...numeric); const max = Math.max(...numeric); const spread = Math.max(max - min, 0.1);
  const points = values.map((entry, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${44 - ((entry.value - min) / spread) * 38}`).join(' ');
  const last = values[values.length - 1]; const first = values[0];
  return <article className="trend-card body-trend-card"><header><div><span className="info-label">{title}</span><strong>{last.value.toFixed(1)} {suffix}</strong></div><small>{first.value.toFixed(1)} → {last.value.toFixed(1)} {suffix}</small></header><svg viewBox="0 0 100 48" role="img" aria-label={`Evolução de ${title}`} preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg><div className="trend-dates">{values.map((entry) => <span key={entry.date}>{shortDate(entry.date)}</span>)}</div></article>;
}

function EvaluationDetail({ entry, onClose, onRemove }: { entry: BodyEvolutionEntry; onClose: () => void; onRemove: () => void }) {
  const metrics = [
    ['Peso', entry.weightKg, 'kg'], ['Cintura', entry.measurements?.waistCm, 'cm'], ['Braço', entry.measurements?.armCm, 'cm'], ['Peito', entry.measurements?.chestCm, 'cm'], ['Coxa', entry.measurements?.thighCm, 'cm'], ['Panturrilha', entry.measurements?.calfCm, 'cm'], ['Gordura corporal', entry.bioimpedance?.bodyFatPercent, '%'], ['Massa muscular', entry.bioimpedance?.muscleMassKg, 'kg'], ['Massa magra', entry.bioimpedance?.leanMassKg, 'kg'], ['Gordura visceral', entry.bioimpedance?.visceralFat, ''], ['Água corporal', entry.bioimpedance?.bodyWaterPercent, '%'], ['Metabolismo basal', entry.bioimpedance?.basalMetabolicRate, 'kcal']
  ] as const;
  return <section className="evolution-register-screen evaluation-detail-screen"><header className="register-screen-header"><button type="button" className="text-action" onClick={onClose}>← Voltar</button><div><span className="eyebrow">AVALIAÇÃO CORPORAL</span><h2>{formatDate(entry.recordedAt)}</h2></div></header><div className="evaluation-detail-grid">{metrics.map(([label, value, suffix]) => value !== undefined ? <div key={label}><span>{label}</span><strong>{value.toFixed(1)} {suffix}</strong></div> : null)}</div>{entry.photos?.length ? <div className="body-photo-grid detail-photos">{entry.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={angleLabel(photo.angle)} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div> : null}{entry.notes && <section className="evaluation-notes-card"><span>Observações</span><p>{entry.notes}</p></section>}<button type="button" className="danger-action" onClick={onRemove}>Remover avaliação</button></section>;
}

function RegistrationScreen({ form, photos, status, onClose, onUpdate, onPhoto, onSubmit }: { form: FormState; photos: EvolutionPhoto[]; status: string; onClose: () => void; onUpdate: (key: keyof FormState, value: string) => void; onPhoto: (angle: EvolutionPhoto['angle'], file?: File) => Promise<void>; onSubmit: (event: React.FormEvent) => Promise<void> }) {
  return <section className="evolution-register-screen"><header className="register-screen-header"><button type="button" className="text-action" onClick={onClose}>← Voltar</button><div><span className="eyebrow">NOVO REGISTRO</span><h2>Avaliação corporal completa</h2></div></header><form onSubmit={(event) => void onSubmit(event)} className="evolution-register-form">
    <div className="evolution-field-grid"><Field label="Data" type="date" value={form.recordedAt} onChange={(v) => onUpdate('recordedAt', v)} /><Field label="Peso (kg)" value={form.weightKg} onChange={(v) => onUpdate('weightKg', v)} /></div>
    <h3>Circunferências</h3><div className="evolution-field-grid"><Field label="Cintura (cm)" value={form.waistCm} onChange={(v) => onUpdate('waistCm', v)} /><Field label="Braço (cm)" value={form.armCm} onChange={(v) => onUpdate('armCm', v)} /><Field label="Peito (cm)" value={form.chestCm} onChange={(v) => onUpdate('chestCm', v)} /><Field label="Coxa (cm)" value={form.thighCm} onChange={(v) => onUpdate('thighCm', v)} /><Field label="Panturrilha (cm)" value={form.calfCm} onChange={(v) => onUpdate('calfCm', v)} /></div>
    <h3>Bioimpedância</h3><div className="evolution-field-grid"><Field label="Gordura (%)" value={form.bodyFatPercent} onChange={(v) => onUpdate('bodyFatPercent', v)} /><Field label="Massa muscular (kg)" value={form.muscleMassKg} onChange={(v) => onUpdate('muscleMassKg', v)} /><Field label="Massa magra (kg)" value={form.leanMassKg} onChange={(v) => onUpdate('leanMassKg', v)} /><Field label="Gordura visceral" value={form.visceralFat} onChange={(v) => onUpdate('visceralFat', v)} /><Field label="Água corporal (%)" value={form.bodyWaterPercent} onChange={(v) => onUpdate('bodyWaterPercent', v)} /><Field label="Metabolismo basal" value={form.basalMetabolicRate} onChange={(v) => onUpdate('basalMetabolicRate', v)} /></div>
    <h3>Fotos</h3><div className="photo-input-grid">{(['front','side','back'] as const).map((angle) => <label key={angle} className="photo-input"><span>{angleLabel(angle)}</span>{photos.find((photo) => photo.angle === angle) ? <img src={photos.find((photo) => photo.angle === angle)?.dataUrl} alt={`Prévia ${angleLabel(angle)}`} /> : <strong>＋ Adicionar</strong>}<input type="file" accept="image/*" capture="environment" onChange={(event) => void onPhoto(angle, event.target.files?.[0])} /></label>)}</div>
    <label className="evolution-notes"><span>Observações</span><textarea value={form.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Horário, condição da avaliação, observações..." /></label><button type="submit" className="primary-action register-save" disabled={status === 'saving'}>{status === 'saving' ? 'Salvando…' : 'Salvar avaliação'}</button>
  </form></section>;
}

function Field({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (value: string) => void; type?: 'number' | 'date' }) { return <label><span>{label}</span><input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function formatMetric(value: number | undefined, suffix: string) { return value === undefined ? '—' : `${value.toFixed(1)} ${suffix}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function shortDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(value)).replace('.', ''); }
function angleLabel(angle: EvolutionPhoto['angle']) { return ({ front: 'Frente', side: 'Lateral', back: 'Costas' })[angle]; }
function compact<T extends Record<string, number | undefined>>(value: T): T | undefined { return Object.values(value).some((item) => item !== undefined) ? value : undefined; }
async function compressImage(file: File): Promise<string> { const source = await fileToDataUrl(file); const image = await loadImage(source); const maxSide = 1200; const scale = Math.min(1, maxSide / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .78); }
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
