import { z } from 'zod';

const nonEmptyId = z.string().trim().min(1, 'ID é obrigatório');
const exerciseSchema = z.object({
  id: nonEmptyId, exerciseId: nonEmptyId, name: z.string().trim().min(1), muscleGroup: z.string().trim().min(1),
  secondaryMuscles: z.array(z.string().min(1)).optional(), equipment: z.string().min(1).optional(), sequence: z.number().int().nonnegative(),
  sets: z.number().int().min(1), minReps: z.number().int().nonnegative(), maxReps: z.number().int().nonnegative(),
  targetRir: z.number().int().nonnegative().optional(), restSeconds: z.number().int().nonnegative(), tempo: z.string().optional(), technique: z.string().optional(),
  commonErrors: z.array(z.string().min(1)).optional(), alternatives: z.array(z.string().min(1)).optional(), notes: z.string().optional()
}).strict().refine((value) => value.minReps <= value.maxReps, { message: 'minReps não pode ser maior que maxReps', path: ['minReps'] });

const sessionSchema = z.object({
  id: nonEmptyId, name: z.string().trim().min(1), dayOfWeek: z.number().int().min(0).max(6).optional(), sequence: z.number().int().nonnegative(),
  estimatedDurationMinutes: z.number().int().positive().optional(), focus: z.string().trim().min(1), exercises: z.array(exerciseSchema).min(1, 'A sessão não pode estar vazia')
}).strict().superRefine((value, ctx) => {
  if (new Set(value.exercises.map((item) => item.id)).size !== value.exercises.length) ctx.addIssue({ code: 'custom', message: 'IDs de exercícios duplicados', path: ['exercises'] });
  if (new Set(value.exercises.map((item) => item.sequence)).size !== value.exercises.length) ctx.addIssue({ code: 'custom', message: 'Sequência de exercícios duplicada', path: ['exercises'] });
});

export const titanEnvelopeSchema = z.object({
  schema: z.literal('TITAN_FIT', { errorMap: () => ({ message: 'Schema desconhecido' }) }), schemaVersion: z.literal('1.0'), type: z.literal('training_plan'),
  title: z.string().trim().min(1), author: z.string().trim().min(1), createdAt: z.string().datetime({ offset: true }),
  payload: z.object({ planId: nonEmptyId, name: z.string().trim().min(1), description: z.string().optional(), durationWeeks: z.number().int().positive().optional(), effectiveFrom: z.string().date().optional(), sessions: z.array(sessionSchema).min(1) }).strict()
    .superRefine((value, ctx) => {
      if (new Set(value.sessions.map((item) => item.id)).size !== value.sessions.length) ctx.addIssue({ code: 'custom', message: 'IDs de sessões duplicados', path: ['sessions'] });
      if (new Set(value.sessions.map((item) => item.sequence)).size !== value.sessions.length) ctx.addIssue({ code: 'custom', message: 'Sequência de sessões duplicada', path: ['sessions'] });
      const exerciseIds = value.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.id));
      if (new Set(exerciseIds).size !== exerciseIds.length) ctx.addIssue({ code: 'custom', message: 'IDs de itens de exercício duplicados na ficha', path: ['sessions'] });
    })
}).strict();

export type TitanEnvelopeInput = z.infer<typeof titanEnvelopeSchema>;
