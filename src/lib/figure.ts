import type { Arm, Illustration, JointRef, Leg, LimbName, Pose } from '../content/schema';

/** Body segment lengths in the 200 × 140 drawing box. */
export const BODY = {
  torso: 38,
  neck: 4,
  headR: 8,
  upperArm: 20,
  forearm: 19,
  thigh: 24,
  shin: 24,
  foot: 7,
} as const;

export type Vec = [number, number];
export type Points = Record<JointRef, Vec> & {
  shoulder: Vec;
  neck: Vec;
  spineCtrl: Vec;
  toeN?: Vec;
  toeF?: Vec;
};

/** A pose with every joint placed, plus each limb's resolved angles (for interpolation). */
export type Resolved = {
  points: Points;
  limbs: Record<LimbName, { a: [number, number]; len: [number, number] }>;
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dir = (angle: number, length = 1): Vec => [
  Math.cos(rad(angle)) * length,
  Math.sin(rad(angle)) * length,
];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const angleOf = (v: Vec) => deg(Math.atan2(v[1], v[0]));

/**
 * Two-bone inverse kinematics. Returns the absolute angles of both segments so the end
 * lands on `target` (or as close as the limb reaches).
 */
export function solveTwoBone(
  root: Vec,
  target: Vec,
  l1: number,
  l2: number,
  bend: 1 | -1,
): [number, number] {
  const d = Math.min(Math.max(dist(root, target), Math.abs(l1 - l2) + 1e-6), l1 + l2 - 1e-6);
  const base = angleOf(sub(target, root));
  const inner = deg(Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const a1 = base + bend * inner;
  const joint = add(root, dir(a1, l1));
  const end = add(root, dir(base, d));
  return [a1, angleOf(sub(end, joint))];
}

const LIMB_INFO = {
  armN: { root: 'shoulderN', mid: 'elbowN', end: 'handN', l1: BODY.upperArm, l2: BODY.forearm },
  armF: { root: 'shoulderF', mid: 'elbowF', end: 'handF', l1: BODY.upperArm, l2: BODY.forearm },
  legN: { root: 'hipN', mid: 'kneeN', end: 'footN', l1: BODY.thigh, l2: BODY.shin },
  legF: { root: 'hipF', mid: 'kneeF', end: 'footF', l1: BODY.thigh, l2: BODY.shin },
} as const satisfies Record<
  LimbName,
  { root: JointRef; mid: JointRef; end: JointRef; l1: number; l2: number }
>;

/** Place every joint of a pose. Throws if a limb reaches for a joint that can't be placed. */
export function resolvePose(pose: Pose, face: 1 | -1 = 1): Resolved {
  const tl = pose.torsoLen ?? 1;
  const hip = pose.hip;
  const shoulder = add(hip, dir(pose.torso, BODY.torso * tl));
  const perp = dir(pose.torso + 90);
  const headDir = pose.torso + (pose.head ?? 0);
  const mid = lerpVec(hip, shoulder, 0.5);
  const pts: Partial<Points> = {
    hip,
    shoulder,
    spineCtrl: add(mid, scale(perp, pose.bend ?? 0)),
    neck: add(shoulder, dir(headDir, BODY.neck * tl)),
    head: add(shoulder, dir(headDir, (BODY.neck + BODY.headR) * tl)),
    shoulderN: add(shoulder, scale(perp, pose.sw ?? 0)),
    shoulderF: sub(shoulder, scale(perp, pose.sw ?? 0)),
    hipN: add(hip, scale(perp, pose.hw ?? 0)),
    hipF: sub(hip, scale(perp, pose.hw ?? 0)),
  };
  const limbs = {} as Resolved['limbs'];

  const pending: LimbName[] = ['legN', 'legF', 'armF', 'armN'];
  for (let pass = 0; pending.length && pass < 4; pass++) {
    for (const name of [...pending]) {
      const spec: Arm | Leg = pose[name];
      const info = LIMB_INFO[name];
      const root = pts[info.root]!;
      let a: [number, number];
      let len: [number, number] = [1, 1];
      if ('a' in spec) {
        a = spec.a;
        len = spec.len ?? [1, 1];
      } else {
        const target = typeof spec.to === 'string' ? pts[spec.to] : spec.to;
        if (!target) continue; // depends on a limb not placed yet
        a = solveTwoBone(root, target, info.l1, info.l2, spec.bend);
      }
      const midPt = add(root, dir(a[0], info.l1 * len[0]));
      pts[info.mid] = midPt;
      pts[info.end] = add(midPt, dir(a[1], info.l2 * len[1]));
      limbs[name] = { a, len };
      pending.splice(pending.indexOf(name), 1);
    }
  }
  if (pending.length) throw new Error(`Could not place ${pending.join(', ')} (circular reference)`);

  for (const [name, toe] of [
    ['legN', 'toeN'],
    ['legF', 'toeF'],
  ] as const) {
    const foot = pose[name].foot;
    if (foot === null) continue;
    const angle = foot ?? limbs[name].a[1] - 90 * face;
    pts[toe] = add(pts[LIMB_INFO[name].end]!, dir(angle, BODY.foot));
  }
  return { points: pts as Points, limbs };
}

/** Blend two poses. Limbs that reach for the same kind of target blend the target, so planted feet stay put. */
export function interpolatePose(a: Pose, b: Pose, t: number, ra: Resolved, rb: Resolved): Pose {
  const num = (x: number | undefined, y: number | undefined, d: number) => lerp(x ?? d, y ?? d, t);
  const limb = <L extends Arm | Leg>(name: LimbName, la: L, lb: L): L => {
    const foot =
      'foot' in la || 'foot' in lb
        ? (la as Leg).foot === null || (lb as Leg).foot === null
          ? null
          : (la as Leg).foot !== undefined && (lb as Leg).foot !== undefined
            ? lerp((la as Leg).foot!, (lb as Leg).foot!, t)
            : undefined
        : undefined;
    const withFoot = <T extends object>(o: T) => (foot === undefined ? o : { ...o, foot });
    if ('to' in la && 'to' in lb) {
      if (typeof la.to === 'string' && la.to === lb.to) return withFoot({ ...la }) as L;
      if (typeof la.to !== 'string' && typeof lb.to !== 'string')
        return withFoot({ to: lerpVec(la.to, lb.to, t), bend: la.bend }) as L;
    }
    // Mixed or angle-based: blend the resolved angles. Reached limbs take the short way round.
    const A = ra.limbs[name];
    const B = rb.limbs[name];
    const short = 'to' in la || 'to' in lb;
    const angle = (x: number, y: number) => {
      if (!short) return lerp(x, y, t);
      const d = ((((y - x) % 360) + 540) % 360) - 180;
      return x + d * t;
    };
    return withFoot({
      a: [angle(A.a[0], B.a[0]), angle(A.a[1], B.a[1])],
      len: [lerp(A.len[0], B.len[0], t), lerp(A.len[1], B.len[1], t)],
    }) as L;
  };
  return {
    hip: lerpVec(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    torsoLen: num(a.torsoLen, b.torsoLen, 1),
    bend: num(a.bend, b.bend, 0),
    head: num(a.head, b.head, 0),
    sw: num(a.sw, b.sw, 0),
    hw: num(a.hw, b.hw, 0),
    armN: limb('armN', a.armN, b.armN),
    armF: limb('armF', a.armF, b.armF),
    legN: limb('legN', a.legN, b.legN),
    legF: limb('legF', a.legF, b.legF),
  };
}

/** Move `b`'s authored angles by whole turns so they sit closest to `a`'s (for cycling back to frame 0). */
function unwrapTowards(a: Pose, b: Pose): Pose {
  const near = (from: number, to: number) => to + 360 * Math.round((from - to) / 360);
  const fix = <L extends Arm | Leg>(la: L, lb: L): L =>
    'a' in la && 'a' in lb
      ? ({ ...lb, a: [near(la.a[0], lb.a[0]), near(la.a[1], lb.a[1])] } as L)
      : lb;
  return {
    ...b,
    torso: near(a.torso, b.torso),
    armN: fix(a.armN, b.armN),
    armF: fix(a.armF, b.armF),
    legN: fix(a.legN, b.legN),
    legF: fix(a.legF, b.legF),
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export type Timeline = { frames: Resolved[]; seconds: number };

/**
 * Sample the whole animation: each move between keyframes is eased over `steps` samples,
 * with a short pause on each keyframe.
 */
export function buildTimeline(ill: Illustration, steps = 10, hold = 3): Timeline {
  const face = ill.face ?? 1;
  const keys = ill.frames;
  if (keys.length === 1) return { frames: [resolvePose(keys[0]!, face)], seconds: 0 };

  const order: Pose[] =
    ill.loop === 'cycle'
      ? [...keys, unwrapTowards(keys[keys.length - 1]!, keys[0]!)]
      : [...keys, ...keys.slice(0, -1).reverse()];

  const frames: Resolved[] = [];
  for (let k = 0; k < order.length - 1; k++) {
    const a = order[k]!;
    const b = order[k + 1]!;
    const ra = resolvePose(a, face);
    const rb = resolvePose(b, face);
    for (let h = 0; h < hold; h++) frames.push(ra);
    for (let s = 0; s < steps; s++) {
      const t = smooth(s / steps);
      frames.push(s === 0 ? ra : resolvePose(interpolatePose(a, b, t, ra, rb), face));
    }
  }
  frames.push(frames[0]!); // close the loop
  return { frames, seconds: (order.length - 1) * 1.3 };
}

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (v: Vec) => `${f(v[0])} ${f(v[1])}`;

/** SVG path strings for each body part of a resolved pose. */
export function bodyPaths(r: Resolved) {
  const p = r.points;
  const leg = (h: Vec, k: Vec, a: Vec, toe?: Vec) =>
    `M${pt(h)}L${pt(k)}L${pt(a)}${toe ? `L${pt(toe)}` : ''}`;
  return {
    legF: leg(p.hipF, p.kneeF, p.footF, p.toeF),
    armF: `M${pt(p.shoulderF)}L${pt(p.elbowF)}L${pt(p.handF)}`,
    torso: `M${pt(p.hip)}Q${pt(p.spineCtrl)} ${pt(p.shoulder)}L${pt(p.neck)}`,
    shoulders: `M${pt(p.shoulderF)}L${pt(p.shoulderN)}`,
    hips: `M${pt(p.hipF)}L${pt(p.hipN)}`,
    legN: leg(p.hipN, p.kneeN, p.footN, p.toeN),
    armN: `M${pt(p.shoulderN)}L${pt(p.elbowN)}L${pt(p.handN)}`,
  };
}
export type BodyPart = keyof ReturnType<typeof bodyPaths>;

export const fmt = f;
