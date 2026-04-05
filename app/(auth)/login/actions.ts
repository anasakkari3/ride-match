'use server';

import { clearSession, setSession } from '@/lib/auth/session';
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
  await clearSession();
}
