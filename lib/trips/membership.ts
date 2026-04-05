export function getTripMembershipDocId(tripId: string, userId: string) {
  return `${tripId}_${userId}`;
}
