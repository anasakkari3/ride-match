import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { CommunityInfo } from '@/lib/types';
import { UnauthorizedError } from '@/lib/utils/errors';

export async function getCommunityByInviteCode(inviteCode: string): Promise<CommunityInfo | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('communities')
    .where('invite_code', '==', inviteCode.trim())
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, name: doc.data().name };
}

export async function joinCommunity(communityId: string) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const docId = `${communityId}_${user.id}`;
  await db.collection('community_members').doc(docId).set({
    community_id: communityId,
    user_id: user.id,
    role: 'member',
    joined_at: new Date().toISOString(),
  });
}

export async function createCommunity(name: string, inviteCode: string) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const communityRef = await db.collection('communities').add({
    name,
    invite_code: inviteCode,
    created_at: new Date().toISOString(),
  });

  const docId = `${communityRef.id}_${user.id}`;
  await db.collection('community_members').doc(docId).set({
    community_id: communityRef.id,
    user_id: user.id,
    role: 'admin',
    joined_at: new Date().toISOString(),
  });

  return { id: communityRef.id };
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
          community: { id: data.community_id, name: comm.name },
        });
      }
    }
  }

  return results;
}

export function getFirstCommunity(
  data: Awaited<ReturnType<typeof getMyCommunities>>
): CommunityInfo | null {
  const first = data?.[0];
  if (!first?.community) return null;
  return first.community;
}
