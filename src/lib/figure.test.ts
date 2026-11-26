import type { Illustration, Pose } from '../content/schema';
import { BODY, buildTimeline, dist, resolvePose, solveTwoBone, type Resolved } from './figure';

const G = 124;
const standing = (over: Partial<Pose> = {}): Pose => ({
  hip: [100, 76],
  torso: -90,
  armN: { a: [90, 90] },
  armF: { a: [90, 90] },
  legN: { to: [100, G], bend: -1 },
  legF: { to: [100, G], bend: -1 },
  ...over,
});

const close = (a: [number, number], b: [number, number], eps = 0.01) =>
  expect(dist(a, b)).toBeLessThan(eps);

function expectBodyIntact(r: Resolved) {
  const p = r.points;
  const len = r.limbs;
  const check = (a: [number, number], b: [number, number], expected: number) =>
    expect(dist(a, b)).toBeCloseTo(expected, 3);
  check(p.shoulderN, p.elbowN, BODY.upperArm * len.armN.len[0]);
  check(p.elbowN, p.handN, BODY.forearm * len.armN.len[1]);
  check(p.hipN, p.kneeN, BODY.thigh * len.legN.len[0]);
  check(p.kneeN, p.footN, BODY.shin * len.legN.len[1]);
  check(p.hipF, p.kneeF, BODY.thigh * len.legF.len[0]);
  check(p.kneeF, p.footF, BODY.shin * len.legF.len[1]);
}

describe('solveTwoBone', () => {
  it('reaches a reachable target, with the joint on the requested side', () => {
    const root: [number, number] = [0, 0];
    const [a1, a2] = solveTwoBone(root, [0, 30], 20, 20, 1);
    const joint: [number, number] = [
      Math.cos((a1 * Math.PI) / 180) * 20,
      Math.sin((a1 * Math.PI) / 180) * 20,
    ];
    const end: [number, number] = [
      joint[0] + Math.cos((a2 * Math.PI) / 180) * 20,
      joint[1] + Math.sin((a2 * Math.PI) / 180) * 20,
    ];
    close(end, [0, 30]);
    // bend 1 = clockwise from "down" = to the left
    expect(joint[0]).toBeLessThan(0);
    const [b1] = solveTwoBone(root, [0, 30], 20, 20, -1);
    expect(Math.cos((b1 * Math.PI) / 180)).toBeGreaterThan(0);
  });

  it('straightens towards a target that is too far away', () => {
    const [a1, a2] = solveTwoBone([0, 0], [100, 0], 20, 20, 1);
    expect(Math.abs(a1)).toBeLessThan(1);
    expect(Math.abs(a2)).toBeLessThan(1);
  });
});

describe('resolvePose', () => {
  it('stands a figure with feet on the ground and the head above the shoulders', () => {
    const r = resolvePose(standing());
    close(r.points.footN, [100, G], 0.05);
    close(r.points.shoulder, [100, 76 - BODY.torso]);
    expect(r.points.head[1]).toBeLessThan(r.points.shoulder[1]);
    expect(r.points.toeN![0]).toBeGreaterThan(r.points.footN[0]); // faces right
    expectBodyIntact(r);
  });

  it('lets a hand reach for another joint', () => {
    const r = resolvePose(standing({ armF: { to: 'elbowN', bend: 1 } }));
    close(r.points.handF, r.points.elbowN, 0.05);
  });

  it('hides the foot with foot: null', () => {
    const r = resolvePose(standing({ legN: { a: [90, 90], foot: null } }));
    expect(r.points.toeN).toBeUndefined();
  });

  it('reports circular references', () => {
    expect(() =>
      resolvePose(standing({ armN: { to: 'handF', bend: 1 }, armF: { to: 'handN', bend: 1 } })),
    ).toThrow(/circular/);
  });
});

describe('buildTimeline', () => {
  const ill = (frames: Pose[], loop?: 'pingpong' | 'cycle'): Illustration => ({
    exerciseId: 'x',
    view: 'side',
    props: [],
    frames,
    loop,
  });

  it('keeps planted feet planted and limbs intact while the hips move', () => {
    const tl = buildTimeline(ill([standing(), standing({ hip: [104, 86] })]));
    for (const fr of tl.frames) {
      close(fr.points.footN, [100, G], 0.05);
      expectBodyIntact(fr);
    }
  });

  it('pingpong returns to the start; a single frame is static', () => {
    const tl = buildTimeline(ill([standing(), standing({ armN: { a: [0, 0] } })]));
    expect(tl.frames.at(0)).toEqual(tl.frames.at(-1));
    expect(tl.seconds).toBeGreaterThan(0);
    expect(buildTimeline(ill([standing()]))).toMatchObject({ seconds: 0 });
  });

  it('cycle keeps turning the same way back to the start (arm circles)', () => {
    const frames = [90, 0, -90, -180].map((a) => standing({ armN: { a: [a, a] } }));
    const tl = buildTimeline(ill(frames, 'cycle'));
    // the hand never jumps: each sample is close to the previous one
    for (let i = 1; i < tl.frames.length; i++)
      expect(dist(tl.frames[i]!.points.handN, tl.frames[i - 1]!.points.handN)).toBeLessThan(12);
  });
});
