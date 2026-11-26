import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';

export function ProgramsScreen() {
  return (
    <>
      <ScreenHeader title="Programs" subtitle="Structured mobility plans" />
      <EmptyState message="Programs arrive in Phase 1." />
    </>
  );
}
