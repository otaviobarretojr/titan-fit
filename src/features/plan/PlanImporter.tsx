import { useRef, useState } from 'react';
import type { TitanPlan } from './types';
import { validateTitanPlan } from './validation';
import { normalizeImportedPlan, summarizeImportedPlan, type ImportedPlanSummary } from './importNormalization';

type Props = { onImport: (plan: TitanPlan) => void; };

export function PlanImporter({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TitanPlan | null>(null);
  const [summary, setSummary] = useState<ImportedPlanSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  async function readFile(file: File) {
    setErrors([]); setWarnings([]); setPreview(null); setSummary(null); setFileName(file.name);
    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.titan')) { setErrors(['Selecione um arquivo .json ou .titan.']); return; }
    if (file.size > 1_000_000) { setErrors(['O arquivo excede o limite de 1 MB.']); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateTitanPlan(parsed);
      if (!result.ok) { setErrors(result.errors); return; }
      const importedSummary = summarizeImportedPlan(result.plan);
      const normalized = normalizeImportedPlan(result.plan, file.name);
      setPreview(normalized);
      setSummary(importedSummary);
      setWarnings([...result.warnings, ...importedSummary.warnings]);
    } catch { setErrors(['Não foi possível ler o JSON. Verifique se o arquivo está bem formatado.']); }
  }

  function confirmImport() {
    if (!preview) return;
    onImport(preview); setPreview(null); setSummary(null); setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return <section className="import-card" aria-labelledby="import-title">
    <div><span className="eyebrow">INSERIR MEU PROJETO</span><h3 id="import-title">Projeto externo</h3><p>Importe uma programação pronta. O TITAN valida, preserva a origem e usa os dados para execução, histórico e acompanhamento sem substituir silenciosamente o que foi prescrito.</p></div>
    <input ref={inputRef} className="file-input" type="file" accept="application/json,.json,.titan" aria-label="Selecionar Projeto TITAN" onChange={(event)=>{const file=event.target.files?.[0];if(file)void readFile(file);}} />
    <button type="button" className="primary-action" onClick={()=>inputRef.current?.click()}>Selecionar projeto</button>
    {fileName&&<p className="selected-file">Arquivo: <strong>{fileName}</strong></p>}
    {errors.length>0&&<div className="validation-message error" role="alert"><strong>Não foi possível importar</strong><ul>{errors.slice(0,8).map((error)=><li key={error}>{error}</li>)}</ul></div>}
    {preview&&summary&&<div className="plan-preview"><span className="eyebrow">PRÉVIA VALIDADA</span><h3>{preview.project?.name??preview.name}</h3><p>Origem: <strong>Projeto importado</strong>{preview.project?.originalAuthor?` · ${preview.project.originalAuthor}`:''}</p>
      <div className="import-summary-grid"><div><span>Treinos</span><strong>{summary.workouts}</strong></div><div><span>Exercícios</span><strong>{summary.strengthExercises}</strong></div><div><span>Cardio</span><strong>{summary.cardioSessions}</strong></div></div>
      {warnings.length>0&&<div className="validation-message warning"><strong>Atenção</strong><ul>{warnings.map((warning)=><li key={warning}>{warning}</li>)}</ul></div>}
      <p className="profile-privacy-note">O Coach TITAN poderá analisar sua execução e progresso, mas mudanças sugeridas serão identificadas como recomendações do TITAN, não como parte do projeto original.</p>
      <div className="preview-actions"><button type="button" className="primary-action" onClick={confirmImport}>Ativar projeto importado</button><button type="button" className="secondary-action" onClick={()=>{setPreview(null);setSummary(null);}}>Cancelar</button></div>
    </div>}
  </section>;
}
