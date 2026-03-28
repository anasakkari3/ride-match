'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { updateUserProfile } from '@/lib/services/user';

export async function updateProfile(
  userId: string,
  updates: { displayName: string; avatarUrl: string }
) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) throw new Error('Unauthorized');

  await updateUserProfile(userId, updates);
}
