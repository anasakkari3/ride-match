import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { trackEvent } from './analytics';
import type {
  DocumentPlaceholderStatus,
  RequiredProfileField,
  UserProfile,
} from '@/lib/types';
import * as admin from 'firebase-admin';
import { AppError } from '@/lib/utils/errors';

export type MyUserProfileFull = UserProfile & {
  phone: string | null;
  city_or_area: string | null;
  age: number | null;
  gender: string | null;
  is_driver: boolean | null;
  has_driver_license: boolean | null;
  gender_preference: string | null;
  license_image_status: DocumentPlaceholderStatus;
  insurance_image_status: DocumentPlaceholderStatus;
  license_declared: boolean;
  insurance_declared: boolean;
};

export type RequiredProfileCompletionStatus = {
  profile: MyUserProfileFull | null;
  missingFields: RequiredProfileField[];
  isComplete: boolean;
};

export const BASIC_PROFILE_ACTION_FIELDS = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
] as const;

export const TRIP_CREATION_PROFILE_FIELDS = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
  'is_driver',
  'has_driver_license',
] as const;

type ProfileActionField = (typeof TRIP_CREATION_PROFILE_FIELDS)[number];
type BasicProfileActionField = (typeof BASIC_PROFILE_ACTION_FIELDS)[number];
type TripCreationProfileField = (typeof TRIP_CREATION_PROFILE_FIELDS)[number];
type ProfileActionReadinessSource = Partial<Record<ProfileActionField, unknown>> | null | undefined;
type ProfileActionReadiness<Field extends ProfileActionField> = {
  missingFields: Field[];
  isReady: boolean;
};

export const REQUIRED_PROFILE_FIELDS: RequiredProfileField[] = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
  'gender',
  'is_driver',
];

const ALLOWED_GENDERS = new Set(['woman', 'man', 'non-binary', 'prefer_not_to_say']);
const ALLOWED_GENDER_PREFERENCES = new Set([
  'women',
  'men',
  'non-binary',
  'same_as_me',
]);
const ALLOWED_DOCUMENT_PLACEHOLDER_STATUSES = new Set<DocumentPlaceholderStatus>([
  'not_provided',
  'provided_placeholder',
]);
const ACTION_PROFILE_FIELD_LABELS: Record<ProfileActionField, string> = {
  display_name: 'display name',
  phone: 'phone',
  city_or_area: 'city or area',
  age: 'age',
  is_driver: 'driver status',
  has_driver_license: "driver's license confirmation",
};

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string | null | undefined, fieldLabel: string) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new AppError(`${fieldLabel} is required.`, 'INVALID_PROFILE');
  }

  return normalized;
}

