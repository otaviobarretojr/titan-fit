import { useEffect, useMemo, useState } from 'react';
import { loadBodyEvolution, saveBodyEvolution } from './storage';
import type { BodyEvolutionEntry, BodyEvolutionState, EvolutionPhoto } from './types';

const emptyState: BodyEvolutionState = { version: 1, entries: [] };
type FormState = { recordedAt: string; weightKg: string; waistCm: string; armCm: string; chestCm: string; thighCm: string; calfCm: string; bodyFatPercent: string; muscleMassKg: string; leanMassKg: string; visceralFat: string; bodyWaterPercent: string; basalMetabolicRate: string; notes: string };
function today() { return new Date().toISOString().slice(0, 10); }
const initialForm = (): FormState => ({ recordedAt: today(), weightKg: '', waistCm: '', armCm: '', chestCm: '', thighCm: '', calfCm: '', bodyFatPercent: '', muscleMassKg: '', leanMassKg: '', visceralFat: '', bodyWaterPercent: '', basalMetabolicRate: '', notes: '' });
const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Number(value.replace(',', '.'));

type RegisterMode = 'all' | 'weight' | 'measurements' | 'bioimpedance' | 'photos';

export function BodyEvolutionPage() {
  const [state, setState] = useState<BodyEvolutionState>(emptyState);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<EvolutionPhoto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [registerMode, setRegisterMode] = useState<RegisterMode | null>(null);

  useEffect(() => { void loadBodyEvolution().then((saved) => { setState(saved); setStatus('ready'); }).catch(() => setStatus('error')); }, []);

  const latestWeight = state.entries.find((entry) => entry.weightKg !== undefined) ?? null;
  const latestMeasurements = state.entries.find((entry) => entry.measurements) ?? null;
  const latestBio = state.entries.find((entry) => entry.bioimpedance) ?? null;
  const latestPhotos = state.entries.find((entry) => entry.photos?.length) ?? null;
  const weightEntries = useMemo(() => [...state.entries].filter((entry) => entry.weightKg !== undefined).reverse().slice(-12), [state.entries]);
  const waistEntries = useMemo(() => [...state.entries].filter((entry) => entry.measurements?.waistCm !== undefined).reverse().slice(-12), [state.entries]);

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function openRegister(mode: RegisterMode) { setForm(initialForm()); setPhotos([]); setRegisterMode(mode); }
  function closeRegister() { setRegisterMode(null); setForm(initialForm()); setPhotos([]); }

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
    const next = { version: 1 as const, entries: [entry, ...state.entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) };
    try { await saveBodyEvolution(next); setState(next); setStatus('ready'); closeRegister(); } catch { setStatus('error'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este registro de evolução?')) return;
    const next = { version: 1 as const, entries: state.entries.filter((entry) => entry.id !== id) };
    await saveBodyEvolution(next); setState(next);
  }

  if (registerMode) return <RegistrationScreen mode={registerMode} form={form} photos={photos} status={status} onClose={closeRegister} onUpdate={update} onPhoto={addPhoto} onSubmit={submit} />;

  return <div className="body-evolution">
    <section className="evolution-hero"><div><span className="eyebrow">STATUS CORPORAL</span><h2>Seu corpo hoje</h2><p>Últimos registros e evolução física em um só lugar.</p></div>{status === 'error' && <span className="evolution-error">Falha ao acessar os dados locais.</span>}</section>

    <section className="body-status-list">
      <StatusCard title="Peso" date={latestWeight?.recordedAt} value={latestWeight?.weightKg !== undefined ? `${latestWeight.weightKg.toFixed(1)} kg` : 'Sem registro'} detail={weightTrend(state.entries)} onAdd={() => openRegister('weight')} />
      <StatusCard title="Circunferências" date={latestMeasurements?.recordedAt} value={latestMeasurements?.measurements?.waistCm ? `Cintura ${latestMeasurements.measurements.waistCm} cm` : 'Sem registro'} detail={measurementSummary(latestMeasurements)} onAdd={() => openRegister('measurements')} />
      <StatusCard title="Bioimpedância" date={latestBio?.recordedAt} value={latestBio?.bioimpedance?.bodyFatPercent !== undefined ? `${latestBio.bioimpedance.bodyFatPercent}% de gordura` : 'Sem registro'} detail={bioSummary(latestBio)} onAdd={() => openRegister('bioimpedance')} />
      <StatusCard title="Fotos" date={latestPhotos?.recordedAt} value={latestPhotos?.photos?.length ? `${latestPhotos.photos.length} ângulos registrados` : 'Sem registro'} detail="Frente, lateral e costas" onAdd={() => openRegister('photos')} />
    </section>

    <button type="button" className="primary-action evolution-main-add" onClick={() => openRegister('all')}>＋ Nova avaliação completa</button>

    {(weightEntries.length > 1 || waistEntries.length > 1) && <section className="evolution-trends"><h3>Evolução</h3>{weightEntries.length > 1 && <TrendCard title="Peso" entries={weightEntries.map((entry) => ({ date: entry.recordedAt, value: entry.weightKg ?? 0 }))} suffix="kg" />}{waistEntries.length > 1 && <TrendCard title="Cintura" entries={waistEntries.map((entry) => ({ date: entry.recordedAt, value: entry.measurements?.waistCm ?? 0 }))} suffix="cm" />}</section>}

    <section className="evolution-timeline"><h3>Histórico de avaliações</h3>{!state.entries.length ? <div className="empty-evolution"><strong>Nenhum registro físico ainda.</strong><p>Toque em “Nova avaliação completa” para começar.</p></div> : state.entries.map((entry) => <article className="evolution-entry" key={entry.id}><header><div><span className="info-label">{formatDate(entry.recordedAt)}</span><h3>{entry.weightKg ? `${entry.weightKg.toFixed(1)} kg` : 'Avaliação física'}</h3></div><button type="button" className="text-action danger-text" onClick={() => void remove(entry.id)}>Remover</button></header><div className="entry-metrics">{entry.measurements?.waistCm && <span>Cintura {entry.measurements.waistCm} cm</span>}{entry.bioimpedance?.bodyFatPercent !== undefined && <span>Gordura {entry.bioimpedance.bodyFatPercent}%</span>}{entry.bioimpedance?.muscleMassKg !== undefined && <span>Músculo {entry.bioimpedance.muscleMassKg} kg</span>}</div>{entry.photos?.length ? <div className="timeline-photos">{entry.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={`${angleLabel(photo.angle)} ${formatDate(entry.recordedAt)}`} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div> : null}{entry.notes && <p className="entry-notes">{entry.notes}</p>}</article>)}</section>
  </div>;
}

function RegistrationScreen({ mode, form, photos, status, onClose, onUpdate, onPhoto, onSubmit }: { mode: RegisterMode; form: FormState; photos: EvolutionPhoto[]; status: string; onClose: () => void; onUpdate: (key: keyof FormState, value: string) => void; onPhoto: (angle: EvolutionPhoto['angle'], file?: File) => Promise<void>; onSubmit: (event: React.FormEvent) => Promise<void> }) {
  const showWeight = mode === 'all' || mode === 'weight'; const showMeasurements = mode === 'all' || mode === 'measurements'; const showBio = mode === 'all' || mode === 'bioimpedance'; const showPhotos = mode === 'all' || mode === 'photos';
  return <section className="evolution-register-screen"><header className="register-screen-header"><button type="button" className="text-action" onClick={onClose}>← Voltar</button><div><span className="eyebrow">NOVO REGISTRO</span><h2>{registerTitle(mode)}</h2></div></header><form onSubmit={(event) => void onSubmit(event)} className="evolution-register-form">
    <div className="evolution-field-grid"><Field label="Data" type="date" value={form.recordedAt} onChange={(v) => onUpdate('recordedAt', v)} />{showWeight && <Field label="Peso (kg)" value={form.weightKg} onChange={(v) => onUpdate('weightKg', v)} />}</div>
    {showMeasurements && <><h3>Circunferências</h3><div className="evolution-field-grid"><Field label="Cintura (cm)" value={form.waistCm} onChange={(v) => onUpdate('waistCm', v)} /><Field label="Braço (cm)" value={form.armCm} onChange={(v) => onUpdate('armCm', v)} /><Field label="Peito (cm)" value={form.chestCm} onChange={(v) => onUpdate('chestCm', v)} /><Field label="Coxa (cm)" value={form.thighCm} onChange={(v) => onUpdate('thighCm', v)} /><Field label="Panturrilha (cm)" value={form.calfCm} onChange={(v) => onUpdate('calfCm', v)} /></div></>}
    {showBio && <><h3>Bioimpedância</h3><div className="evolution-field-grid"><Field label="Gordura (%)" value={form.bodyFatPercent} onChange={(v) => onUpdate('bodyFatPercent', v)} /><Field label="Massa muscular (kg)" value={form.muscleMassKg} onChange={(v) => onUpdate('muscleMassKg', v)} /><Field label="Massa magra (kg)" value={form.leanMassKg} onChange={(v) => onUpdate('leanMassKg', v)} /><Field label="Gordura visceral" value={form.visceralFat} onChange={(v) => onUpdate('visceralFat', v)} /><Field label="Água corporal (%)" value={form.bodyWaterPercent} onChange={(v) => onUpdate('bodyWaterPercent', v)} /><Field label="Metabolismo basal" value={form.basalMetabolicRate} onChange={(v) => onUpdate('basalMetabolicRate', v)} /></div></>}
    {showPhotos && <><h3>Fotos</h3><div className="photo-input-grid">{(['front','side','back'] as const).map((angle) => <label key={angle} className="photo-input"><span>{angleLabel(angle)}</span>{photos.find((photo) => photo.angle === angle) ? <img src={photos.find((photo) => photo.angle === angle)?.dataUrl} alt={`Prévia ${angleLabel(angle)}`} /> : <strong>＋ Adicionar</strong>}<input type="file" accept="image/*" capture="environment" onChange={(event) => void onPhoto(angle, event.target.files?.[0])} /></label>)}</div></>}
    <label className="evolution-notes"><span>Observações</span><textarea value={form.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Horário, condição da avaliação, observações..." /></label><button type="submit" className="primary-action register-save" disabled={status === 'saving'}>{status === 'saving' ? 'Salvando…' : 'Salvar registro'}</button>
  </form></section>;
}

function StatusCard({ title, date, value, detail, onAdd }: { title: string; date?: string; value: string; detail?: string; onAdd: () => void }) { return <article className="body-status-card"><div className="body-status-card-main"><span className="info-label">{title.toUpperCase()}</span><strong>{value}</strong>{detail && <small>{detail}</small>}{date && <small>Último registro: {formatDate(date)}</small>}</div><button type="button" className="status-add-button" aria-label={`Adicionar ${title}`} onClick={onAdd}>＋</button></article>; }
function registerTitle(mode: RegisterMode) { return ({ all: 'Avaliação completa', weight: 'Peso', measurements: 'Circunferências', bioimpedance: 'Bioimpedância', photos: 'Fotos de evolução' })[mode]; }
function weightTrend(entries: BodyEvolutionEntry[]) { const values = entries.filter((entry) => entry.weightKg !== undefined).slice(0, 2); if (values.length < 2) return 'Aguardando comparação'; const diff = (values[0].weightKg ?? 0) - (values[1].weightKg ?? 0); return `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg vs. registro anterior`; }
function measurementSummary(entry: BodyEvolutionEntry | null) { if (!entry?.measurements) return 'Cintura, braço, peito, coxa e panturrilha'; const m = entry.measurements; return [`Braço ${m.armCm ?? '—'}`, `Peito ${m.chestCm ?? '—'}`, `Coxa ${m.thighCm ?? '—'}`].join(' · '); }
function bioSummary(entry: BodyEvolutionEntry | null) { if (!entry?.bioimpedance) return 'Gordura, massa muscular, massa magra, água e gordura visceral'; const b = entry.bioimpedance; return [`Músculo ${b.muscleMassKg ?? '—'} kg`, `Visceral ${b.visceralFat ?? '—'}`, `Água ${b.bodyWaterPercent ?? '—'}%`].join(' · '); }
function Field({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (value: string) => void; type?: 'number' | 'date' }) { return <label><span>{label}</span><input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function angleLabel(angle: EvolutionPhoto['angle']) { return ({ front: 'Frente', side: 'Lateral', back: 'Costas' })[angle]; }
function compact<T extends Record<string, number | undefined>>(value: T): T | undefined { return Object.values(value).some((item) => item !== undefined) ? value : undefined; }

function TrendCard({ title, entries, suffix }: { title: string; entries: Array<{ date: string; value: number }>; suffix: string }) { const values = entries.map((entry) => entry.value); const min = Math.min(...values); const max = Math.max(...values); const spread = Math.max(max - min, 0.1); const points = entries.map((entry, index) => `${(index / Math.max(entries.length - 1, 1)) * 100},${44 - ((entry.value - min) / spread) * 38}`).join(' '); const last = entries[entries.length - 1]; const first = entries[0]; return <article className="trend-card"><header><div><span className="info-label">{title}</span><strong>{last.value.toFixed(1)} {suffix}</strong></div><small>{first.value.toFixed(1)} → {last.value.toFixed(1)} {suffix}</small></header><svg viewBox="0 0 100 48" role="img" aria-label={`Tendência de ${title}`} preserveAspectRatio="none"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg></article>; }
async function compressImage(file: File): Promise<string> { const source = await fileToDataUrl(file); const image = await loadImage(source); const maxSide = 1200; const scale = Math.min(1, maxSide / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .78); }
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
