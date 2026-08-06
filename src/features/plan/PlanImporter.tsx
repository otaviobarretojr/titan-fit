import { useRef, useState } from 'react';
import type { TitanPlan } from './types';
import { validateTitanPlan } from './validation';

type Props = { onImport: (plan: TitanPlan) => void; };

export function PlanImporter({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TitanPlan | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  async function readFile(file: File) {
    setErrors([]); setWarnings([]); setPreview(null); setFileName(file.name);
    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.titan')) { setErrors(['Selecione um arquivo .json ou .titan.']); return; }
    if (file.size > 1_000_000) { setErrors(['O arquivo excede o limite de 1 MB.']); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateTitanPlan(parsed);
      if (!result.ok) { setErrors(result.errors); return; }
      setPreview(result.plan); setWarnings(result.warnings);
    } catch { setErrors(['Não foi possível ler o JSON. Verifique se o arquivo está bem formatado.']); }
  }

  function confirmImport() {
    if (!preview) return;
    onImport(preview); setPreview(null); setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="import-card" aria-labelledby="import-title">
      <div>
        <span className="eyebrow">IMPORTAR PROJETO</span>
        <h3 id="import-title">Projeto TITAN</h3>
        <p>Importe musculação, cardio, horários e objetivos em um único arquivo. Fichas antigas continuam compatíveis.</p>
      </div>
      <input ref={inputRef} className="file-input" type="file" accept="application/json,.json,.titan" aria-label="Selecionar Projeto TITAN"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); }} />
      <button type="button" className="primary-action" onClick={() => inputRef.current?.click()}>Selecionar projeto</button>
      {fileName && <p className="selected-file">Arquivo: <strong>{fileName}</strong></p>}
      {errors.length > 0 && <div className="validation-message error" role="alert"><strong>Não foi possível importar</strong><ul>{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul></div>}
      {preview && <div className="plan-preview">
        <span className="eyebrow">PRÉVIA DO PROJETO</span>
        <h3>{preview.project?.name ?? preview.name}</h3>
        <p>{preview.workouts.length} treinos • {preview.workouts.reduce((total, workout) => total + workout.exercises.length, 0)} exercícios</p>
        {preview.project?.cardioSchedule?.length ? <p>{preview.project.cardioSchedule.length} sessões de cardio • meta: {preview.project.cardioGoal ?? preview.project.objective}</p> : <p>Projeto sem agenda de cardio.</p>}
        {warnings.length > 0 && <p className="warning-text">{warnings.join(' ')}</p>}
        <div className="preview-actions"><button type="button" className="primary-action" onClick={confirmImport}>Ativar projeto</button><button type="button" className="secondary-action" onClick={() => setPreview(null)}>Cancelar</button></div>
      </div>}
    </section>
  );
}
