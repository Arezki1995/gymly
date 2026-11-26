import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';

export function LibraryScreen() {
  return (
    <>
      <ScreenHeader title="Library" subtitle="Every exercise, filtered to your club" />
      <EmptyState message="The exercise library arrives in Phase 1." />
    </>
  );
}
