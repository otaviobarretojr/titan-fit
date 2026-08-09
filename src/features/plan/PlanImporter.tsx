import { useRef, useState } from 'react';
import { loadActivePlan } from './storage';
import type { TitanCardioSession, TitanPlan } from './types';
import { validateTitanPlan } from './validation';
import { normalizeImportedPlan, summarizeImportedPlan, type ImportedPlanSummary } from './importNormalization';

type Props = { onImport: (plan: TitanPlan) => void; };
type ImportKind = 'project' | 'cardio';
type RawCardioSession = { id?: unknown; title?: unknown; type?: unknown; durationMinutes?: unknown; description?: unknown; target?: unknown };
type RawCardioWeek = { week?: unknown; sessions?: unknown };
type RawCardioPlan = { schemaVersion?: unknown; name?: unknown; goal?: unknown; weeks?: unknown };
const CARDIO_TYPES: TitanCardioSession['type'][] = ['walk','zone2','run-walk','run','hiit','bike','stairs','other'];

export function PlanImporter({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<TitanPlan | null>(null);
  const [summary, setSummary] = useState<ImportedPlanSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [importKind, setImportKind] = useState<ImportKind>('project');

  async function readFile(file: File) {
    setErrors([]); setWarnings([]); setPreview(null); setSummary(null); setFileName(file.name);
    const lowerName = file.name.toLowerCase();
    const isCardioFile = lowerName.endsWith('.titan-cardio');
    const isProjectFile = lowerName.endsWith('.json') || lowerName.endsWith('.titan');
    if (!isProjectFile && !isCardioFile) { setErrors(['Selecione Projeto Musculação (.titan/.json) ou Projeto Cardio (.titan-cardio).']); return; }
    if (file.size > 1_000_000) { setErrors(['O arquivo excede o limite de 1 MB.']); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const activePlan = loadActivePlan();
      if (isCardioFile) {
        if (!activePlan) { setErrors(['Importe primeiro o Projeto Musculação. Depois selecione o Projeto Cardio.']); return; }
        const cardioResult = mergeCardioPlan(activePlan, parsed);
        if (!cardioResult.ok) { setErrors(cardioResult.errors); return; }
        setPreview(cardioResult.plan); setSummary(summarizeImportedPlan(cardioResult.plan)); setImportKind('cardio');
        setWarnings([activePlan.project?.cardioSchedule?.length ? 'O cardio atual será atualizado. Musculação e histórico serão preservados.' : 'O cardio será inserido sem modificar a musculação nem o histórico.']);
        return;
      }
      const result = validateTitanPlan(parsed);
      if (!result.ok) { setErrors(result.errors); return; }
      let normalized = normalizeImportedPlan(result.plan, file.name);
      if (activePlan?.project?.cardioSchedule?.length && !normalized.project?.cardioSchedule?.length) normalized = preserveExistingCardio(normalized, activePlan);
      const importedSummary = summarizeImportedPlan(normalized);
      setPreview(normalized); setSummary(importedSummary); setImportKind('project');
      setWarnings([...result.warnings, ...importedSummary.warnings, ...(activePlan?.project?.cardioSchedule?.length && !result.plan.project?.cardioSchedule?.length ? ['A musculação será atualizada e o cardio atual será mantido.'] : [])]);
    } catch { setErrors(['Não foi possível ler o arquivo. Verifique se ele está bem formatado.']); }
  }

  function confirmImport() { if (!preview) return; onImport(preview); setPreview(null); setSummary(null); setFileName(''); setImportKind('project'); if (inputRef.current) inputRef.current.value = ''; }

  return <section className="import-card" aria-labelledby="import-title"><div><span className="eyebrow">INSERIR PROJETO</span><h3 id="import-title">Atualizar projeto</h3><p>Selecione Projeto Musculação ou Projeto Cardio. O TITAN identifica o tipo do arquivo e atualiza somente essa parte do projeto.</p></div><div className="validation-message warning"><strong>Importação inteligente</strong><ul><li>Projeto Musculação atualiza somente a musculação e preserva o cardio existente.</li><li>Projeto Cardio insere ou atualiza somente o cardio e preserva a musculação.</li></ul></div><input ref={inputRef} className="file-input" type="file" accept="application/json,.json,.titan,.titan-cardio" aria-label="Selecionar Projeto TITAN" onChange={(event)=>{const file=event.target.files?.[0];if(file)void readFile(file);}} /><button type="button" className="primary-action" onClick={()=>inputRef.current?.click()}>Selecionar projeto</button>{fileName&&<p className="selected-file">Arquivo: <strong>{fileName}</strong></p>}{errors.length>0&&<div className="validation-message error" role="alert"><strong>Não foi possível importar</strong><ul>{errors.slice(0,8).map((error)=><li key={error}>{error}</li>)}</ul></div>}{preview&&summary&&<div className="plan-preview"><span className="eyebrow">PRÉVIA VALIDADA</span><h3>{importKind==='cardio'?'Projeto Cardio':'Projeto Musculação'}</h3><p><strong>{importKind==='cardio'?'Somente o cardio será atualizado.':'Somente a musculação será atualizada.'}</strong></p><div className="import-summary-grid"><div><span>Treinos</span><strong>{summary.workouts}</strong></div><div><span>Exercícios</span><strong>{summary.strengthExercises}</strong></div><div><span>Cardio</span><strong>{summary.cardioSessions}</strong></div></div>{warnings.length>0&&<div className="validation-message warning"><strong>Atenção</strong><ul>{warnings.map((warning)=><li key={warning}>{warning}</li>)}</ul></div>}<div className="preview-actions"><button type="button" className="primary-action" onClick={confirmImport}>{importKind==='cardio'?'Atualizar cardio':'Atualizar musculação'}</button><button type="button" className="secondary-action" onClick={()=>{setPreview(null);setSummary(null);setImportKind('project');}}>Cancelar</button></div></div>}</section>;
}

function preserveExistingCardio(nextPlan:TitanPlan, activePlan:TitanPlan):TitanPlan { const activeProject=activePlan.project; if(!activeProject?.cardioSchedule?.length)return nextPlan; const nextProject=nextPlan.project ?? {name:nextPlan.name,objective:nextPlan.description??'Projeto TITAN'}; return {...nextPlan,project:{...nextProject,cardioGoal:activeProject.cardioGoal,cardioSchedule:activeProject.cardioSchedule}}; }
function mergeCardioPlan(activePlan:TitanPlan,input:unknown):{ok:true;plan:TitanPlan}|{ok:false;errors:string[]}{ if(!isRecord(input))return{ok:false,errors:['O Projeto Cardio precisa conter um objeto JSON válido.']}; const cardio=input as RawCardioPlan; if(cardio.schemaVersion!==1)return{ok:false,errors:['schemaVersion do Projeto Cardio deve ser 1.']}; if(cardio.goal!=='first-5k')return{ok:false,errors:['O Projeto Cardio precisa usar a meta first-5k.']}; if(!Array.isArray(cardio.weeks)||cardio.weeks.length===0)return{ok:false,errors:['O Projeto Cardio não possui semanas válidas.']}; const errors:string[]=[]; const schedule=cardio.weeks.flatMap((rawWeek,weekIndex)=>{if(!isRecord(rawWeek)){errors.push(`Semana ${weekIndex+1} é inválida.`);return [];} const week=rawWeek as RawCardioWeek; const weekNumber=typeof week.week==='number'&&Number.isInteger(week.week)?week.week:weekIndex+1; if(!Array.isArray(week.sessions)||week.sessions.length===0){errors.push(`Semana ${weekNumber} não possui sessões.`);return [];} return week.sessions.flatMap((rawSession,sessionIndex)=>toCardioSession(rawSession,weekNumber,sessionIndex,errors));}); if(errors.length||schedule.length===0)return{ok:false,errors:errors.length?errors:['Nenhuma sessão de cardio válida foi encontrada.']}; const project=activePlan.project??{name:activePlan.name,objective:activePlan.description??'Projeto TITAN'}; return{ok:true,plan:{...activePlan,project:{...project,cardioGoal:typeof cardio.name==='string'&&cardio.name.trim()?cardio.name.trim():'Primeiros 5 km',cardioSchedule:schedule}}}; }
function toCardioSession(value:unknown,week:number,index:number,errors:string[]):TitanCardioSession[]{if(!isRecord(value)){errors.push(`Semana ${week}, sessão ${index+1} é inválida.`);return [];} const session=value as RawCardioSession; const title=readString(session.title); const id=readString(session.id)||`cardio-w${week}-${index+1}`; const durationMinutes=typeof session.durationMinutes==='number'&&Number.isFinite(session.durationMinutes)?session.durationMinutes:0; const rawType=readString(session.type) as TitanCardioSession['type']; if(!title||durationMinutes<=0||!CARDIO_TYPES.includes(rawType)){errors.push(`Semana ${week}, sessão ${index+1} possui dados inválidos.`);return [];} const day=inferDay(title,index),description=readString(session.description),target=readString(session.target); return[{id:`${id}-w${week}`,day,startTime:'17:00',title:`Semana ${week} — ${title}`,type:rawType,durationMinutes,week,phase:`Semana ${week}`,goal:target||description||'Progressão para 5 km',instructions:[description,target].filter(Boolean)}];}
function inferDay(title:string,index:number){const normalized=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(normalized.includes('domingo'))return'Domingo';if(normalized.includes('segunda'))return'Segunda';if(normalized.includes('terca'))return'Terça';if(normalized.includes('quarta'))return'Quarta';if(normalized.includes('quinta'))return'Quinta';if(normalized.includes('sexta'))return'Sexta';if(normalized.includes('sabado'))return'Sábado';return['Domingo','Terça','Quarta','Sexta'][index]??'Cardio';}
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);} function readString(value:unknown){return typeof value==='string'?value.trim():'';}
