import { useMemo, useState } from 'react';
import type { TitanCatalogExercise, TitanEquipment } from './catalog';
import { ExerciseMotionVisual } from './ExerciseMotionVisual';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';
import { EXERCISE_LIBRARY_MUSCLES, TITAN_FULL_EXERCISE_CATALOG, filterExerciseLibrary } from './library';
import { getCatalogExerciseVideo, getVideoCoverage } from './videoRegistry';

const EQUIPMENT: Array<[TitanEquipment | 'all', string]> = [['all','Todos'],['machine','Máquina'],['cable','Cabo'],['dumbbell','Halteres'],['barbell','Barra'],['bodyweight','Peso corporal']];

export function ExerciseLibraryPage() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [equipment, setEquipment] = useState<TitanEquipment | 'all'>('all');
  const [experience, setExperience] = useState<TitanCatalogExercise['minExperience'] | 'all'>('all');
  const [selected, setSelected] = useState<TitanCatalogExercise | null>(null);
  const results = useMemo(() => filterExerciseLibrary({ query, muscle, equipment, experience }), [query, muscle, equipment, experience]);
  const coverage = useMemo(() => getVideoCoverage(TITAN_FULL_EXERCISE_CATALOG), []);

  if (selected) return <ExerciseDetail exercise={selected} onBack={() => setSelected(null)} />;

  return <section className="exercise-library-page" aria-label="Biblioteca TITAN de exercícios">
    <div className="library-hero"><div><span className="eyebrow">BIBLIOTECA TITAN</span><h3>Exercícios</h3><p>{TITAN_FULL_EXERCISE_CATALOG.length} exercícios estruturados para consulta e prescrição.</p><small className="library-video-coverage">Vídeos demonstrativos: {coverage.covered}/{coverage.total} · expansão em andamento</small></div><span className="library-count">{results.length}</span></div>
    <label className="library-search"><span>Buscar exercício</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: supino, costas, tríceps..." /></label>
    <div className="library-filter-grid"><label>Grupo muscular<select value={muscle} onChange={(event) => setMuscle(event.target.value)}><option value="all">Todos</option>{EXERCISE_LIBRARY_MUSCLES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Nível<select value={experience} onChange={(event) => setExperience(event.target.value as TitanCatalogExercise['minExperience'] | 'all')}><option value="all">Todos</option><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></label></div>
    <div className="library-equipment-chips" role="group" aria-label="Filtrar por equipamento">{EQUIPMENT.map(([value,label]) => <button type="button" key={value} className={equipment===value?'active':''} onClick={() => setEquipment(value)}>{label}</button>)}</div>
    {results.length ? <div className="library-list">{results.map((exercise) => { const hasVideo=Boolean(getCatalogExerciseVideo(exercise)); return <button type="button" className="library-exercise-card" key={exercise.id} onClick={() => setSelected(exercise)}><ExerciseMotionVisual exercise={exercise} compact /><div className="library-card-copy"><strong>{exercise.name}</strong><small>{exercise.primaryMuscle}{exercise.secondaryMuscles.length ? ` · ${exercise.secondaryMuscles.join(', ')}` : ''}</small><div className="library-card-meta"><span>{exercise.repRange[0]}–{exercise.repRange[1]}</span><span>RIR {exercise.defaultRir}</span><span>{equipmentLabel(exercise.equipment[0])}</span>{hasVideo && <span className="library-video-badge">▶ Vídeo</span>}</div></div><span className="programming-chevron">›</span></button>; })}</div> : <div className="library-empty"><strong>Nenhum exercício encontrado</strong><p>Ajuste a busca ou os filtros.</p></div>}
  </section>;
}

function ExerciseDetail({ exercise, onBack }: { exercise: TitanCatalogExercise; onBack: () => void }) {
  return <section className="library-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à biblioteca</button><ExerciseVideoPlayer exercise={exercise} /><div className="library-detail-hero"><span className="eyebrow">{exercise.primaryMuscle.toUpperCase()}</span><h2>{exercise.name}</h2><p>{exercise.secondaryMuscles.length ? `Auxiliares: ${exercise.secondaryMuscles.join(', ')}` : 'Exercício focado no grupo principal.'}</p><div className="library-detail-metrics"><span><small>Repetições</small><strong>{exercise.repRange[0]}–{exercise.repRange[1]}</strong></span><span><small>RIR base</small><strong>{exercise.defaultRir}</strong></span><span><small>Descanso</small><strong>{exercise.restSeconds}s</strong></span></div></div><div className="library-detail-grid"><Info title="Equipamento" value={exercise.equipment.map(equipmentLabel).join(' · ')} /><Info title="Nível mínimo" value={experienceLabel(exercise.minExperience)} /><Info title="Padrão" value={patternLabel(exercise.pattern)} /></div><div className="library-guide-card"><span className="eyebrow">EXECUÇÃO</span><p>{exercise.technique}</p></div><div className="library-guide-card"><span className="eyebrow">ERROS COMUNS</span><ul>{exercise.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></div>{exercise.substitutions.length > 0 && <div className="library-guide-card"><span className="eyebrow">SUBSTITUIÇÕES</span><div className="library-substitutions">{exercise.substitutions.map((id) => { const substitute=TITAN_FULL_EXERCISE_CATALOG.find((item)=>item.id===id); return <span key={id}>{substitute?.name ?? id}</span>; })}</div></div>}</section>;
}
function Info({title,value}:{title:string;value:string}){return <div className="library-info"><small>{title}</small><strong>{value}</strong></div>}
function equipmentLabel(value:TitanEquipment){if(value==='machine')return 'Máquina';if(value==='cable')return 'Cabo';if(value==='dumbbell')return 'Halteres';if(value==='barbell')return 'Barra';return 'Peso corporal';}
function experienceLabel(value:TitanCatalogExercise['minExperience']){if(value==='intermediate')return 'Intermediário';if(value==='advanced')return 'Avançado';return 'Iniciante';}
function patternLabel(value:TitanCatalogExercise['pattern']){const labels:Record<TitanCatalogExercise['pattern'],string>={'horizontal-push':'Empurrar horizontal','vertical-push':'Empurrar vertical','horizontal-pull':'Puxar horizontal','vertical-pull':'Puxar vertical','squat':'Agachamento','hinge':'Dobradiça de quadril','knee-flexion':'Flexão de joelho','elbow-flexion':'Flexão de cotovelo','elbow-extension':'Extensão de cotovelo','calf':'Panturrilha','core':'Core'};return labels[value];}
