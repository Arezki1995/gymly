import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

/** Mobile-first shell: a centred column (max ~480 px) with a fixed bottom tab bar. */
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col">
      <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
