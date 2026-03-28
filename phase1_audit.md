# Phase 1: Architecture Audit
**Date**: March 2026
**Focus**: Project Structure, Domain Boundaries, and Security/Consistency Checks.

## 1. Route Map (`app/`)
The Next.js App Router exposes the following distinct pathways via layout groupings:

- **`/`** `(public)/page.tsx` - Marketing landing page. Redirects to `/app` if a valid session exists.
- **`/login`** `(auth)/login/page.tsx` - Authentication gateway.
- **`/app`** `(app)/app/page.tsx` - Main feed (upcoming trips & community selection).
- **`/trips/my-rides`** `(app)/trips/my-rides/page.tsx` - The authenticated user's itinerary.
- **`/trips/[id]`** `(app)/trips/[id]/page.tsx` - Specific trip details, gatechecked by community membership and roster auth.
- **`/profile`** `(app)/profile/page.tsx` - User stats and setting preferences.
- **`/messages`** `(app)/messages/page.tsx` - Active conversation threads.
- **`/notifications`** `(app)/notifications/page.tsx` - User alert inbox.
- **`/search`** `(app)/search/page.tsx` - Deep search mechanism for finding trips.
- **`/admin/analytics`** `admin/analytics/page.tsx` - Restricted platform metrics dashboard.

## 2. Layout Hierarchy & Route Groups
The routing logic strictly adheres to layout grouping brackets to encapsulate shared context and headers without muddying the URL:
* **`(public)`**: Contains `page.tsx`. No layouts restricting or wrapping auth context, fully static.
* **`(auth)`**: Contains the `login/` sub-route. Stripped-down navigation UI.
* **`(app)`**: Contains the bulk of application logic. Wrapped in `layout.tsx` which injects `AppNav.tsx`, global container styling, and validates session state context.
* **`admin`**: Explicitly segregated folder holding specialized dashboards.

## 3. Main Domain Boundaries

### UI
- Contains React Server Components (RSC) responsible for reading URL state, consuming services, and mapping payload shapes to Client components.
- Heavily delegates user interaction logic downward to `<XClient>` isolated shells.

### Actions
- Represent boundary mutations. E.g., `app/(auth)/login/actions.ts` and `app/(app)/profile/actions.ts`.
- Structured as thin wrappers acting strictly over standard domain services (e.g. `updateUserProfile(user, payload)`).

### Services
- **`lib/services/`**: The core domain operation layer containing `trip.ts`, `booking.ts`, `message.ts`, `user.ts`, `admin.ts`, and `rating.ts`.
- Manages all Admin SDK Firestore transactions. No Firestore querying occurs strictly on the client. UI fetch calls only proxy to these definitions.

### Auth & Permissions
- **`lib/auth/session.ts`**: Encrypts and evaluates session tokens (`getCurrentUser`). 
- **`lib/auth/permissions.ts`**: A dedicated registry defining purely symmetric Boolean logic (`canJoinTrip`, `canEditTrip`, `canAccessTripChat`) dictating edge-case matrix access points isolated completely from DB querying.

## 4. Remaining Structural Inconsistencies
During the Phase 1 & 2 sweeps, some obsolete architecture artifacts were left orphaned due to filesystem isolation scopes:
1. **Unused Ghost Files**: `app/(auth)/login/sync-user.ts` and `app/admin/analytics/queries.ts` conceptually migrated fully to `lib/services/user.ts` and `lib/services/admin.ts` but the physical files still exist unresolved in the tree.
2. **Leftover Direct DB Calls**: `app/admin/analytics/page.tsx` still manually inspects `db.collection('community_members')` sequentially to enforce an Admin role logic. This logic must be abstracted behind an explicit `isAdmin(user)` auth permission helper out of the rendering tree.
3. **Dead Imports**: Both `app/(app)/app/page.tsx` and `app/(app)/profile/page.tsx` retain unused `import { getAdminFirestore }` statements.
4. **Empty Directories**: `app/(app)/home/` is totally empty and should be cleaned out.

## 5. Risky or Unclear Areas
1. **Database Role Enforcement**: The platform relies heavily on manual querying against `community_members` collections for roles (`where('role', '==', 'admin')`). There is no utilization of standard Firebase Custom Claims, leading to possible synchronization risks and heavier querying tolls on page layouts.
2. **Missing Input Validation (Zod Validation)**: Most Server Action wrappers implicitly trust the shape of the data entering the function. Without a rigid structural schema validation envelope (like Zod constraints boundary tracking), malicious direct invocations mimicking Server Actions are poorly protected.
3. **Implicit Data Fallbacks vs Hard DB Relational Integrity**: A deleted user or a suspended profile won’t cascade seamlessly to past `trips` or `bookings`. This can lead to unhandled runtime failures when `getUserProfile` maps over a map of historic trips yielding sudden null boundaries across standard active iterations.
