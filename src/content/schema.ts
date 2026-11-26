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

// ---------------------------------------------------------------------------
// Illustrations: simple stick figures drawn in-app from pose data.
// Coordinates are in a 200 × 140 box, y pointing down. Angles are in degrees on
// screen: 0 = right, 90 = down, -90 = up, 180 = left.
// ---------------------------------------------------------------------------

const Vec = z.tuple([z.number(), z.number()]);

export const JOINT_REFS = [
  'head',
  'hip',
  'shoulderN',
  'shoulderF',
  'elbowN',
  'elbowF',
  'handN',
  'handF',
  'hipN',
  'hipF',
  'kneeN',
  'kneeF',
  'footN',
  'footF',
] as const;
export const JointRef = z.enum(JOINT_REFS);
export type JointRef = z.infer<typeof JointRef>;

/** A limb given by the absolute angle of each segment, with optional length scales (foreshortening). */
const LimbAngles = {
  a: z.tuple([z.number(), z.number()]),
  len: z.tuple([z.number().positive(), z.number().positive()]).optional(),
};
/**
 * A limb that reaches for a point (two-bone IK). `bend: 1` puts the elbow/knee on the side
 * you get by turning the root→target direction 90° clockwise on screen; `-1` the other side.
 */
const LimbReach = {
  to: z.union([Vec, JointRef]),
  bend: z.union([z.literal(1), z.literal(-1)]),
};
/** Foot angle; omit for "perpendicular to the shin, facing forward", null to hide. */
const Foot = { foot: z.number().nullable().optional() };

export const Arm = z.union([z.strictObject(LimbAngles), z.strictObject(LimbReach)]);
export type Arm = z.infer<typeof Arm>;
export const Leg = z.union([
  z.strictObject({ ...LimbAngles, ...Foot }),
  z.strictObject({ ...LimbReach, ...Foot }),
]);
export type Leg = z.infer<typeof Leg>;

export const Pose = z.strictObject({
  hip: Vec,
  /** Direction from hip to shoulders. Upright = -90. */
  torso: z.number(),
  /** Length scale for torso and neck (e.g. 0.15 for a top-down view of a sitting person). */
  torsoLen: z.number().positive().optional(),
  /** Spine curve in px, towards the side 90° clockwise from the torso direction. */
  bend: z.number().optional(),
  /** Head tilt relative to the torso. */
  head: z.number().optional(),
  /** Half shoulder / hip width, for front and top views. "N" limbs sit on the +side. */
  sw: z.number().nonnegative().optional(),
  hw: z.number().nonnegative().optional(),
  armN: Arm,
  armF: Arm,
  legN: Leg,
  legF: Leg,
});
export type Pose = z.infer<typeof Pose>;

export const Prop = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('floor'), y: z.number() }),
  z.strictObject({ type: z.literal('mat'), x1: z.number(), x2: z.number(), y: z.number() }),
  z.strictObject({
    type: z.literal('matTop'),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  z.strictObject({
    type: z.literal('bench'),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    floor: z.number(),
  }),
  z.strictObject({ type: z.literal('inclineBench'), from: Vec, to: Vec, floor: z.number() }),
  z.strictObject({ type: z.literal('wall'), x: z.number(), floor: z.number() }),
  z.strictObject({
    type: z.literal('panel'),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  z.strictObject({ type: z.literal('bar'), x1: z.number(), x2: z.number(), y: z.number() }),
  z.strictObject({ type: z.literal('post'), x: z.number(), y: z.number(), floor: z.number() }),
  z.strictObject({ type: z.literal('roller'), x: z.number(), y: z.number(), r: z.number() }),
  z.strictObject({
    type: z.literal('cable'),
    x: z.number(),
    anchorY: z.number(),
    floor: z.number(),
    attach: JointRef,
  }),
  z.strictObject({ type: z.literal('dumbbell'), attach: JointRef }),
  z.strictObject({ type: z.literal('kettlebell'), attach: JointRef }),
]);
export type Prop = z.infer<typeof Prop>;

export const LIMBS = ['armN', 'armF', 'legN', 'legF'] as const;
export type LimbName = (typeof LIMBS)[number];

export const Illustration = z
  .strictObject({
    exerciseId: Id,
    /** "side" draws the far limbs fainter; "front" and "top" draw both sides the same. */
    view: z.enum(['side', 'front', 'top']),
    /** Which way the figure faces (for default foot direction). */
    face: z.union([z.literal(1), z.literal(-1)]).optional(),
    /** Limbs drawn in the accent colour: the ones doing the work. */
    highlight: z.array(z.enum(LIMBS)).optional(),
    props: z.array(Prop),
    frames: z.array(Pose).min(1),
    /** pingpong: 0→n→0. cycle: 0→n→0 continuing in the same direction (for circles). */
    loop: z.enum(['pingpong', 'cycle']).optional(),
    /** Frame drawn solid in the still picture (frame 0 is drawn faint behind it). Default: last. */
    staticFrame: z.number().int().nonnegative().optional(),
    /** Frame drawn faint behind it in the still picture. Default: 0. */
    ghostFrame: z.number().int().nonnegative().optional(),
  })
  .superRefine((ill, ctx) => {
    for (const key of ['staticFrame', 'ghostFrame'] as const) {
      const v = ill[key];
      if (v !== undefined && v >= ill.frames.length)
        ctx.addIssue({ code: 'custom', message: `${key} is out of range` });
    }
  });
export type Illustration = z.infer<typeof Illustration>;

export const IllustrationsFile = z.array(Illustration);
