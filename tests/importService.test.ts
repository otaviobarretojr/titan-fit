import { afterEach, describe, expect, it } from 'vitest';
import { TitanFitDatabase } from '../src/database/database';
import { importTrainingPlan, parseTitanFile } from '../src/modules/import/importService';
import type { TitanEnvelope } from '../src/types/training';

const envelope: TitanEnvelope={schema:'TITAN_FIT',schemaVersion:'1.0',type:'training_plan',title:'Ficha',author:'Coach',createdAt:'2026-08-06T00:00:00.000Z',payload:{planId:'new',name:'Nova',sessions:[{id:'session-new',name:'A',sequence:0,focus:'Peito',exercises:[{id:'item-new',exerciseId:'supino',name:'Supino',muscleGroup:'Peito',sequence:0,sets:3,minReps:8,maxReps:12,restSeconds:90}]}]}};
let database: TitanFitDatabase;
afterEach(async()=>{if(database){database.close();await database.delete();}});
describe('importação',()=>{
  it('rejeita extensão incorreta e JSON inválido',async()=>{await expect(parseTitanFile(new File(['{}'],'ficha.json'))).rejects.toThrow('extensão');await expect(parseTitanFile(new File(['{'],'ficha.titan.json'))).rejects.toThrow('JSON inválido');});
  it('arquiva o plano anterior sem apagar execuções',async()=>{database=new TitanFitDatabase(`test-${crypto.randomUUID()}`);await database.trainingPlans.add({...envelope.payload,id:'old',name:'Antiga',author:'Coach',createdAt:envelope.createdAt,importedAt:envelope.createdAt,status:'active',source:{...envelope,payload:{...envelope.payload,planId:'old'}}});await database.trainingSessions.add({id:'execution-1',planId:'old',startedAt:envelope.createdAt});await importTrainingPlan(envelope,'nova.titan.json',database);expect((await database.trainingPlans.get('old'))?.status).toBe('archived');expect((await database.trainingPlans.get('new'))?.status).toBe('active');expect(await database.trainingSessions.count()).toBe(1);});
});
