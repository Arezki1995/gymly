import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { TodayScreen } from './features/today/TodayScreen';
import { ProgramsScreen } from './features/programs/ProgramsScreen';
import { ProgramDetailScreen } from './features/programs/ProgramDetailScreen';
import { PlayerScreen } from './features/player/PlayerScreen';
import { LibraryScreen } from './features/library/LibraryScreen';
import { ExerciseDetailScreen } from './features/library/ExerciseDetailScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

const IllustrationGallery = import.meta.env.DEV
  ? lazy(() => import('./features/illustrations/IllustrationGallery'))
  : null;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="play/:programId/:sessionId" element={<PlayerScreen />} />
      {IllustrationGallery && (
        <Route
          path="dev/illustrations"
          element={
            <Suspense>
              <IllustrationGallery />
            </Suspense>
          }
        />
      )}
      <Route element={<AppLayout />}>
        <Route index element={<TodayScreen />} />
        <Route path="programs" element={<ProgramsScreen />} />
        <Route path="programs/:programId" element={<ProgramDetailScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:exerciseId" element={<ExerciseDetailScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
