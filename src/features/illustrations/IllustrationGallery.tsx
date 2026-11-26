import { Link } from 'react-router-dom';
import { exercises, getIllustration } from '../../content';
import { ExerciseIllustration } from './ExerciseIllustration';

/** Dev-only review page: every exercise's still picture and animation side by side. */
export default function IllustrationGallery() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Illustrations ({exercises.length})</h1>
      <ol className="grid gap-4">
        {exercises.map((e, i) => (
          <li key={e.id} className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
            <Link to={`/library/${e.id}`} className="text-sm font-semibold">
              {i + 1}. {e.name}
            </Link>
            {getIllustration(e.id) ? (
              <div className="grid grid-cols-2 gap-2">
                <ExerciseIllustration exerciseId={e.id} className="w-full" />
                <ExerciseIllustration exerciseId={e.id} animate className="w-full" />
              </div>
            ) : (
              <p className="text-sm text-red-600">Missing</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
