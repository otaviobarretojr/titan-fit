import { useEffect, useState } from 'react';
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
  notes: string;
};

function today() { return new Date().toISOString().slice(0, 10); }
const initialForm = (): FormState => ({ recordedAt: today(), weightKg: '', waistCm: '', armCm: '', chestCm: '', thighCm: '', calfCm: '', notes: '' });
const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Number(value.replace(',', '.'));

export function BodyEvolutionPage() {
  const [state, setState] = useState<BodyEvolutionState>(emptyState);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<EvolutionPhoto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    void loadBodyEvolution()
      .then((saved) => { setState(saved); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const entries = state.entries;
  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;
  const latestPhotos = entries.find((entry) => entry.photos?.length) ?? null;
  const selectedEntry = selectedEntryId ? entries.find((entry) => entry.id === selectedEntryId) ?? null : null;

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function openRegister() { setForm(initialForm()); setPhotos([]); setRegisterOpen(true); }
  function closeRegister() { setRegisterOpen(false); setForm(initialForm()); setPhotos([]); }

  async function addPhoto(angle: EvolutionPhoto['angle'], file?: File) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPhotos((current) => [...current.filter((photo) => photo.angle !== angle), { id: `${angle}-${Date.now()}`, angle, dataUrl }]);
    } catch {
      setStatus('error');
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const recordedAt = new Date(`${form.recordedAt}T12:00:00`).toISOString();
    const entry: BodyEvolutionEntry = {
      id: `body-${Date.now()}`,
      recordedAt,
      weightKg: numberOrUndefined(form.weightKg),
      measurements: compact({
        waistCm: numberOrUndefined(form.waistCm),
        armCm: numberOrUndefined(form.armCm),
        chestCm: numberOrUndefined(form.chestCm),
        thighCm: numberOrUndefined(form.thighCm),
        calfCm: numberOrUndefined(form.calfCm),
      }),
      photos: photos.length ? photos : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (!entry.weightKg && !entry.measurements && !entry.photos?.length && !entry.notes) return;
    setStatus('saving');
    const next: BodyEvolutionState = { version: 1, entries: [entry, ...entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)) };
    try {
      await saveBodyEvolution(next);
      setState(next);
      setStatus('ready');
      closeRegister();
    } catch {
      setStatus('error');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Remover este registro manual de evolução?')) return;
    const next: BodyEvolutionState = { version: 1, entries: entries.filter((entry) => entry.id !== id) };
    await saveBodyEvolution(next);
    setState(next);
    setSelectedEntryId(null);
  }

  if (registerOpen) return <RegistrationScreen form={form} photos={photos} status={status} onClose={closeRegister} onUpdate={update} onPhoto={addPhoto} onSubmit={submit} />;
  if (selectedEntry) return <EvaluationDetail entry={selectedEntry} onClose={() => setSelectedEntryId(null)} onRemove={() => void remove(selectedEntry.id)} />;

  return <div className="body-evolution body-dashboard-v22">
    <section className="evolution-hero">
      <div>
        <span className="eyebrow">EVOLUÇÃO CORPORAL</span>
        <h2>Seu corpo hoje</h2>
        <p>Bioimpedância automática do relógio, medidas e fotos no mesmo histórico.</p>
      </div>
      {status === 'error' && <span className="evolution-error">Falha ao acessar os dados locais.</span>}
    </section>

    <section className="body-manual-section">
      <div className="section-title-row">
        <div><span className="eyebrow">REGISTROS MANUAIS</span><h3>Medidas e fotos</h3></div>
        <small>Complementar</small>
      </div>
      <p className="body-manual-help">A bioimpedância vem automaticamente do Samsung Health. Aqui você registra apenas o que o relógio não mede: cintura, braço, peito, coxa, panturrilha, peso opcional, fotos e observações.</p>

      {!latest ? <section className="body-dashboard-empty body-manual-empty">
        <strong>Nenhuma medida manual registrada.</strong>
        <p>Isso não impede os gráficos de bioimpedância. Registre medidas ou fotos quando quiser complementar sua evolução.</p>
        <button type="button" className="primary-action" onClick={openRegister}>＋ Registrar medidas e fotos</button>
      </section> : <>
        <LatestManualAssessment entry={latest} />
        <button type="button" className="primary-action evolution-main-add" onClick={openRegister}>＋ Novo registro de medidas</button>

        <section className="body-comparison-section">
          <div className="section-title-row"><div><span className="eyebrow">COMPARAÇÃO MANUAL</span><h3>Último vs. anterior</h3></div>{previous && <small>{formatDate(previous.recordedAt)} → {formatDate(latest.recordedAt)}</small>}</div>
          {previous ? <ManualComparison latest={latest} previous={previous} /> : <div className="comparison-empty">Uma segunda medição manual libera o comparativo de circunferências.</div>}
        </section>

        {latestPhotos?.photos?.length ? <section className="body-photo-section"><div className="section-title-row"><div><span className="eyebrow">FOTOS</span><h3>Registro mais recente</h3></div><small>{formatDate(latestPhotos.recordedAt)}</small></div><div className="body-photo-grid">{latestPhotos.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={`${angleLabel(photo.angle)} ${formatDate(latestPhotos.recordedAt)}`} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div></section> : null}
      </>}
    </section>

    <section className="evolution-timeline compact-timeline">
      <div className="section-title-row"><div><span className="eyebrow">HISTÓRICO MANUAL</span><h3>Medidas e fotos</h3></div><small>{entries.length} {entries.length === 1 ? 'registro' : 'registros'}</small></div>
      {entries.map((entry) => <button type="button" className="evaluation-history-row" key={entry.id} onClick={() => setSelectedEntryId(entry.id)}><div><span>{formatDate(entry.recordedAt)}</span><strong>{entry.measurements?.waistCm !== undefined ? `${entry.measurements.waistCm.toFixed(1)} cm cintura` : entry.weightKg !== undefined ? `${entry.weightKg.toFixed(1)} kg` : 'Registro corporal'}</strong></div><div className="evaluation-history-meta">{entry.measurements?.armCm !== undefined && <span>{entry.measurements.armCm.toFixed(1)} cm braço</span>}{entry.photos?.length ? <span>{entry.photos.length} fotos</span> : null}</div><span aria-hidden="true">›</span></button>)}
    </section>
  </div>;
}

function LatestManualAssessment({ entry }: { entry: BodyEvolutionEntry }) {
  const metrics = [
    ['Cintura', entry.measurements?.waistCm, 'cm'],
    ['Braço', entry.measurements?.armCm, 'cm'],
    ['Peito', entry.measurements?.chestCm, 'cm'],
    ['Peso', entry.weightKg, 'kg'],
  ] as const;
  return <section className="latest-assessment-card"><header><div><span className="eyebrow">ÚLTIMO REGISTRO MANUAL</span><h3>{formatDate(entry.recordedAt)}</h3></div><span className="assessment-badge">Complementar</span></header><div className="latest-metric-grid">{metrics.map(([label, value, suffix]) => <div key={label}><span>{label}</span><strong>{value === undefined ? '—' : `${value.toFixed(1)} ${suffix}`}</strong></div>)}</div></section>;
}

function ManualComparison({ latest, previous }: { latest: BodyEvolutionEntry; previous: BodyEvolutionEntry }) {
  const metrics = [
    ['Peso', latest.weightKg, previous.weightKg, 'kg'],
    ['Cintura', latest.measurements?.waistCm, previous.measurements?.waistCm, 'cm'],
    ['Braço', latest.measurements?.armCm, previous.measurements?.armCm, 'cm'],
    ['Peito', latest.measurements?.chestCm, previous.measurements?.chestCm, 'cm'],
    ['Coxa', latest.measurements?.thighCm, previous.measurements?.thighCm, 'cm'],
    ['Panturrilha', latest.measurements?.calfCm, previous.measurements?.calfCm, 'cm'],
  ] as const;
  return <div className="comparison-grid">{metrics.map(([label, current, before, suffix]) => {
    const available = current !== undefined && before !== undefined;
    const diff = available ? current - before : 0;
    return <article className="comparison-item" key={label}><span>{label}</span><strong>{available ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${suffix}` : '—'}</strong>{available && <small>{before.toFixed(1)} → {current.toFixed(1)}</small>}</article>;
  })}</div>;
}

function EvaluationDetail({ entry, onClose, onRemove }: { entry: BodyEvolutionEntry; onClose: () => void; onRemove: () => void }) {
  const metrics = [
    ['Peso', entry.weightKg, 'kg'], ['Cintura', entry.measurements?.waistCm, 'cm'], ['Braço', entry.measurements?.armCm, 'cm'], ['Peito', entry.measurements?.chestCm, 'cm'], ['Coxa', entry.measurements?.thighCm, 'cm'], ['Panturrilha', entry.measurements?.calfCm, 'cm'],
  ] as const;
  return <section className="evolution-register-screen evaluation-detail-screen"><header className="register-screen-header"><button type="button" className="text-action" onClick={onClose}>← Voltar</button><div><span className="eyebrow">REGISTRO MANUAL</span><h2>{formatDate(entry.recordedAt)}</h2></div></header><div className="evaluation-detail-grid">{metrics.map(([label, value, suffix]) => value !== undefined ? <div key={label}><span>{label}</span><strong>{value.toFixed(1)} {suffix}</strong></div> : null)}</div>{entry.photos?.length ? <div className="body-photo-grid detail-photos">{entry.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={angleLabel(photo.angle)} /><figcaption>{angleLabel(photo.angle)}</figcaption></figure>)}</div> : null}{entry.notes && <section className="evaluation-notes-card"><span>Observações</span><p>{entry.notes}</p></section>}<button type="button" className="danger-action" onClick={onRemove}>Remover registro</button></section>;
}

function RegistrationScreen({ form, photos, status, onClose, onUpdate, onPhoto, onSubmit }: { form: FormState; photos: EvolutionPhoto[]; status: string; onClose: () => void; onUpdate: (key: keyof FormState, value: string) => void; onPhoto: (angle: EvolutionPhoto['angle'], file?: File) => Promise<void>; onSubmit: (event: React.FormEvent) => Promise<void> }) {
  return <section className="evolution-register-screen"><header className="register-screen-header"><button type="button" className="text-action" onClick={onClose}>← Voltar</button><div><span className="eyebrow">NOVO REGISTRO MANUAL</span><h2>Medidas e fotos</h2><p>A bioimpedância é sincronizada automaticamente pelo relógio.</p></div></header><form onSubmit={(event) => void onSubmit(event)} className="evolution-register-form">
    <div className="evolution-field-grid"><Field label="Data" type="date" value={form.recordedAt} onChange={(v) => onUpdate('recordedAt', v)} /><Field label="Peso (kg) · opcional" value={form.weightKg} onChange={(v) => onUpdate('weightKg', v)} /></div>
    <h3>Circunferências</h3><div className="evolution-field-grid"><Field label="Cintura (cm)" value={form.waistCm} onChange={(v) => onUpdate('waistCm', v)} /><Field label="Braço (cm)" value={form.armCm} onChange={(v) => onUpdate('armCm', v)} /><Field label="Peito (cm)" value={form.chestCm} onChange={(v) => onUpdate('chestCm', v)} /><Field label="Coxa (cm)" value={form.thighCm} onChange={(v) => onUpdate('thighCm', v)} /><Field label="Panturrilha (cm)" value={form.calfCm} onChange={(v) => onUpdate('calfCm', v)} /></div>
    <section className="evaluation-notes-card"><span>Bioimpedância</span><p>Gordura corporal e demais dados disponíveis são recebidos automaticamente do Samsung Health/Health Connect e aparecem no painel de composição corporal.</p></section>
    <h3>Fotos</h3><div className="photo-input-grid">{(['front','side','back'] as const).map((angle) => <label key={angle} className="photo-input"><span>{angleLabel(angle)}</span>{photos.find((photo) => photo.angle === angle) ? <img src={photos.find((photo) => photo.angle === angle)?.dataUrl} alt={`Prévia ${angleLabel(angle)}`} /> : <strong>＋ Adicionar</strong>}<input type="file" accept="image/*" capture="environment" onChange={(event) => void onPhoto(angle, event.target.files?.[0])} /></label>)}</div>
    <label className="evolution-notes"><span>Observações</span><textarea value={form.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Condição da medição, observações físicas..." /></label><button type="submit" className="primary-action register-save" disabled={status === 'saving'}>{status === 'saving' ? 'Salvando…' : 'Salvar medidas'}</button>
  </form></section>;
}

function Field({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (value: string) => void; type?: 'number' | 'date' }) { return <label><span>{label}</span><input type={type} step={type === 'number' ? '0.1' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function angleLabel(angle: EvolutionPhoto['angle']) { return ({ front: 'Frente', side: 'Lateral', back: 'Costas' })[angle]; }
function compact<T extends Record<string, number | undefined>>(value: T): T | undefined { return Object.values(value).some((item) => item !== undefined) ? value : undefined; }
async function compressImage(file: File): Promise<string> { const source = await fileToDataUrl(file); const image = await loadImage(source); const maxSide = 1200; const scale = Math.min(1, maxSide / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .78); }
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function loadImage(src: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
