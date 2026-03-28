import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Check auth — if this fails, redirect to login
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <AppNav />
      <main className="flex-1 pt-16 animate-fade-in-up">{children}</main>
    </div>
  );
}
