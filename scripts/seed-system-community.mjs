#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SYSTEM_PUBLIC_COMMUNITY_ID = 'general-public';
const SYSTEM_PUBLIC_COMMUNITY_NAME = 'General';
const SYSTEM_PUBLIC_COMMUNITY_DESCRIPTION =
  'Open to everyone. Lower-trust community with tighter usage limits.';
const DEFAULT_COMMUNITY_TYPE = 'verified';
const DEFAULT_COMMUNITY_MEMBERSHIP_MODE = 'open';

function loadLocalEnvFiles() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) continue;

    const contents = fs.readFileSync(candidatePath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      const unquoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;

      process.env[key] = unquoted;
    }
  }
}

function getServerEnv() {
  loadLocalEnvFiles();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(getServerEnv()),
    });
  }

  return getFirestore();
}

function normalizeInviteCode(inviteCode) {
  if (typeof inviteCode !== 'string') return null;

  const normalized = inviteCode.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function toIsoString(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function normalizeName(value, fallback) {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function buildInviteCodeBase(name, docId) {
  const source = `${name}-${docId}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const trimmed = source.slice(0, 10);
  return trimmed.length > 0 ? trimmed : 'COMMUNITY';
}

function generateUniqueInviteCode(name, docId, usedInviteCodes) {
  const base = buildInviteCodeBase(name, docId);
  let suffix = 0;

  while (true) {
    const suffixText = suffix === 0 ? '' : String(suffix);
    const prefixLength = Math.max(3, 10 - suffixText.length);
    const candidate = `${base.slice(0, prefixLength)}${suffixText}`;

    if (!usedInviteCodes.has(candidate)) {
      usedInviteCodes.add(candidate);
      return candidate;
    }

    suffix += 1;
  }
}

function hasChanged(currentValue, nextValue) {
  return currentValue !== nextValue;
}

function buildDesiredCommunityDoc(doc, usedInviteCodes, nowIso) {
  const data = doc.data() ?? {};
  const isSystem = doc.id === SYSTEM_PUBLIC_COMMUNITY_ID;
  const existingCreatedAt =
    doc.createTime?.toDate().toISOString() ??
    doc.updateTime?.toDate().toISOString() ??
    nowIso;

  const name = normalizeName(
    data.name,
    isSystem ? SYSTEM_PUBLIC_COMMUNITY_NAME : 'Community'
  );
  const description =
    typeof data.description === 'string'
      ? data.description
      : isSystem
        ? SYSTEM_PUBLIC_COMMUNITY_DESCRIPTION
        : null;

  const normalizedExistingInviteCode = isSystem ? null : normalizeInviteCode(data.invite_code);
  let inviteCode = normalizedExistingInviteCode;
  let regeneratedInviteCode = false;

  if (inviteCode) {
    if (usedInviteCodes.has(inviteCode)) {
      inviteCode = generateUniqueInviteCode(name, doc.id, usedInviteCodes);
      regeneratedInviteCode = true;
    } else {
      usedInviteCodes.add(inviteCode);
    }
  }

  return {
    desired: {
      name,
      description,
      type: isSystem ? 'public' : data.type === 'public' ? 'public' : DEFAULT_COMMUNITY_TYPE,
      membership_mode: isSystem
        ? 'open'
        : data.membership_mode === 'approval_required'
          ? 'approval_required'
          : DEFAULT_COMMUNITY_MEMBERSHIP_MODE,
      listed: isSystem ? true : typeof data.listed === 'boolean' ? data.listed : false,
      is_system: isSystem,
      invite_code: inviteCode,
      created_by: typeof data.created_by === 'string' ? data.created_by : null,
      created_at: toIsoString(data.created_at, existingCreatedAt),
    },
    regeneratedInviteCode,
  };
}

function diffCommunityDoc(current, desired) {
  const updates = {};

  for (const [key, value] of Object.entries(desired)) {
    if (hasChanged(current[key], value)) {
      updates[key] = value;
    }
  }

  return updates;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();
  const communitiesRef = db.collection('communities');
  const snap = await communitiesRef.get();
  const docs = [...snap.docs].sort((a, b) => a.id.localeCompare(b.id));
  const nowIso = new Date().toISOString();
  const usedInviteCodes = new Set();

  const summary = {
    scanned: docs.length,
    updated: 0,
    createdSystemCommunity: false,
    normalizedInviteCodes: 0,
    regeneratedInviteCodes: 0,
    backfilledMetadata: 0,
    demotedSystemFlags: 0,
  };

  for (const doc of docs) {
    const { desired, regeneratedInviteCode } = buildDesiredCommunityDoc(doc, usedInviteCodes, nowIso);
    const current = doc.data() ?? {};
    const updates = diffCommunityDoc(current, desired);

    if (
      Object.keys(updates).length > 0 ||
      typeof current.updated_at !== 'string' ||
      current.updated_at.length === 0
    ) {
      updates.updated_at = nowIso;
    }

    const updateKeys = Object.keys(updates);

    if (updateKeys.length === 0) {
      continue;
    }

    summary.updated += 1;
    if (Object.prototype.hasOwnProperty.call(updates, 'invite_code') && regeneratedInviteCode) {
      summary.regeneratedInviteCodes += 1;
    } else if (Object.prototype.hasOwnProperty.call(updates, 'invite_code')) {
      summary.normalizedInviteCodes += 1;
    }

    if (
      updateKeys.some((key) =>
        ['name', 'description', 'type', 'membership_mode', 'listed', 'is_system', 'created_by', 'created_at'].includes(key)
      )
    ) {
      summary.backfilledMetadata += 1;
    }

    if (current.is_system === true && desired.is_system === false) {
      summary.demotedSystemFlags += 1;
    }

    console.log(
      `${dryRun ? '[dry-run] ' : ''}update communities/${doc.id}: ${updateKeys.join(', ')}`
    );

    if (!dryRun) {
      await doc.ref.set(updates, { merge: true });
    }
  }

  const systemDoc = await communitiesRef.doc(SYSTEM_PUBLIC_COMMUNITY_ID).get();
  if (!systemDoc.exists) {
    summary.createdSystemCommunity = true;
    const payload = {
      name: SYSTEM_PUBLIC_COMMUNITY_NAME,
      description: SYSTEM_PUBLIC_COMMUNITY_DESCRIPTION,
      type: 'public',
      membership_mode: 'open',
      listed: true,
      is_system: true,
      invite_code: null,
      created_by: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    console.log(
      `${dryRun ? '[dry-run] ' : ''}create communities/${SYSTEM_PUBLIC_COMMUNITY_ID}`
    );

    if (!dryRun) {
      await communitiesRef.doc(SYSTEM_PUBLIC_COMMUNITY_ID).set(payload, { merge: true });
    }
  }

  console.log('');
  console.log('Community data safety run complete.');
  console.log(`Scanned communities: ${summary.scanned}`);
  console.log(`Updated communities: ${summary.updated}`);
  console.log(`Created system public community: ${summary.createdSystemCommunity ? 'yes' : 'no'}`);
  console.log(`Invite codes normalized: ${summary.normalizedInviteCodes}`);
  console.log(`Invite codes regenerated: ${summary.regeneratedInviteCodes}`);
  console.log(`Communities backfilled with metadata: ${summary.backfilledMetadata}`);
  console.log(`Non-canonical system flags cleared: ${summary.demotedSystemFlags}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'apply'}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
