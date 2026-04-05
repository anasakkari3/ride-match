'use server';

import { revalidatePath } from 'next/cache';
import {
  getCommunityById,
  getCommunityByInviteCode,
  joinCommunity as joinCommunityService,
} from '@/lib/services/community';
import {
  cancelJoinRequest,
  submitJoinRequest,
} from '@/lib/services/community-requests';

type CommunityActionResult =
  | {
      ok: true;
      mode: 'joined' | 'requested' | 'already_member' | 'request_cancelled';
      community: {
        id: string;
        name: string;
        type: 'verified' | 'public';
        membership_mode: 'open' | 'approval_required';
      };
    }
  | { ok: false; error: string };

function toActionError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function revalidateCommunitySurfaces() {
  revalidatePath('/community');
  revalidatePath('/app');
  revalidatePath('/trips/new');
}

export async function joinCommunity(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await joinCommunityService(communityId, { joinedVia: 'open_join' });
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'joined',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function requestCommunityJoin(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await submitJoinRequest(communityId);
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'requested',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function cancelCommunityRequest(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await cancelJoinRequest(communityId);
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'request_cancelled',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function submitInviteCode(inviteCode: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityByInviteCode(inviteCode.trim());
    if (!community) {
      return { ok: false, error: 'Invite code not found.' };
    }

    if (community.membership_mode === 'open') {
      await joinCommunityService(community.id, { joinedVia: 'invite' });
      revalidateCommunitySurfaces();
      return {
        ok: true,
        mode: 'joined',
        community: {
          id: community.id,
          name: community.name,
          type: community.type,
          membership_mode: community.membership_mode,
        },
      };
    }

    await submitJoinRequest(community.id);
    revalidateCommunitySurfaces();
    return {
      ok: true,
      mode: 'requested',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
