import exercisesJson from './exercises.json';
import programsJson from './programs.json';
import assessmentsJson from './assessments.json';
import { validateContent, type RawContent } from './validate';
import { exercises, programs, assessments } from './index';

const raw = (): RawContent =>
  structuredClone({
    exercises: exercisesJson,
    programs: programsJson,
    assessments: assessmentsJson,
  });

describe('content files', () => {
  it('are all valid, with unique ids and no broken references', () => {
    expect(validateContent(raw())).toEqual([]);
  });

  it('every exercise has at least one cue and one caution', () => {
    for (const e of exercises) {
      expect(e.cues.length, e.id).toBeGreaterThan(0);
      expect(e.cautions.length, e.id).toBeGreaterThan(0);
    }
  });

  it('has the seed programs and self-tests from the brief', () => {
    expect(programs.map((p) => p.id)).toEqual([
      'rotator-reset',
      'overhead-unlock',
      'hip-opener',
      'joint-health-daily',
      'warm-up-primer',
    ]);
    expect(assessments).toHaveLength(9);
  });
});

describe('validateContent catches mistakes', () => {
  it('a program pointing at a missing exercise', () => {
    const c = raw();
    (c.programs as typeof programsJson)[0]!.sessions[0]!.blocks[0]!.items[0]!.exerciseId =
      'no-such-exercise';
    expect(validateContent(c)).toEqual([
      'programs.json: "rotator-reset" › "rotator-reset-a" uses missing exercise "no-such-exercise"',
    ]);
  });

  it('an alternative that does not exist', () => {
    const c = raw();
    (c.exercises as typeof exercisesJson)[1]!.alternatives = ['ghost'];
    expect(validateContent(c)).toEqual([
      'exercises.json: "cable-er-0" alternative "ghost" does not exist',
    ]);
  });

  it('duplicate exercise ids', () => {
    const c = raw();
    const list = c.exercises as typeof exercisesJson;
    list.push(structuredClone(list[0]!));
    expect(validateContent(c)).toContain('exercises.json: duplicate id "shoulder-cars"');
  });

  it('schema errors such as a missing caution or an unknown equipment id', () => {
    const c = raw();
    const list = c.exercises as Array<Record<string, unknown>>;
    list[0]!.cautions = [];
    list[1]!.equipment = ['trampoline'];
    const errors = validateContent(c);
    expect(errors.some((e) => e.includes('[0.cautions]'))).toBe(true);
    expect(errors.some((e) => e.includes('[1.equipment.0]'))).toBe(true);
  });

  it('a score test without one label per score', () => {
    const c = raw();
    const wall = (c.assessments as Array<{ id: string; measure: { scoreLabels?: string[] } }>).find(
      (a) => a.id === 'wall-flexion',
    )!;
    wall.measure.scoreLabels = ['only one'];
    expect(validateContent(c)).toEqual([
      'assessments.json: [3] score tests need one scoreLabel per score',
    ]);
  });
});
