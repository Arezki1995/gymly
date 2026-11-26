import type { z } from 'zod';
import { AssessmentsFile, ExercisesFile, ProgramsFile } from './schema.ts';

export type RawContent = { exercises: unknown; programs: unknown; assessments: unknown };

function schemaErrors(file: string, schema: z.ZodType, data: unknown): string[] {
  const result = schema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((i) => `${file}: [${i.path.join('.')}] ${i.message}`);
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) (seen.has(id) ? dups : seen).add(id);
  return [...dups];
}

/**
 * Validates all content files: schemas, unique ids and cross-references.
 * Returns a list of human-readable errors (empty when everything is valid).
 * Used by the content test and by the build (see vite.config.ts).
 */
export function validateContent(raw: RawContent): string[] {
  const errors = [
    ...schemaErrors('exercises.json', ExercisesFile, raw.exercises),
    ...schemaErrors('programs.json', ProgramsFile, raw.programs),
    ...schemaErrors('assessments.json', AssessmentsFile, raw.assessments),
  ];
  // Reference checks need well-formed data; stop here if schemas failed.
  if (errors.length) return errors;

  const exercises = ExercisesFile.parse(raw.exercises);
  const programs = ProgramsFile.parse(raw.programs);
  const assessments = AssessmentsFile.parse(raw.assessments);
  const exerciseIds = new Set(exercises.map((e) => e.id));

  for (const id of duplicates(exercises.map((e) => e.id)))
    errors.push(`exercises.json: duplicate id "${id}"`);
  for (const id of duplicates(programs.map((p) => p.id)))
    errors.push(`programs.json: duplicate program id "${id}"`);
  for (const id of duplicates(programs.flatMap((p) => p.sessions.map((s) => s.id))))
    errors.push(`programs.json: duplicate session id "${id}"`);
  for (const id of duplicates(assessments.map((a) => a.id)))
    errors.push(`assessments.json: duplicate id "${id}"`);

  for (const e of exercises) {
    for (const alt of e.alternatives ?? []) {
      if (!exerciseIds.has(alt))
        errors.push(`exercises.json: "${e.id}" alternative "${alt}" does not exist`);
      if (alt === e.id) errors.push(`exercises.json: "${e.id}" lists itself as an alternative`);
    }
    if (e.equipment.includes('none') && e.equipment.length > 1)
      errors.push(`exercises.json: "${e.id}" mixes "none" with other equipment`);
  }

  for (const p of programs)
    for (const s of p.sessions)
      for (const b of s.blocks)
        for (const item of b.items)
          if (!exerciseIds.has(item.exerciseId))
            errors.push(
              `programs.json: "${p.id}" › "${s.id}" uses missing exercise "${item.exerciseId}"`,
            );

  return errors;
}
