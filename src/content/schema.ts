import { z } from 'zod';

/** Kebab-case ids, stable forever (may start with a digit, e.g. `90-90-switches`). */
const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case');

export const EQUIPMENT_IDS = [
  'none',
  'mat',
  'foam_roller',
  'dumbbell',
  'kettlebell',
  'cable',
  'bench',
  'box',
  'pullup_bar',
  'wall',
  'band',
  'dowel',
] as const;
export const EquipmentId = z.enum(EQUIPMENT_IDS);
export type EquipmentId = z.infer<typeof EquipmentId>;

export const AREAS = ['shoulder', 'hip', 'thoracic', 'ankle', 'full-body'] as const;
export const Area = z.enum(AREAS);
export type Area = z.infer<typeof Area>;

export const GOALS = [
  'shoulder-er',
  'shoulder-ir',
  'shoulder-flexion',
  'scapular-control',
  'thoracic-rotation',
  'thoracic-extension',
  'hip-er',
  'hip-ir',
  'hip-flexion',
  'hip-extension',
  'hip-adduction',
  'ankle-dorsiflexion',
  'joint-health',
] as const;
export const Goal = z.enum(GOALS);
export type Goal = z.infer<typeof Goal>;

export const EXERCISE_TYPES = [
  'stretch',
  'active-mobility',
  'strength-mobility',
  'cars',
  'soft-tissue',
] as const;
export const ExerciseType = z.enum(EXERCISE_TYPES);
export type ExerciseType = z.infer<typeof ExerciseType>;

export const LEVELS = [1, 2, 3] as const;
export const Level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Level = z.infer<typeof Level>;

export const Dose = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('reps'), reps: z.number().int().positive() }),
  z.strictObject({ kind: z.literal('hold'), seconds: z.number().int().positive() }),
]);
export type Dose = z.infer<typeof Dose>;

export const Exercise = z.strictObject({
  id: Id,
  name: z.string().min(1),
  area: Area,
  goals: z.array(Goal).min(1),
  type: ExerciseType,
  equipment: z.array(EquipmentId).min(1),
  level: Level,
  unilateral: z.boolean(),
  dose: Dose,
  defaultSets: z.number().int().positive(),
  restSeconds: z.number().int().nonnegative(),
  cues: z.array(z.string().min(1)).min(1).max(4),
  cautions: z.array(z.string().min(1)).min(1),
  alternatives: z.array(Id).optional(),
  videoUrl: z.url().optional(),
});
export type Exercise = z.infer<typeof Exercise>;

export const SessionItem = z.strictObject({
  exerciseId: Id,
  sets: z.number().int().positive().optional(),
  dose: Dose.optional(),
});
export type SessionItem = z.infer<typeof SessionItem>;

export const Session = z.strictObject({
  id: Id,
  name: z.string().min(1),
  estMinutes: z.number().int().positive(),
  blocks: z
    .array(z.strictObject({ title: z.string().min(1), items: z.array(SessionItem).min(1) }))
    .min(1),
});
export type Session = z.infer<typeof Session>;

export const Program = z.strictObject({
  id: Id,
  name: z.string().min(1),
  description: z.string().min(1),
  goals: z.array(Goal).min(1),
  weeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
  sessions: z.array(Session).min(1),
  progression: z.strictObject({
    everyWeeks: z.number().int().positive(),
    rule: z.enum(['add-set', 'add-seconds', 'add-reps', 'level-up']),
  }),
});
export type Program = z.infer<typeof Program>;

export const Assessment = z
  .strictObject({
    id: Id,
    name: z.string().min(1),
    goal: Goal,
    instructions: z.array(z.string().min(1)).min(1),
    measure: z.strictObject({
      kind: z.enum(['degrees', 'cm', 'seconds', 'score']),
      min: z.number(),
      max: z.number(),
      higherIsBetter: z.boolean(),
      target: z.number().optional(),
      /** For `score` tests: one label per score from `min` to `max`. */
      scoreLabels: z.array(z.string().min(1)).optional(),
    }),
    unilateral: z.boolean(),
  })
  .superRefine((a, ctx) => {
    const m = a.measure;
    if (m.min >= m.max) ctx.addIssue({ code: 'custom', message: 'measure.min must be < max' });
    if (m.target !== undefined && (m.target < m.min || m.target > m.max))
      ctx.addIssue({ code: 'custom', message: 'measure.target must be within min..max' });
    if (m.kind === 'score') {
      if (!m.scoreLabels || m.scoreLabels.length !== m.max - m.min + 1)
        ctx.addIssue({ code: 'custom', message: 'score tests need one scoreLabel per score' });
    } else if (m.scoreLabels) {
      ctx.addIssue({ code: 'custom', message: 'scoreLabels only apply to score tests' });
    }
  });
export type Assessment = z.infer<typeof Assessment>;

export const ExercisesFile = z.array(Exercise);
export const ProgramsFile = z.array(Program);
export const AssessmentsFile = z.array(Assessment);
