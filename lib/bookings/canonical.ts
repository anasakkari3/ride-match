import type { BookingsRow } from '@/lib/types';

function toTimestamp(value: string | null | undefined) {
  if (typeof value !== 'string') return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStatusPriority(status: BookingsRow['status']) {
  switch (status) {
    case 'confirmed':
      return 2;
    case 'pending':
      return 1;
    case 'cancelled':
    default:
      return 0;
  }
}

function shouldReplaceBooking<T extends Pick<BookingsRow, 'created_at' | 'status'>>(
  current: T,
  candidate: T
) {
  const currentTimestamp = toTimestamp(current.created_at);
  const candidateTimestamp = toTimestamp(candidate.created_at);

  if (candidateTimestamp !== currentTimestamp) {
    return candidateTimestamp > currentTimestamp;
  }

  return getStatusPriority(candidate.status) > getStatusPriority(current.status);
}

export function getTripPassengerBookingId(tripId: string, passengerId: string) {
  return `${tripId}_${passengerId}`;
}

export function collapseBookingsByPassenger<T extends Pick<BookingsRow, 'passenger_id' | 'created_at' | 'status'>>(
  bookings: readonly T[]
) {
  const latestByPassenger = new Map<string, T>();

  for (const booking of bookings) {
    const existing = latestByPassenger.get(booking.passenger_id);
    if (!existing || shouldReplaceBooking(existing, booking)) {
      latestByPassenger.set(booking.passenger_id, booking);
    }
  }

  return Array.from(latestByPassenger.values()).sort((left, right) => {
    const timeDiff = toTimestamp(right.created_at) - toTimestamp(left.created_at);
    if (timeDiff !== 0) return timeDiff;

    return getStatusPriority(right.status) - getStatusPriority(left.status);
  });
}
