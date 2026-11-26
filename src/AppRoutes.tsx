import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { TodayScreen } from './features/today/TodayScreen';
import { ProgramsScreen } from './features/programs/ProgramsScreen';
import { LibraryScreen } from './features/library/LibraryScreen';
import { ExerciseDetailScreen } from './features/library/ExerciseDetailScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayScreen />} />
        <Route path="programs" element={<ProgramsScreen />} />
        <Route path="library" element={<LibraryScreen />} />
        <Route path="library/:exerciseId" element={<ExerciseDetailScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
