'use server';

import { bookSeat as bookSeatService } from '@/lib/services/booking';
import { cancelBooking as cancelBookingService } from '@/lib/services/booking';
import { updateTripStatus as updateTripStatusService } from '@/lib/services/trip';
export async function bookSeat(tripId: string, seats: number = 1) {
  return bookSeatService(tripId, seats);
}

export async function cancelBookingAction(bookingId: string) {
  return cancelBookingService(bookingId);
}

export async function updateTripStatusAction(
  tripId: string,
  status: 'in_progress' | 'completed' | 'cancelled'
) {
  return updateTripStatusService(tripId, status);
}
