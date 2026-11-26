import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';

export function SettingsScreen() {
  return (
    <>
      <ScreenHeader title="Settings" subtitle="Equipment, sound, theme and data" />
      <EmptyState message="Settings arrive in Phase 3." />
    </>
  );
}
