import { useRef, useState } from 'react';
import type { TitanPlan } from './types';
import { validateTitanPlan } from './validation';
import { normalizeImportedPlan, summarizeImportedPlan, type ImportedPlanSummary } from './importNormalization';

type Props = { onImport: (plan: TitanPlan) => void };
const MAX_IMPORT_BYTES = 5_000_000;

export function PlanImporter({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TitanPlan | null>(null);
  const [summary, setSummary] = useState<ImportedPlanSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  async function readFile(file: File) {
    setErrors([]);
    setWarnings([]);
    setFileName(file.name);

    if (file.size > MAX_IMPORT_BYTES) {
      setErrors(['O arquivo excede o limite de 5 MB.']);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (isStandaloneCardioProject(parsed, file.name)) {
        setPreview(null);
        setSummary(null);
        setErrors(['Projetos de cardio isolados não são mais aceitos. O cardio deve estar incluído no mesmo Projeto TITAN, como etapa do treino.']);
        return;
      }

      const result = validateTitanPlan(parsed);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      const normalized = normalizeImportedPlan(result.plan, file.name);
      const importedSummary = summarizeImportedPlan(normalized);
      setPreview(normalized);
      setSummary(importedSummary);
      setWarnings([...result.warnings, ...importedSummary.warnings]);
    } catch {
      setErrors(['Não foi possível ler o arquivo. Verifique se ele contém JSON válido.']);
    }
  }

  function confirmImport() {
    if (!preview) return;
    onImport(preview);
    setPreview(null);
    setSummary(null);
    setFileName('');
    setErrors([]);
    setWarnings([]);
    if (inputRef.current) inputRef.current.value = '';
  }

  return <section className="import-card" aria-labelledby="import-title">
    <div>
      <span className="eyebrow">INSERIR PROJETO</span>
      <h3 id="import-title">Importar Projeto TITAN</h3>
      <p>Selecione um único projeto completo. Musculação, cardio e demais etapas devem estar organizados dentro dos treinos do projeto.</p>
    </div>

    <div className="validation-message warning">
      <strong>Projeto integrado</strong>
      <ul>
        <li>O cardio não é importado separadamente.</li>
        <li>Quando houver cardio, ele aparece como uma etapa válida dentro do treino programado.</li>
        <li>Arquivos .json e .titan continuam compatíveis.</li>
      </ul>
    </div>

    <input
      ref={inputRef}
      className="file-input"
      type="file"
      accept="application/json,.json,.titan"
      aria-label="Selecionar Projeto TITAN"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void readFile(file);
        event.currentTarget.value = '';
      }}
    />
    <button type="button" className="primary-action" onClick={() => inputRef.current?.click()}>
      {preview ? 'Selecionar outro projeto' : 'Selecionar projeto'}
    </button>

    {fileName && <p className="selected-file">Arquivo: <strong>{fileName}</strong></p>}

    {errors.length > 0 && <div className="validation-message error" role="alert">
      <strong>Não foi possível importar</strong>
      <ul>{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
    </div>}

    {preview && summary && <div className="plan-preview">
      <span className="eyebrow">PRÉVIA VALIDADA</span>
      <h3>Projeto completo</h3>
      <p><strong>O projeto está pronto para ser ativado como uma única programação.</strong></p>
      <div className="import-summary-grid">
        <div><span>Treinos</span><strong>{summary.workouts}</strong></div>
        <div><span>Musculação</span><strong>{summary.strengthExercises}</strong></div>
        <div><span>Cardio integrado</span><strong>{countIntegratedCardio(preview)}</strong></div>
      </div>
      {warnings.length > 0 && <div className="validation-message warning"><strong>Atenção</strong><ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
      <div className="preview-actions">
        <button type="button" className="primary-action" onClick={confirmImport}>Ativar projeto</button>
        <button type="button" className="secondary-action" onClick={() => {
          setPreview(null);
          setSummary(null);
          setErrors([]);
          setWarnings([]);
        }}>Cancelar</button>
      </div>
    </div>}
  </section>;
}

function countIntegratedCardio(plan: TitanPlan) {
  return plan.workouts.flatMap((workout) => workout.exercises).filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length;
}

function isStandaloneCardioProject(input: unknown, fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.titan-cardio')) return true;
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const value = input as Record<string, unknown>;
  return Array.isArray(value.weeks) && !Array.isArray(value.workouts);
}
