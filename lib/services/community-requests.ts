import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { isCommunityAdmin } from '@/lib/auth/permissions';
import type {
  CommunityJoinRequestStatus,
  CommunityJoinRequestsRow,
  CommunityMembersRow,
} from '@/lib/types';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/utils/errors';
import { getCommunityById } from './community';
import { createNotification } from './notification';

export type CommunityMembershipState =
  | { state: 'member'; role: CommunityMembersRow['role'] }
  | { state: 'pending'; requestStatus: 'pending' }
  | {
      state: 'rejected';
      requestStatus: 'rejected';
      decisionNote: string | null;
      resolvedAt: string | null;
    }
  | { state: 'not_joined' };

type JoinRequestWithId = CommunityJoinRequestsRow & { id: string };

function getRequestDocId(communityId: string, userId: string) {
  return `${communityId}_${userId}`;
}

async function assertCommunityAdmin(
  communityId: string,
  userId: string,
  db: FirebaseFirestore.Firestore
) {
  const hasAdminAccess = await isCommunityAdmin(userId, communityId, db);
  if (!hasAdminAccess) {
    throw new UnauthorizedError('Only community admins can manage join requests');
  }
}

function toJoinRequestWithId(
  id: string,
  data: FirebaseFirestore.DocumentData
): JoinRequestWithId {
  return {
    id,
    community_id: data.community_id,
    user_id: data.user_id,
    status: data.status as CommunityJoinRequestStatus,
    request_note: typeof data.request_note === 'string' ? data.request_note : null,
    decision_note: typeof data.decision_note === 'string' ? data.decision_note : null,
    created_at: data.created_at,
    resolved_at: typeof data.resolved_at === 'string' ? data.resolved_at : null,
    resolved_by: typeof data.resolved_by === 'string' ? data.resolved_by : null,
  };
}

export async function getCommunityMembershipState(
  communityId: string,
  userId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<CommunityMembershipState> {
  const db = passedDb ?? getAdminFirestore();
  const membershipRef = db.collection('community_members').doc(`${communityId}_${userId}`);
  const requestRef = db.collection('community_join_requests').doc(getRequestDocId(communityId, userId));

  const [membershipDoc, requestDoc] = await Promise.all([membershipRef.get(), requestRef.get()]);

  if (membershipDoc.exists) {
    const role = membershipDoc.data()?.role === 'admin' ? 'admin' : 'member';
    return { state: 'member', role };
  }

  if (!requestDoc.exists) {
    return { state: 'not_joined' };
  }

  const status = requestDoc.data()?.status;
  if (status === 'pending') {
    return { state: 'pending', requestStatus: 'pending' };
  }
  if (status === 'rejected') {
    return {
      state: 'rejected',
      requestStatus: 'rejected',
      decisionNote:
        typeof requestDoc.data()?.decision_note === 'string'
          ? (requestDoc.data()?.decision_note as string)
          : null,
      resolvedAt:
        typeof requestDoc.data()?.resolved_at === 'string'
          ? (requestDoc.data()?.resolved_at as string)
          : null,
    };
  }

  return { state: 'not_joined' };
}

export async function getMyCommunityMembershipState(
  communityId: string
): Promise<CommunityMembershipState> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  return getCommunityMembershipState(communityId, user.id);
}

export async function submitJoinRequest(
  communityId: string,
  requestNote?: string
): Promise<JoinRequestWithId> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const community = await getCommunityById(communityId, db);
  if (!community) throw new NotFoundError('Community not found');
  if (community.membership_mode !== 'approval_required') {
    throw new AppError('This community does not require approval to join', 'BAD_REQUEST');
  }

  const membershipState = await getCommunityMembershipState(communityId, user.id, db);
  if (membershipState.state === 'member') {
    throw new AppError('You already belong to this community', 'ALREADY_MEMBER', 409);
  }

  const requestId = getRequestDocId(communityId, user.id);
  const requestRef = db.collection('community_join_requests').doc(requestId);
  const now = new Date().toISOString();
  const payload: CommunityJoinRequestsRow = {
    community_id: communityId,
    user_id: user.id,
    status: 'pending',
    request_note: requestNote?.trim() || null,
    decision_note: null,
    created_at: now,
    resolved_at: null,
    resolved_by: null,
  };

  await requestRef.set(payload);

  return {
    id: requestId,
    ...payload,
  };
}

