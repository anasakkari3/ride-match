'use server';

import { setSession } from '@/lib/auth/session';
import { ensureUserProfile } from '@/lib/services/user';

/** Call after client-side Firebase sign-in/sign-up; sets cookie and syncs user profile. */
export async function setSessionAndSync(idToken: string) {
  await setSession(idToken);
  try {
    await ensureUserProfile(idToken);
  } catch {
    // Sync to Firestore failed – user is still logged in via cookie
  }
}

export async function signOut() {
  const { clearSession } = await import('@/lib/auth/session');
  await clearSession();
}
