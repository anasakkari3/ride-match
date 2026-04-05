import { requireCompletedProfile } from '@/lib/auth/onboarding';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCompletedProfile('/app');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <AppNav />
      <main className="flex-1 pt-16 animate-fade-in-up">{children}</main>
    </div>
  );
}
