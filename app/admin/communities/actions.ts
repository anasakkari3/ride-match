'use server';

import { revalidatePath } from 'next/cache';
import { approveJoinRequest, rejectJoinRequest } from '@/lib/services/community-requests';
import { updateReportStatus } from '@/lib/services/admin';

function revalidateAdminCommunityPages() {
  revalidatePath('/admin/communities');
  revalidatePath('/admin/analytics');
  revalidatePath('/community');
  revalidatePath('/notifications');
}

export async function approveJoinRequestAction(formData: FormData) {
  const communityId = String(formData.get('communityId') ?? '');
  const requesterId = String(formData.get('requesterId') ?? '');
  const decisionNote = String(formData.get('decisionNote') ?? '');
  await approveJoinRequest(communityId, requesterId, decisionNote);
  revalidateAdminCommunityPages();
}

export async function rejectJoinRequestAction(formData: FormData) {
  const communityId = String(formData.get('communityId') ?? '');
  const requesterId = String(formData.get('requesterId') ?? '');
  const decisionNote = String(formData.get('decisionNote') ?? '');
  await rejectJoinRequest(communityId, requesterId, decisionNote);
  revalidateAdminCommunityPages();
}

export async function markReportReviewedAction(formData: FormData) {
  const reportId = String(formData.get('reportId') ?? '');
  const communityId = String(formData.get('communityId') ?? '');
  const reviewNote = String(formData.get('reviewNote') ?? '');
  await updateReportStatus(reportId, communityId, 'reviewed', reviewNote);
  revalidateAdminCommunityPages();
}

export async function markReportResolvedAction(formData: FormData) {
  const reportId = String(formData.get('reportId') ?? '');
  const communityId = String(formData.get('communityId') ?? '');
  const reviewNote = String(formData.get('reviewNote') ?? '');
  await updateReportStatus(reportId, communityId, 'resolved', reviewNote);
  revalidateAdminCommunityPages();
}
