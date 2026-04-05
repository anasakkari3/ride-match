import { redirect } from 'next/navigation';
import { getCurrentUser, type AuthUser } from './session';
import { getRequiredProfileCompletionStatus } from '@/lib/services/user';

export const ONBOARDING_ROUTE = '/onboarding';
const DEFAULT_POST_AUTH_ROUTE = '/app';

export function normalizeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_POST_AUTH_ROUTE
) {
  if (typeof next !== 'string') {
    return fallback;
  }

  const normalized = next.trim();
  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return fallback;
  }

  if (normalized === ONBOARDING_ROUTE || normalized.startsWith(`${ONBOARDING_ROUTE}?`)) {
    return fallback;
  }

  return normalized;
}

export function buildOnboardingPath(next?: string | null) {
  const safeNext = normalizeNextPath(next);
  return `${ONBOARDING_ROUTE}?next=${encodeURIComponent(safeNext)}`;
}

export async function getPostAuthRedirectPath(userId: string, next?: string | null) {
  const safeNext = normalizeNextPath(next);
  const completion = await getRequiredProfileCompletionStatus(userId);

  return completion.isComplete ? safeNext : buildOnboardingPath(safeNext);
}

export async function requireAuthenticatedUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireCompletedProfile(next?: string | null): Promise<AuthUser> {
  const user = await requireAuthenticatedUser();
  const completion = await getRequiredProfileCompletionStatus(user.id);

  if (!completion.isComplete) {
    redirect(buildOnboardingPath(next));
  }

  return user;
}
