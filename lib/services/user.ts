import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { trackEvent } from './analytics';
import type { UserProfile } from '@/lib/types';
import * as admin from 'firebase-admin';

/**
 * Ensures a user document exists in Firestore based on their Auth ID Token.
 */
export async function ensureUserProfile(idToken: string) {
  let decoded: { uid: string; email?: string; name?: string; picture?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return;
  }

  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(decoded.uid);
  const existing = await userRef.get();

  if (existing.exists) {
    // Update existing profile
    await userRef.update({
      display_name: decoded.name ?? existing.data()!.display_name ?? null,
      avatar_url: decoded.picture ?? existing.data()!.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    });
  } else {
    // Create new profile
    await userRef.set({
      id: decoded.uid,
      phone: null,
      display_name: decoded.name ?? null,
      avatar_url: decoded.picture ?? null,
      rating_avg: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  try {
    await trackEvent('auth_success', { userId: decoded.uid });
  } catch {
    // Analytics non-critical
  }
}

/**
 * Fetches a public safe UserProfile.
 */
export async function getUserProfile(userId: string, passedDb?: admin.firestore.Firestore): Promise<UserProfile | null> {
  const db = passedDb || getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

/**
 * Fetches the full profile including private fields (phone).
 * Only call this server-side when the authenticated user is viewing their OWN profile.
 */
export async function getMyProfileFull(userId: string): Promise<(UserProfile & { phone: string | null }) | null> {
  const db = getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    phone: d.phone ?? null,
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

/**
 * Updates a user profile.
 */
export async function updateUserProfile(userId: string, updates: { displayName: string; avatarUrl: string }) {
  const db = getAdminFirestore();
  await db.collection('users').doc(userId).update({
    display_name: updates.displayName || null,
    avatar_url: updates.avatarUrl || null,
    updated_at: new Date().toISOString(),
  });
}
