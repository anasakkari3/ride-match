import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type {
  CommunityInfo,
  CommunityJoinSource,
  CommunityMembershipMode,
  CommunityType,
} from '@/lib/types';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/utils/errors';

export const DEFAULT_COMMUNITY_TYPE: CommunityType = 'verified';
export const DEFAULT_COMMUNITY_MEMBERSHIP_MODE: CommunityMembershipMode = 'open';
export const SYSTEM_PUBLIC_COMMUNITY_ID = 'general-public';

export function normalizeInviteCode(inviteCode: string | null | undefined): string | null {
  if (typeof inviteCode !== 'string') return null;

  const normalized = inviteCode.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function isSystemCommunityRecord(id: string, data?: FirebaseFirestore.DocumentData) {
  return id === SYSTEM_PUBLIC_COMMUNITY_ID || data?.is_system === true;
}

function normalizeCommunityInfo(
  id: string,
  data: FirebaseFirestore.DocumentData
): CommunityInfo {
  const isSystem = isSystemCommunityRecord(id, data);

  return {
    id,
    name: (data.name as string) ?? 'Community',
    description: typeof data.description === 'string' ? data.description : null,
    type: isSystem ? 'public' : data.type === 'public' ? 'public' : DEFAULT_COMMUNITY_TYPE,
    membership_mode: isSystem
      ? 'open'
      : data.membership_mode === 'approval_required'
        ? 'approval_required'
        : DEFAULT_COMMUNITY_MEMBERSHIP_MODE,
    listed: isSystem ? true : typeof data.listed === 'boolean' ? data.listed : false,
    is_system: isSystem,
    invite_code: isSystem ? null : normalizeInviteCode(data.invite_code),
  };
}

export async function getCommunityById(
  communityId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<CommunityInfo | null> {
  const db = passedDb ?? getAdminFirestore();
  const doc = await db.collection('communities').doc(communityId).get();
  if (!doc.exists) return null;

  return normalizeCommunityInfo(doc.id, doc.data()!);
}

export async function getCommunityByInviteCode(inviteCode: string): Promise<CommunityInfo | null> {
  const db = getAdminFirestore();
  const trimmedInviteCode = inviteCode.trim();
  const normalizedInviteCode = normalizeInviteCode(trimmedInviteCode);
  if (!normalizedInviteCode) return null;

  const lookupValues = Array.from(new Set([trimmedInviteCode, normalizedInviteCode]));
  const snap =
    lookupValues.length === 1
      ? await db
          .collection('communities')
          .where('invite_code', '==', lookupValues[0])
          .get()
      : await db
          .collection('communities')
          .where('invite_code', 'in', lookupValues)
          .get();

  if (snap.empty) return null;

  const matches = snap.docs
    .map((doc) => normalizeCommunityInfo(doc.id, doc.data()))
    .filter((community) => community.invite_code === normalizedInviteCode);

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new AppError(
      'This invite code is currently misconfigured. Please contact support.',
      'INVITE_CODE_CONFLICT',
      500
    );
  }

  return matches[0];
}

export async function joinCommunity(
  communityId: string,
  options?: { joinedVia?: CommunityJoinSource }
) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const community = await getCommunityById(communityId, db);
  if (!community) throw new NotFoundError('Community not found');
  if (community.membership_mode !== 'open') {
    throw new AppError('This community requires approval to join', 'APPROVAL_REQUIRED', 403);
  }

  const docId = `${communityId}_${user.id}`;
  const membershipRef = db.collection('community_members').doc(docId);
  const existingMembership = await membershipRef.get();
  if (existingMembership.exists) {
    return { communityId, userId: user.id };
  }

  await membershipRef.set({
    community_id: communityId,
    user_id: user.id,
    role: 'member',
    joined_at: new Date().toISOString(),
    joined_via: options?.joinedVia ?? 'open_join',
  });

  return { communityId, userId: user.id };
}

export async function listCommunities(options?: { listedOnly?: boolean }): Promise<CommunityInfo[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('communities');

  if (options?.listedOnly) {
    query = query.where('listed', '==', true);
  }

  const snap = await query.get();
  const communities = new Map(
    snap.docs.map((doc) => [doc.id, normalizeCommunityInfo(doc.id, doc.data())])
  );

  if (options?.listedOnly && !communities.has(SYSTEM_PUBLIC_COMMUNITY_ID)) {
    const systemDoc = await db.collection('communities').doc(SYSTEM_PUBLIC_COMMUNITY_ID).get();
    if (systemDoc.exists) {
      communities.set(
        systemDoc.id,
        normalizeCommunityInfo(systemDoc.id, systemDoc.data()!)
      );
    }
  }

  return [...communities.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMyCommunities() {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const snap = await db
    .collection('community_members')
    .where('user_id', '==', user.id)
    .get();

  if (snap.empty) return [];

  const communityIds = snap.docs.map((d) => d.data().community_id as string);
  const results: { community_id: string; role: string; community: CommunityInfo }[] = [];

  // Fetch community details (Firestore 'in' queries support max 30)
  const chunks = [];
  for (let i = 0; i < communityIds.length; i += 30) {
    chunks.push(communityIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const commSnap = await db
      .collection('communities')
      .where('__name__', 'in', chunk)
      .get();

    const commMap = new Map(commSnap.docs.map((d) => [d.id, d.data()]));

    for (const memberDoc of snap.docs) {
      const data = memberDoc.data();
      if (!chunk.includes(data.community_id)) continue;
      const comm = commMap.get(data.community_id);
      if (comm) {
        results.push({
          community_id: data.community_id,
          role: data.role,
          community: normalizeCommunityInfo(data.community_id, comm),
        });
      }
    }
  }

  return results;
}
