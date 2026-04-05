'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { updateUserProfile } from '@/lib/services/user';

export async function updateProfile(
  userId: string,
  updates: {
    displayName: string;
    avatarUrl: string;
    phone: string;
    cityOrArea: string;
    age: number | null;
    gender: string;
    isDriver: boolean | null;
    hasDriverLicense?: boolean | null;
    genderPreference?: string | null;
    licenseImageStatus?: 'not_provided' | 'provided_placeholder' | null;
    insuranceImageStatus?: 'not_provided' | 'provided_placeholder' | null;
    licenseDeclared?: boolean | null;
    insuranceDeclared?: boolean | null;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) throw new Error('Unauthorized');

  await updateUserProfile(userId, updates);
  revalidatePath('/app');
  revalidatePath('/profile');
  revalidatePath('/onboarding');
}
