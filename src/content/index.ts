import exercisesJson from './exercises.json';
import programsJson from './programs.json';
import assessmentsJson from './assessments.json';
import {
  AssessmentsFile,
  ExercisesFile,
  ProgramsFile,
  type Assessment,
  type Exercise,
  type Program,
} from './schema';

// Content is validated at build time (vite.config.ts) and in tests; parsing here
// gives us correctly typed data.
export const exercises: Exercise[] = ExercisesFile.parse(exercisesJson);
export const programs: Program[] = ProgramsFile.parse(programsJson);
export const assessments: Assessment[] = AssessmentsFile.parse(assessmentsJson);

const exerciseById = new Map(exercises.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return exerciseById.get(id);
}
