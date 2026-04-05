import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { logWarn } from '@/lib/observability/logger';

const AUTH_COOKIE_NAME = 'firebase-session';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function setSession(idToken: string) {
  const adminAuth = getAdminAuth();
  // Create a session cookie from the ID token. Valid for 5 days.
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: AUTH_COOKIE_MAX_AGE * 1000,
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  cookieStore.delete(AUTH_COOKIE_NAME);

  if (sessionCookie) {
    try {
      const adminAuth = getAdminAuth();
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    } catch (error) {
      logWarn('auth.session_revocation_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const adminAuth = getAdminAuth();
    // Verify the session cookie. checkRevoked=true ensures we catch revoked tokens.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      id: decoded.uid,
      email: decoded.email ?? null,
      displayName: (decoded.name as string) ?? null,
      photoURL: (decoded.picture as string) ?? null,
    };
  } catch (error) {
    logWarn('auth.session_validation_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
