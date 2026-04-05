import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import LoginClient from './LoginClient';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getPostAuthRedirectPath(user.id));
  }

  return <LoginClient />;
}