export async function cancelJoinRequest(communityId: string): Promise<{ ok: true }> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const requestRef = db.collection('community_join_requests').doc(getRequestDocId(communityId, user.id));
  const requestDoc = await requestRef.get();
  if (!requestDoc.exists) {
    throw new NotFoundError('Join request not found');
  }
  if (requestDoc.data()?.status !== 'pending') {
    throw new AppError('Only pending join requests can be cancelled', 'BAD_REQUEST');
  }

  await requestRef.update({
    status: 'cancelled',
    resolved_at: new Date().toISOString(),
    resolved_by: user.id,
  });

  return { ok: true };
}

export async function listPendingJoinRequests(communityId: string): Promise<JoinRequestWithId[]> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  await assertCommunityAdmin(communityId, user.id, db);

  const snap = await db
    .collection('community_join_requests')
    .where('community_id', '==', communityId)
    .where('status', '==', 'pending')
    .get();

  return snap.docs.map((doc) => toJoinRequestWithId(doc.id, doc.data()));
}

export async function approveJoinRequest(
  communityId: string,
  requesterId: string,
  decisionNote?: string
): Promise<{ ok: true }> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const community = await getCommunityById(communityId, db);
  if (!community) throw new NotFoundError('Community not found');
  await assertCommunityAdmin(communityId, user.id, db);

  const requestRef = db.collection('community_join_requests').doc(getRequestDocId(communityId, requesterId));
  const membershipRef = db.collection('community_members').doc(`${communityId}_${requesterId}`);

  await db.runTransaction(async (tx) => {
    const [requestDoc, membershipDoc] = await Promise.all([tx.get(requestRef), tx.get(membershipRef)]);
    if (!requestDoc.exists) {
      throw new NotFoundError('Join request not found');
    }
    if (requestDoc.data()?.status !== 'pending') {
      throw new AppError('Only pending join requests can be approved', 'BAD_REQUEST');
    }

    const now = new Date().toISOString();
    if (!membershipDoc.exists) {
      tx.set(membershipRef, {
        community_id: communityId,
        user_id: requesterId,
        role: 'member',
        joined_at: now,
        joined_via: 'approval',
      });
    }

    tx.update(requestRef, {
      status: 'approved',
      decision_note: decisionNote?.trim() || null,
      resolved_at: now,
      resolved_by: user.id,
    });
  });

  try {
    await createNotification({
      userId: requesterId,
      type: 'system',
      title: 'Community request approved',
      body: decisionNote?.trim()
        ? `Your request to join ${community.name} was approved. Note: ${decisionNote.trim()}`
        : `Your request to join ${community.name} was approved.`,
      linkUrl: `/community`,
    });
  } catch {
    // notifications are non-critical
  }

  return { ok: true };
}

export async function rejectJoinRequest(
  communityId: string,
  requesterId: string,
  decisionNote?: string
): Promise<{ ok: true }> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const community = await getCommunityById(communityId, db);
  if (!community) throw new NotFoundError('Community not found');
  await assertCommunityAdmin(communityId, user.id, db);

  const requestRef = db.collection('community_join_requests').doc(getRequestDocId(communityId, requesterId));
  const requestDoc = await requestRef.get();
  if (!requestDoc.exists) {
    throw new NotFoundError('Join request not found');
  }
  if (requestDoc.data()?.status !== 'pending') {
    throw new AppError('Only pending join requests can be rejected', 'BAD_REQUEST');
  }

  await requestRef.update({
    status: 'rejected',
    decision_note: decisionNote?.trim() || null,
    resolved_at: new Date().toISOString(),
    resolved_by: user.id,
  });

  try {
    await createNotification({
      userId: requesterId,
      type: 'system',
      title: 'Community request declined',
      body: decisionNote?.trim()
        ? `Your request to join ${community.name} was declined. Note: ${decisionNote.trim()}`
        : `Your request to join ${community.name} was declined.`,
      linkUrl: `/community`,
    });
  } catch {
    // notifications are non-critical
  }

  return { ok: true };
}
