import { useRef, useState } from 'react';
import { loadActivePlan } from './storage';
import type { TitanCardioSession, TitanPlan } from './types';
import { validateTitanPlan } from './validation';
import { normalizeImportedPlan, summarizeImportedPlan, type ImportedPlanSummary } from './importNormalization';

type Props = { onImport: (plan: TitanPlan) => void };
type ImportKind = 'project' | 'cardio' | 'combined';
type RawCardioSession = { id?: unknown; title?: unknown; type?: unknown; durationMinutes?: unknown; description?: unknown; target?: unknown };
type RawCardioWeek = { week?: unknown; sessions?: unknown };
type RawCardioPlan = { schemaVersion?: unknown; name?: unknown; goal?: unknown; weeks?: unknown };

const CARDIO_TYPES: TitanCardioSession['type'][] = ['walk', 'zone2', 'run-walk', 'run', 'hiit', 'bike', 'stairs', 'other'];
const MAX_IMPORT_BYTES = 5_000_000;

export function PlanImporter({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TitanPlan | null>(null);
  const [summary, setSummary] = useState<ImportedPlanSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [importKind, setImportKind] = useState<ImportKind>('project');
  const [pendingCardio, setPendingCardio] = useState<unknown | null>(null);
  const [pendingCardioName, setPendingCardioName] = useState('');

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
      const detectedKind = detectImportKind(parsed, file.name);
      if (!detectedKind) {
        setErrors(['O arquivo não foi reconhecido como Projeto Musculação ou Projeto Cardio do TITAN.']);
        return;
      }

      const activePlan = loadActivePlan();

      if (detectedKind === 'cardio') {
        const basePlan = preview ?? activePlan;
        if (!basePlan) {
          const cardioCheck = validateStandaloneCardio(parsed);
          if (!cardioCheck.ok) {
            setErrors(cardioCheck.errors);
            return;
          }
          setPendingCardio(parsed);
          setPendingCardioName(file.name);
          setPreview(null);
          setSummary(null);
          setImportKind('cardio');
          setWarnings(['Projeto Cardio carregado. Agora selecione o Projeto Musculação; o TITAN juntará os dois automaticamente antes de ativar.']);
          return;
        }

        const cardioResult = mergeCardioPlan(basePlan, parsed);
        if (!cardioResult.ok) {
          setErrors(cardioResult.errors);
          return;
        }
        setPreview(cardioResult.plan);
        setSummary(summarizeImportedPlan(cardioResult.plan));
        setImportKind(preview && !activePlan ? 'combined' : activePlan ? 'cardio' : 'combined');
        setPendingCardio(null);
        setPendingCardioName('');
        setWarnings([
          activePlan
            ? 'O cardio será atualizado sem modificar a musculação nem o histórico.'
            : 'Musculação e cardio foram combinados. Revise a prévia e ative o projeto.'
        ]);
        return;
      }

      const result = validateTitanPlan(parsed);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      let normalized = normalizeImportedPlan(result.plan, file.name);
      let combinedWithPendingCardio = false;

      if (pendingCardio !== null) {
        const cardioResult = mergeCardioPlan(normalized, pendingCardio);
        if (!cardioResult.ok) {
          setErrors(cardioResult.errors);
          return;
        }
        normalized = cardioResult.plan;
        combinedWithPendingCardio = true;
        setPendingCardio(null);
        setPendingCardioName('');
      } else if (activePlan?.project?.cardioSchedule?.length && !normalized.project?.cardioSchedule?.length) {
        normalized = preserveExistingCardio(normalized, activePlan);
      }

      const importedSummary = summarizeImportedPlan(normalized);
      setPreview(normalized);
      setSummary(importedSummary);
      setImportKind(combinedWithPendingCardio ? 'combined' : 'project');
      setWarnings([
        ...result.warnings,
        ...importedSummary.warnings,
        ...(combinedWithPendingCardio ? ['Projeto Musculação + Projeto Cardio combinados com sucesso.'] : []),
        ...(activePlan?.project?.cardioSchedule?.length && !result.plan.project?.cardioSchedule?.length
          ? ['A musculação será atualizada e o cardio atual será mantido.']
          : [])
      ]);
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
    setImportKind('project');
    setPendingCardio(null);
    setPendingCardioName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const previewTitle = importKind === 'cardio' ? 'Projeto Cardio' : importKind === 'combined' ? 'Projeto completo' : 'Projeto Musculação';
  const confirmLabel = importKind === 'cardio' ? 'Atualizar cardio' : importKind === 'combined' ? 'Ativar projeto completo' : 'Ativar musculação';
  const hasPendingCardio = pendingCardio !== null;

  return <section className="import-card" aria-labelledby="import-title">
    <div>
      <span className="eyebrow">INSERIR PROJETO</span>
      <h3 id="import-title">Importar projeto</h3>
      <p>Selecione Musculação e Cardio em qualquer ordem. O TITAN identifica o conteúdo do arquivo e combina os dois quando necessário.</p>
    </div>

    <div className="validation-message warning">
      <strong>Importação inteligente</strong>
      <ul>
        <li>O tipo é identificado pelo conteúdo, mesmo se o Android alterar o nome do arquivo.</li>
        <li>Você pode carregar Cardio primeiro e Musculação depois, ou fazer o contrário.</li>
        <li>Arquivos .json, .titan e .titan-cardio continuam compatíveis.</li>
      </ul>
    </div>

    <input
      ref={inputRef}
      className="file-input"
      type="file"
      accept="application/json,.json,.titan,.titan-cardio"
      aria-label="Selecionar Projeto TITAN"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void readFile(file);
        event.currentTarget.value = '';
      }}
    />
    <button type="button" className="primary-action" onClick={() => inputRef.current?.click()}>
      {preview ? 'Adicionar outro arquivo' : hasPendingCardio ? 'Selecionar musculação' : 'Selecionar projeto'}
    </button>

    {fileName && <p className="selected-file">Arquivo: <strong>{fileName}</strong></p>}
    {hasPendingCardio && <div className="validation-message warning"><strong>Cardio pronto</strong><p>{pendingCardioName || 'Projeto Cardio'} foi validado. Selecione agora o arquivo de musculação.</p></div>}

    {errors.length > 0 && <div className="validation-message error" role="alert">
      <strong>Não foi possível importar</strong>
      <ul>{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
    </div>}

    {preview && summary && <div className="plan-preview">
      <span className="eyebrow">PRÉVIA VALIDADA</span>
      <h3>{previewTitle}</h3>
      <p><strong>{importKind === 'combined' ? 'Musculação e cardio serão ativados juntos.' : importKind === 'cardio' ? 'Somente o cardio será atualizado.' : 'A musculação está pronta; você pode ativar agora ou adicionar o cardio antes.'}</strong></p>
      <div className="import-summary-grid">
        <div><span>Treinos</span><strong>{summary.workouts}</strong></div>
        <div><span>Exercícios</span><strong>{summary.strengthExercises}</strong></div>
        <div><span>Cardio</span><strong>{summary.cardioSessions}</strong></div>
      </div>
      {warnings.length > 0 && <div className="validation-message warning"><strong>Atenção</strong><ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
      <div className="preview-actions">
        <button type="button" className="primary-action" onClick={confirmImport}>{confirmLabel}</button>
        <button type="button" className="secondary-action" onClick={() => {
          setPreview(null);
          setSummary(null);
          setImportKind('project');
          setErrors([]);
        }}>Cancelar</button>
      </div>
    </div>}
  </section>;
}

function detectImportKind(input: unknown, fileName: string): 'project' | 'cardio' | null {
  if (isRecord(input)) {
    if (Array.isArray(input.workouts) && input.workouts.length > 0) return 'project';
    if (Array.isArray(input.weeks) && input.weeks.length > 0) return 'cardio';
  }
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.titan-cardio')) return 'cardio';
  if (lowerName.endsWith('.titan') || lowerName.endsWith('.json')) return 'project';
  return null;
}

function validateStandaloneCardio(input: unknown): { ok: true } | { ok: false; errors: string[] } {
  if (!isRecord(input)) return { ok: false, errors: ['O Projeto Cardio precisa conter um objeto JSON válido.'] };
  const cardio = input as RawCardioPlan;
  if (cardio.schemaVersion !== 1) return { ok: false, errors: ['schemaVersion do Projeto Cardio deve ser 1.'] };
  if (!Array.isArray(cardio.weeks) || cardio.weeks.length === 0) return { ok: false, errors: ['O Projeto Cardio não possui semanas válidas.'] };
  const errors: string[] = [];
  cardio.weeks.forEach((rawWeek, weekIndex) => {
    if (!isRecord(rawWeek)) {
      errors.push(`Semana ${weekIndex + 1} é inválida.`);
      return;
    }
    const week = rawWeek as RawCardioWeek;
    if (!Array.isArray(week.sessions) || week.sessions.length === 0) errors.push(`Semana ${weekIndex + 1} não possui sessões.`);
  });
  return errors.length ? { ok: false, errors } : { ok: true };
}

function preserveExistingCardio(nextPlan: TitanPlan, activePlan: TitanPlan): TitanPlan {
  const activeProject = activePlan.project;
  if (!activeProject?.cardioSchedule?.length) return nextPlan;
  const nextProject = nextPlan.project ?? { name: nextPlan.name, objective: nextPlan.description ?? 'Projeto TITAN' };
  return { ...nextPlan, project: { ...nextProject, cardioGoal: activeProject.cardioGoal, cardioSchedule: activeProject.cardioSchedule } };
}

function mergeCardioPlan(activePlan: TitanPlan, input: unknown): { ok: true; plan: TitanPlan } | { ok: false; errors: string[] } {
  if (!isRecord(input)) return { ok: false, errors: ['O Projeto Cardio precisa conter um objeto JSON válido.'] };
  const cardio = input as RawCardioPlan;
  if (cardio.schemaVersion !== 1) return { ok: false, errors: ['schemaVersion do Projeto Cardio deve ser 1.'] };
  if (!Array.isArray(cardio.weeks) || cardio.weeks.length === 0) return { ok: false, errors: ['O Projeto Cardio não possui semanas válidas.'] };

  const errors: string[] = [];
  const schedule = cardio.weeks.flatMap((rawWeek, weekIndex) => {
    if (!isRecord(rawWeek)) {
      errors.push(`Semana ${weekIndex + 1} é inválida.`);
      return [];
    }
    const week = rawWeek as RawCardioWeek;
    const weekNumber = typeof week.week === 'number' && Number.isInteger(week.week) ? week.week : weekIndex + 1;
    if (!Array.isArray(week.sessions) || week.sessions.length === 0) {
      errors.push(`Semana ${weekNumber} não possui sessões.`);
      return [];
    }
    return week.sessions.flatMap((rawSession, sessionIndex) => toCardioSession(rawSession, weekNumber, sessionIndex, errors));
  });

  if (errors.length || schedule.length === 0) return { ok: false, errors: errors.length ? errors : ['Nenhuma sessão de cardio válida foi encontrada.'] };
  const project = activePlan.project ?? { name: activePlan.name, objective: activePlan.description ?? 'Projeto TITAN' };
  const goalLabel = typeof cardio.name === 'string' && cardio.name.trim() ? cardio.name.trim() : readString(cardio.goal) || 'Projeto Cardio';
  return { ok: true, plan: { ...activePlan, project: { ...project, cardioGoal: goalLabel, cardioSchedule: schedule } } };
}

function toCardioSession(value: unknown, week: number, index: number, errors: string[]): TitanCardioSession[] {
  if (!isRecord(value)) {
    errors.push(`Semana ${week}, sessão ${index + 1} é inválida.`);
    return [];
  }
  const session = value as RawCardioSession;
  const title = readString(session.title);
  const id = readString(session.id) || `cardio-w${week}-${index + 1}`;
  const durationMinutes = typeof session.durationMinutes === 'number' && Number.isFinite(session.durationMinutes) ? session.durationMinutes : 0;
  const rawType = readString(session.type) as TitanCardioSession['type'];
  if (!title || durationMinutes <= 0 || !CARDIO_TYPES.includes(rawType)) {
    errors.push(`Semana ${week}, sessão ${index + 1} possui dados inválidos.`);
    return [];
  }
  const day = inferDay(title, index);
  const description = readString(session.description);
  const target = readString(session.target);
  return [{
    id: `${id}-w${week}`,
    day,
    startTime: '17:00',
    title: `Semana ${week} — ${title}`,
    type: rawType,
    durationMinutes,
    week,
    phase: `Semana ${week}`,
    goal: target || description || 'Progressão cardiovascular',
    instructions: [description, target].filter(Boolean)
  }];
}

function inferDay(title: string, index: number) {
  const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('domingo')) return 'Domingo';
  if (normalized.includes('segunda')) return 'Segunda';
  if (normalized.includes('terca')) return 'Terça';
  if (normalized.includes('quarta')) return 'Quarta';
  if (normalized.includes('quinta')) return 'Quinta';
  if (normalized.includes('sexta')) return 'Sexta';
  if (normalized.includes('sabado')) return 'Sábado';
  return ['Domingo', 'Terça', 'Quarta', 'Sexta'][index] ?? 'Cardio';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
