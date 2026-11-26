import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';

export function TodayScreen() {
  return (
    <>
      <ScreenHeader title="Gymly" subtitle="Your mobility training for today" />
      <EmptyState message="Your next session will appear here." />
    </>
  );
}