function normalizeAge(value: number | string | null | undefined) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatFieldList(values: readonly string[]) {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function getMissingActionProfileFields<Field extends ProfileActionField>(
  profile: ProfileActionReadinessSource,
  requiredFields: readonly Field[]
): Field[] {
  if (!profile) {
    return [...requiredFields];
  }

  const missingFields: Field[] = [];

  for (const field of requiredFields) {
    if (field === 'display_name') {
      if (
        !normalizeOptionalText(
          typeof profile.display_name === 'string' ? profile.display_name : null
        )
      ) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'phone') {
      if (!normalizeOptionalText(typeof profile.phone === 'string' ? profile.phone : null)) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'city_or_area') {
      if (
        !normalizeOptionalText(
          typeof profile.city_or_area === 'string' ? profile.city_or_area : null
        )
      ) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'age') {
      const ageValue =
        typeof profile.age === 'number' || typeof profile.age === 'string'
          ? profile.age
          : null;

      if (normalizeAge(ageValue) === null) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'is_driver') {
      if (profile.is_driver !== true) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'has_driver_license' && profile.has_driver_license !== true) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

export function getBasicProfileActionReadiness(
  profile: ProfileActionReadinessSource
): ProfileActionReadiness<BasicProfileActionField> {
  const missingFields = getMissingActionProfileFields(profile, BASIC_PROFILE_ACTION_FIELDS);

  return {
    missingFields,
    isReady: missingFields.length === 0,
  };
}

export function getTripCreationProfileReadiness(
  profile: ProfileActionReadinessSource
): ProfileActionReadiness<TripCreationProfileField> {
  const missingFields = getMissingActionProfileFields(profile, TRIP_CREATION_PROFILE_FIELDS);

  return {
    missingFields,
    isReady: missingFields.length === 0,
  };
}

export function describeProfileActionFields(fields: readonly ProfileActionField[]) {
  const labels = fields.map((field) => ACTION_PROFILE_FIELD_LABELS[field]);
  return labels.length > 0 ? formatFieldList(labels) : 'profile details';
}

function normalizeGender(value: string | null | undefined) {
  const normalized = normalizeRequiredText(value, 'Gender');
  if (!ALLOWED_GENDERS.has(normalized)) {
    throw new AppError('Please choose a valid gender.', 'INVALID_PROFILE');
  }

  return normalized;
}

function normalizeGenderPreference(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (!ALLOWED_GENDER_PREFERENCES.has(normalized)) {
    throw new AppError('Please choose a valid gender preference.', 'INVALID_PROFILE');
  }

  return normalized;
}

function normalizeDocumentPlaceholderStatus(
  value: DocumentPlaceholderStatus | string | null | undefined,
  fieldLabel: string
): DocumentPlaceholderStatus {
  if (value === undefined || value === null) {
    return 'not_provided';
  }

  if (ALLOWED_DOCUMENT_PLACEHOLDER_STATUSES.has(value as DocumentPlaceholderStatus)) {
    return value as DocumentPlaceholderStatus;
  }

  throw new AppError(`${fieldLabel} status is invalid.`, 'INVALID_PROFILE');
}

function resolveDocumentPlaceholderState(input: {
  status?: DocumentPlaceholderStatus | string | null;
  declared?: boolean | null;
  fieldLabel: string;
}) {
  const hasStatus = input.status !== undefined;
  const hasDeclared = input.declared !== undefined;

  if (!hasStatus && !hasDeclared) {
    return null;
  }

  const status = hasStatus
    ? normalizeDocumentPlaceholderStatus(input.status, input.fieldLabel)
    : input.declared
      ? 'provided_placeholder'
      : 'not_provided';
  const declared =
    typeof input.declared === 'boolean'
      ? input.declared
      : status === 'provided_placeholder';

  if (status === 'provided_placeholder' && !declared) {
    throw new AppError(`${input.fieldLabel} placeholder is inconsistent.`, 'INVALID_PROFILE');
  }

  if (status === 'not_provided' && declared) {
    throw new AppError(`${input.fieldLabel} placeholder is inconsistent.`, 'INVALID_PROFILE');
  }

  return { status, declared };
}

export function getMissingRequiredProfileFields(
  profile: MyUserProfileFull | null
): RequiredProfileField[] {
  if (!profile) {
    return [...REQUIRED_PROFILE_FIELDS];
  }

  const missingFields: RequiredProfileField[] = [];

  if (!normalizeOptionalText(profile.display_name)) {
    missingFields.push('display_name');
  }

  if (!normalizeOptionalText(profile.phone)) {
    missingFields.push('phone');
  }

  if (!normalizeOptionalText(profile.city_or_area)) {
    missingFields.push('city_or_area');
  }

  if (normalizeAge(profile.age) === null) {
    missingFields.push('age');
  }

  if (!normalizeOptionalText(profile.gender)) {
    missingFields.push('gender');
  }

  if (typeof profile.is_driver !== 'boolean') {
    missingFields.push('is_driver');
  }

  return missingFields;
}

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
  const doc = await userRef.get();
  const now = new Date().toISOString();

  if (doc.exists) {
    const existing = doc.data()!;
    const updates: {
      updated_at: string;
      display_name?: string | null;
      avatar_url?: string | null;
    } = { updated_at: now };

    // Only seed from auth if Firestore fields are missing or null.
    if (!existing.display_name && decoded.name) {
      updates.display_name = decoded.name;
    }
    if (!existing.avatar_url && decoded.picture) {
      updates.avatar_url = decoded.picture;
    }

    if (Object.keys(updates).length > 1) {
      await userRef.update(updates);
    }
  } else {
    // Create new profile: seed from auth.
    await userRef.set({
      id: decoded.uid,
      phone: null,
      display_name: decoded.name ?? null,
      city_or_area: null,
      age: null,
      gender: null,
      is_driver: null,
      has_driver_license: null,
      gender_preference: null,
      license_image_status: 'not_provided',
      insurance_image_status: 'not_provided',
      license_declared: false,
      insurance_declared: false,
      avatar_url: decoded.picture ?? null,
      rating_avg: 0,
      rating_count: 0,
      created_at: now,
      updated_at: now,
    });
  }

  try {
    await trackEvent('auth_success', { userId: decoded.uid });
  } catch {
    // Analytics non-critical.
  }
}

/**
 * Fetches a public safe UserProfile.
 */
export async function getUserProfile(
  userId: string,
  passedDb?: admin.firestore.Firestore
): Promise<UserProfile | null> {
  const db = passedDb || getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    gender: d.gender ?? null,
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

/**
 * Fetches the full profile including private fields.
 * Only call this server-side when the authenticated user is viewing their OWN profile.
 */
export async function getMyProfileFull(userId: string): Promise<MyUserProfileFull | null> {
  const db = getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  const licenseImageStatus = normalizeDocumentPlaceholderStatus(
    d.license_image_status,
    'Driver license image'
  );
  const insuranceImageStatus = normalizeDocumentPlaceholderStatus(
    d.insurance_image_status,
    'Car insurance image'
  );

  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    phone: d.phone ?? null,
    city_or_area: d.city_or_area ?? null,
    age: typeof d.age === 'number' && Number.isFinite(d.age) ? d.age : null,
    gender: d.gender ?? null,
    is_driver: typeof d.is_driver === 'boolean' ? d.is_driver : null,
    has_driver_license: typeof d.has_driver_license === 'boolean' ? d.has_driver_license : null,
    gender_preference: d.gender_preference ?? null,
    license_image_status: licenseImageStatus,
    insurance_image_status: insuranceImageStatus,
    license_declared:
      typeof d.license_declared === 'boolean'
        ? d.license_declared
        : licenseImageStatus === 'provided_placeholder',
    insurance_declared:
      typeof d.insurance_declared === 'boolean'
        ? d.insurance_declared
        : insuranceImageStatus === 'provided_placeholder',
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

export async function getRequiredProfileCompletionStatus(
  userId: string
): Promise<RequiredProfileCompletionStatus> {
  const profile = await getMyProfileFull(userId);
  const missingFields = getMissingRequiredProfileFields(profile);

  return {
    profile,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}

/**
 * Updates a user profile.
 */
export async function updateUserProfile(
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
    licenseImageStatus?: DocumentPlaceholderStatus | null;
    insuranceImageStatus?: DocumentPlaceholderStatus | null;
    licenseDeclared?: boolean | null;
    insuranceDeclared?: boolean | null;
  }
) {
  const displayName = normalizeRequiredText(updates.displayName, 'Display name');
  const phone = normalizeRequiredText(updates.phone, 'Phone');
  const cityOrArea = normalizeRequiredText(updates.cityOrArea, 'City or area');
  const gender = normalizeGender(updates.gender);
  const age = normalizeAge(updates.age);
  const genderPreference = normalizeGenderPreference(updates.genderPreference);

  if (age === null) {
    throw new AppError('Age is required.', 'INVALID_PROFILE');
  }

  if (typeof updates.isDriver !== 'boolean') {
    throw new AppError('Please choose whether you are a driver.', 'INVALID_PROFILE');
  }

  if (
    updates.isDriver === true &&
    updates.hasDriverLicense !== undefined &&
    updates.hasDriverLicense !== true
  ) {
    throw new AppError('Drivers must confirm they have a valid driver\'s license.', 'INVALID_PROFILE');
  }

  if (
    updates.hasDriverLicense !== undefined &&
    updates.hasDriverLicense !== null &&
    typeof updates.hasDriverLicense !== 'boolean'
  ) {
    throw new AppError('Please choose whether you have a driver\'s license.', 'INVALID_PROFILE');
  }

  const licensePlaceholder = resolveDocumentPlaceholderState({
    status: updates.licenseImageStatus,
    declared: updates.licenseDeclared,
    fieldLabel: 'Driver license image',
  });
  const insurancePlaceholder = resolveDocumentPlaceholderState({
    status: updates.insuranceImageStatus,
    declared: updates.insuranceDeclared,
    fieldLabel: 'Car insurance image',
  });

  const profileUpdates: Record<string, unknown> = {
    display_name: displayName,
    phone,
    city_or_area: cityOrArea,
    age,
    gender,
    is_driver: updates.isDriver,
    avatar_url: normalizeOptionalText(updates.avatarUrl),
    updated_at: new Date().toISOString(),
  };

  if (updates.hasDriverLicense !== undefined) {
    profileUpdates.has_driver_license = updates.hasDriverLicense;
  }

  if (updates.genderPreference !== undefined) {
    profileUpdates.gender_preference = genderPreference;
  }

  if (licensePlaceholder) {
    profileUpdates.license_image_status = licensePlaceholder.status;
    profileUpdates.license_declared = licensePlaceholder.declared;
  }

  if (insurancePlaceholder) {
    profileUpdates.insurance_image_status = insurancePlaceholder.status;
    profileUpdates.insurance_declared = insurancePlaceholder.declared;
  }

  const db = getAdminFirestore();
  await db.collection('users').doc(userId).set(
    profileUpdates,
    { merge: true }
  );
}
