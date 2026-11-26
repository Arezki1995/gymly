import exercisesJson from './exercises.json';
import programsJson from './programs.json';
import assessmentsJson from './assessments.json';
import illustrationsJson from './illustrations.json';
import {
  AssessmentsFile,
  ExercisesFile,
  IllustrationsFile,
  ProgramsFile,
  type Assessment,
  type Exercise,
  type Illustration,
  type Program,
} from './schema';

// Content is validated at build time (vite.config.ts) and in tests; parsing here
// gives us correctly typed data.
export const exercises: Exercise[] = ExercisesFile.parse(exercisesJson);
export const programs: Program[] = ProgramsFile.parse(programsJson);
export const assessments: Assessment[] = AssessmentsFile.parse(assessmentsJson);

export const illustrations: Illustration[] = IllustrationsFile.parse(illustrationsJson);

const exerciseById = new Map(exercises.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return exerciseById.get(id);
}

const illustrationByExercise = new Map(illustrations.map((i) => [i.exerciseId, i]));

export function getIllustration(exerciseId: string): Illustration | undefined {
  return illustrationByExercise.get(exerciseId);
}
