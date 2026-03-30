import { getAdminFirestore } from '@/lib/firebase/firestore-admin';

export type CompletedRideStats = {
  completedDrives: number;
  completedJoins: number;
};

export type ProfileSetupStatus = {
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasPhone: boolean;
};

export function getProfileSetupStatus(input: {
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
}): ProfileSetupStatus {
  const hasDisplayName = Boolean(input.displayName?.trim());
  const hasAvatar = Boolean(input.avatarUrl?.trim());
  const hasPhone = Boolean(input.phone?.trim());

  const fields = [
    { label: 'Display name', complete: hasDisplayName },
    { label: 'Profile photo', complete: hasAvatar },
    { label: 'Phone number', complete: hasPhone },
  ];

  const completedFields = fields.filter((field) => field.complete).length;

  return {
    completedFields,
    totalFields: fields.length,
    missingFields: fields.filter((field) => !field.complete).map((field) => field.label),
    hasDisplayName,
    hasAvatar,
    hasPhone,
  };
}

export async function getCompletedRideStats(
  userId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<CompletedRideStats> {
  const db = passedDb ?? getAdminFirestore();

  const [drivesSnap, joinedBookingsSnap] = await Promise.all([
    db.collection('trips')
      .where('driver_id', '==', userId)
      .where('status', '==', 'completed')
      .get(),
    db.collection('bookings')
      .where('passenger_id', '==', userId)
      .where('status', '==', 'confirmed')
      .get(),
  ]);

  let completedJoins = 0;
  const joinedTripIds = [...new Set(joinedBookingsSnap.docs.map((bookingDoc) => bookingDoc.data().trip_id as string))];

  for (const tripId of joinedTripIds) {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) continue;
    if (tripDoc.data()?.status === 'completed') {
      completedJoins += 1;
    }
  }

  return {
    completedDrives: drivesSnap.size,
    completedJoins,
  };
}

export async function getCompletedDriveCountForDriver(
  driverId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<number> {
  const db = passedDb ?? getAdminFirestore();
  const snap = await db.collection('trips')
    .where('driver_id', '==', driverId)
    .where('status', '==', 'completed')
    .get();

  return snap.size;
}
