import { requireCompletedProfile } from '@/lib/auth/onboarding';
import { getMyCommunities, listCommunities } from '@/lib/services/community';
import { getMyCommunityMembershipState } from '@/lib/services/community-requests';
import CommunityExplorer from './CommunityExplorer';

export default async function CommunityPage() {
  await requireCompletedProfile('/community');

  const [joinedMemberships, listedCommunities] = await Promise.all([
    getMyCommunities(),
    listCommunities({ listedOnly: true }),
  ]);

  const joinedCommunities = joinedMemberships.map((membership) => {
    const role: 'admin' | 'member' = membership.role === 'admin' ? 'admin' : 'member';
    return {
      ...membership.community,
      role,
    };
  });

  const joinedRoleMap = new Map<string, 'admin' | 'member'>(
    joinedMemberships.map((membership) => {
      const role: 'admin' | 'member' = membership.role === 'admin' ? 'admin' : 'member';
      return [membership.community_id, role];
    })
  );

  const exploreCommunities = await Promise.all(
    listedCommunities.map(async (community) => {
      if (joinedRoleMap.has(community.id)) {
        return {
          ...community,
          membershipState: 'member' as const,
          role: joinedRoleMap.get(community.id),
        };
      }

      const membershipState = await getMyCommunityMembershipState(community.id);
      return {
        ...community,
        membershipState: membershipState.state,
        role: membershipState.state === 'member' ? membershipState.role : undefined,
        decisionNote: membershipState.state === 'rejected' ? membershipState.decisionNote : null,
        resolvedAt: membershipState.state === 'rejected' ? membershipState.resolvedAt : null,
      };
    })
  );

  return (
    <CommunityExplorer
      joinedCommunities={joinedCommunities}
      exploreCommunities={exploreCommunities}
    />
  );
}
