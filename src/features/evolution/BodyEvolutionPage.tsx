import { useEffect, useMemo, useState } from 'react';
import { loadBodyEvolution, saveBodyEvolution } from './storage';
import type { BodyEvolutionEntry, BodyEvolutionState, EvolutionPhoto } from './types';

const emptyState: BodyEvolutionState = { version: 1, entries: [] };

type FormState = {
  recordedAt: string;
  weightKg: string;
  waistCm: string;
  armCm: string;
  chestCm: string;
  thighCm: string;
  calfCm: string;
  bodyFatPercent: string;
  muscleMassKg: string;
  leanMassKg: string;
  visceralFat: string;
  bodyWaterPercent: string;
  basalMetabolicRate: string;
  notes: string;
};

function today() { return new Date().toISOString().slice(0, 10); }
const initialForm = (): FormState => ({ recordedAt: today(), weightKg: '', waistCm: '', armCm: '', chestCm: '', thighCm: '', calfCm: '', bodyFatPercent: '', muscleMassKg: '', leanMassKg: '', visceralFat: '', bodyWaterPercent: '', basalMetabolicRate: '', notes: '' });
const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Number(value.replace(',', '.'));

export function BodyEvolutionPage() {
  const [state, setState] = useState<BodyEvolutionState>(emptyState);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<EvolutionPhoto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');

  useEffect(() => { void loadBodyEvolution().then((saved) => { setState(saved); setStatus('ready'); }).catch(() => setStatus('error')); }, []);

  const latest = state.entries[0] ?? null;
  const previous = state.entries[1] ?? null;
  const weightEntries = useMemo(() => [...state.entries].filter((entry) => entry.weightKg).reverse().slice(-12), [state.entries]);
  const waistEntries = useMemo(() => [...state.entries].filter((entry) => entry.measurements?.waistCm).reverse().slice(-12), [state.entries]);

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function addPhoto(angle: EvolutionPhoto['angle'], file?: File) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPhotos((current) => [...current.filter((photo) => photo.angle !== angle), { id: `${angle}-${Date.now()}`, angle, dataUrl }]);
    } catch { setStatus('error'); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const recordedAt = new Date(`${form.recordedAt}T12:00:00`).toISOString();
    const entry: BodyEvolutionEntry = {
      id: `body-${Date.now()}`,
      recordedAt,
      weightKg: numberOrUndefined(form.weightKg),
      measurements: compact({ waistCm: numberOrUndefined(form.waistCm), armCm: numberOrUndefined(form.armCm), chestCm: numberOrUndefined(form.chestCm), thighCm: numberOrUndefined(form.thighCm), calfCm: numberOrUndefined(form.calfCm) }),
      bioimpedance: compact({ bodyFatPercent: numberOrUndefined(form.bodyFatPercent), muscleMassKg: numberOrUndefined(form.muscleMassKg), leanMassKg: numberOrUndefined(form.leanMassKg), visceralFat: numberOrUndefined(form.visceralFat), bodyWaterPercent: numberOrUndefined(form.bodyWaterPercent), basalMetabolicRate: numberOrUndefined(form.basalMetabolicRate) }),
      photos: photos.length ? photos : undefined,
      notes: form.notes.trim() || undefined
    };
    if (!entry.weightKg && !entry.measurements && !entry.bioimpedance && !entry.photos?.length && !entry.notes) return;
    setStatus('saving');
    const next = { version: 1 as const, entries: [entry, ...state.entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) };
    try { await saveBodyEvolution(next); setState(next); setForm(initialForm()); setPhotos([]); setStatus('ready'); } catch { setStatus('error'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este registro de evolução?')) return;
    const next = { version: 1 as const, entries: state.entries.filter((entry) => entry.id !== id) };
    await saveBodyEvolution(next); setState(next);
  }

  return <div className="body-evolution">
    <section className="evolution-hero"><div><span className="eyebrow">CENTRO DE EVOLUÇÃO</span><h2>Seu físico ao longo do tempo</h2><p>Peso, medidas, bioimpedância e fotos salvos no próprio TITAN FIT.</p></div>{status === 'error' && <span className="evolution-error">Falha ao acessar os dados locais.</span>}</section>

    <section className="body-summary-grid">
      <MetricCard label="Peso atual" value={latest?.weightKg ? `${latest.weightKg.toFixed(1)} kg` : '—'} delta={difference(latest?.weightKg, previous?.weightKg, ' kg')} />
      <MetricCard label="Cintura" value={latest?.measurements?.waistCm ? `${latest.measurements.waistCm} cm` : '—'} delta={difference(latest?.measurements?.waistCm, previous?.measurements?.waistCm, ' cm')} />
      <MetricCard label="Gordura corporal" value={latest?.bioimpedance?.bodyFatPercent ? `${latest.bioimpedance.bodyFatPercent}%` : '—'} delta={difference(latest?.bioimpedance?.bodyFatPercent, previous?.bioimpedance?.bodyFatPercent, ' pp')} />
      <MetricCard label="Massa muscular" value={latest?.bioimpedance?.muscleMassKg ? `${latest.bioimpedance.muscleMassKg} kg` : '—'} delta={difference(latest?.bioimpedance?.muscleMassKg, previous?.bioimpedance?.muscleMassKg, ' kg')} />
    </section>

    {(weightEntries.length > 1 || waistEntries.length > 1) && <section className="evolution-trends"><h3>Tendências</h3>{weightEntries.length > 1 && <TrendCard title="Peso" entries={weightEntries.map((entry) => ({ date: entry.recordedAt, value: entry.weightKg ?? 0 }))} suffix="kg" />}{waistEntries.length > 1 && <TrendCard title="Cintura" entries={waistEntries.map((entry) => ({ date: entry.recordedAt, value: entry.measurements?.waistCm ?? 0 }))} suffix="cm" />}</section>}

    <details className="evolution-form-card" open={!state.entries.length}><summary>＋ Novo registro físico</summary><form onSubmit={submit}>
      <div className="evolution-field-grid"><Field label="Data" type="date" value={form.recordedAt} onChange={(value) => update('recordedAt', value)} /><Field label="Peso (kg)" value={form.weightKg} onChange={(value) => update('weightKg', value)} /></div>
      <h4>Medidas</h4><div className="evolution-field-grid"><Field label="Cintura (cm)" value={form.waistCm} onChange={(v) => update('waistCm', v)} /><Field label="Braço (cm)" value={form.armCm} onChange={(v) => update('armCm', v)} /><Field label="Peito (cm)" value={form.chestCm} onChange={(v) => update('chestCm', v)} /><Field label="Coxa (cm)" value={form.thighCm} onChange={(v) => update('thighCm', v)} /><Field label="Panturrilha (cm)" value={form.calfCm} onChange={(v) => update('calfCm', v)} /></div>
      <h4>Bioimpedância <small>opcional</small></h4><div className="evolution-field-grid"><Field label="Gordura (%)" value={form.bodyFatPercent} onChange={(v) => update('bodyFatPercent', v)} /><Field label="Massa muscular (kg)" value={form.muscleMassKg} onChange={(v) => update('muscleMassKg', v)} /><Field label="Massa magra (kg)" value={form.leanMassKg} onChange={(v) => update('leanMassKg', v)} /><Field label="Gordura visceral" value={form.visceralFat} onChange={(v) => update('visceralFat', v)} /><Field label="Água corporal (%)" value={form.bodyWaterPercent} onChange={(v) => update('bodyWaterPercent', v)} /><Field label="Metabolismo basal" value={form.basalMetabolicRate} onChange={(v) => update('basalMetabolicRate', v)} /></div>
      <h4>Fotos</h4><div className="photo-input-grid">{(['front','side','back'] as const).map((angle) => <label key={angle} className="photo-input"><span>{angleLabel(angle)}</span>{photos.find((photo) => photo.angle === angle) ? <img src={photos.find((photo) => photo.angle === angle)?.dataUrl} alt={`Prévia ${angleLabel(angle)}`} /> : <strong>＋ Adicionar</strong>}<input type="file" accept="image/*" capture="environment" onChange={(event) => void addPhoto(angle, event.target.files?.[0])} /></label>)}</div>
      <label className="evolution-notes"><span>Observações</span><textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Condição da avaliação, horário, observações..." /></label>
      <button type="submit" className="primary-action" disabled={status === 'saving'}>{status === 'saving' ? 'Salvando…' : 'Salvar evolução'}</button>
    </form></details>

    <section className="evolution-timeline"><h3>Linha do tempo</h3>{!state.entries.length ? <div className="empty-evolution"><strong>Nenhum registro físico ainda.</strong><p>Cadastre sua primeira avaliação para começar a comparar.</p></div> : state.entries.map((entry) => <article className="evolution-entry" key={entry.id}><header><div><span className="info-label">{formatDate(entry.recordedAt)}</span><h3>{entry.weightKg ? `${entry.weightKg.toFixed(1)} kg` : 'Avaliação física'}</h3></div><button type="button" className="text-action danger-text" onClick={() => void remove(entry.id)}>Remover</button></header><div className="entry-metrics">{entry.measurements?.waistCm && <span>Cintura {entry.measurements.waistCm} cm</span>}{entry.bioimpedance?.bodyFatPercent && <span>Gordura {entry.bioimpedance.bodyFatPercent}%</span>}{entry.bioimpedance?.muscleMassKg && <span>Músculo {entry.bioimpedance.muscleMassKg} kg</span>}</div>{entry.photos?.length ? <div className="timeline-photos">{entry.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={`${angleLabel(photo.angle)} ${formatDate(entry.recordedAt)}`} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div> : null}{entry.notes && <p className="entry-notes">{entry.notes}</p>}</article>)}</section>
  </div>;
}

function Field({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (value: string) => void; type?: 'number' | 'date' }) { return <label><span>{label}</span><input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function MetricCard({ label, value, delta }: { label: string; value: string; delta?: string }) { return <article className="body-metric-card"><span className="info-label">{label}</span><strong>{value}</strong>{delta && <small>{delta} vs. anterior</small>}</article>; }
function difference(current?: number, previous?: number, suffix = '') { if (current === undefined || previous === undefined) return undefined; const diff = current - previous; const prefix = diff > 0 ? '+' : ''; return `${prefix}${diff.toFixed(1)}${suffix}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function angleLabel(angle: EvolutionPhoto['angle']) { return ({ front: 'Frente', side: 'Lateral', back: 'Costas' })[angle]; }
function compact<T extends Record<string, number | undefined>>(value: T): T | undefined { return Object.values(value).some((item) => item !== undefined) ? value : undefined; }

function TrendCard({ title, entries, suffix }: { title: string; entries: Array<{ date: string; value: number }>; suffix: string }) {
  const values = entries.map((entry) => entry.value); const min = Math.min(...values); const max = Math.max(...values); const spread = Math.max(max - min, 0.1);
  const points = entries.map((entry, index) => `${(index / Math.max(entries.length - 1, 1)) * 100},${44 - ((entry.value - min) / spread) * 38}`).join(' ');
  const last = entries[entries.length - 1]; const first = entries[0];
  return <article className="trend-card"><header><div><span className="info-label">{title}</span><strong>{last.value.toFixed(1)} {suffix}</strong></div><small>{first.value.toFixed(1)} → {last.value.toFixed(1)} {suffix}</small></header><svg viewBox="0 0 100 48" role="img" aria-label={`Tendência de ${title}`} preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg></article>;
}

async function compressImage(file: File): Promise<string> {
  const source = await fileToDataUrl(file); const image = await loadImage(source); const maxSide = 1200; const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .78);
}
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
