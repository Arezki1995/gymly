import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';

export function ProgressScreen() {
  return (
    <>
      <ScreenHeader title="Progress" subtitle="Self-tests, streaks and skill tree" />
      <EmptyState message="Your progress will show here once you log sessions." />
    </>
  );
}
