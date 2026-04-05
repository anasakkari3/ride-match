import { requireCompletedProfile } from '@/lib/auth/onboarding';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCompletedProfile('/app');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900/80">
      <AppNav />
      <main className="flex-1 pt-16 animate-fade-in-up">{children}</main>
    </div>
  );
}
