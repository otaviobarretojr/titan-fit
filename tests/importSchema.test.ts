import { describe, expect, it } from 'vitest';
import { titanEnvelopeSchema } from '../src/modules/import/schema';

const valid = { schema:'TITAN_FIT',schemaVersion:'1.0',type:'training_plan',title:'Ficha',author:'Coach',createdAt:'2026-08-06T00:00:00.000Z',payload:{planId:'p1',name:'Plano',sessions:[{id:'s1',name:'A',sequence:0,focus:'Peito',exercises:[{id:'i1',exerciseId:'supino',name:'Supino',muscleGroup:'Peito',sequence:0,sets:3,minReps:8,maxReps:12,restSeconds:90}]}]}};
describe('contrato TITAN FIT 1.0',()=>{
  it('aceita uma ficha válida',()=>expect(titanEnvelopeSchema.safeParse(valid).success).toBe(true));
  it('rejeita séries menores que um',()=>expect(titanEnvelopeSchema.safeParse({...valid,payload:{...valid.payload,sessions:[{...valid.payload.sessions[0],exercises:[{...valid.payload.sessions[0].exercises[0],sets:0}]}]}}).success).toBe(false));
  it('rejeita intervalo de repetições invertido',()=>expect(titanEnvelopeSchema.safeParse({...valid,payload:{...valid.payload,sessions:[{...valid.payload.sessions[0],exercises:[{...valid.payload.sessions[0].exercises[0],minReps:15,maxReps:8}]}]}}).success).toBe(false));
  it('rejeita sequências duplicadas',()=>expect(titanEnvelopeSchema.safeParse({...valid,payload:{...valid.payload,sessions:[valid.payload.sessions[0],{...valid.payload.sessions[0],id:'s2'}]}}).success).toBe(false));
});
