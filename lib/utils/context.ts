/**
 * Centralized utility for inferring a user's location footprint (Hub).
 * Used for building Passive Discovery feeds when the user has not searched.
 */

// Accepts any object that may optionally carry primary_hub (e.g. UserProfile, extended profiles)
type HasPrimaryHub = ({ primary_hub?: string | null } & Record<string, unknown>) | null;
type HasLocationNames = { origin_name: string; destination_name: string };

export function inferUserContext(
    userProfile: HasPrimaryHub,
    myTrips: HasLocationNames[],
    myReservations: HasLocationNames[],
    upcomingCommunityTrips: HasLocationNames[]
): string | null {
    // -------------------------------------------------------------
    // Priority 0: Explicit Profile Setting (Future Implementation)
    // -------------------------------------------------------------
    if (userProfile && userProfile.primary_hub) {
        return userProfile.primary_hub;
    }

    // -------------------------------------------------------------
    // Priority 1: Inferred Hub from Past/Scheduled Activity
    // -------------------------------------------------------------
    const locationCounts: Record<string, number> = {};

    const addLocation = (loc: string, weight = 1) => {
        if (!loc) return;
        locationCounts[loc] = (locationCounts[loc] || 0) + weight;
    };

    // Driven trips (Driver's origin is usually their home/work base)
    myTrips.forEach(t => {
        addLocation(t.origin_name, 2); 
        addLocation(t.destination_name, 1);
    });

    // Booked rides (Passenger's origin is usually where they are)
    myReservations.forEach(r => {
        addLocation(r.origin_name, 2); 
        addLocation(r.destination_name, 1);
    });

    let bestHub: string | null = null;
    let maxCount = 0;

    for (const [loc, count] of Object.entries(locationCounts)) {
        if (count > maxCount) {
            maxCount = count;
            bestHub = loc;
        }
    }

    if (bestHub) return bestHub;

    // -------------------------------------------------------------
    // Priority 2: Global Fallback (Most Popular Community Hub)
    // -------------------------------------------------------------
    const communityCounts: Record<string, number> = {};
    upcomingCommunityTrips.forEach(t => {
        // Only count origins to find "where are most trips starting"
        communityCounts[t.origin_name] = (communityCounts[t.origin_name] || 0) + 1;
    });

    let bestCommunityHub: string | null = null;
    let maxCommCount = 0;

    for (const [loc, count] of Object.entries(communityCounts)) {
        if (count > maxCommCount) {
            maxCommCount = count;
            bestCommunityHub = loc;
        }
    }

    return bestCommunityHub;
}
