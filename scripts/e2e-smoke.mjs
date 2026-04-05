#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';

const AUTH_COOKIE_NAME = 'firebase-session';
const AUTH_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

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

function getClientEnv() {
  loadLocalEnvFiles();

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');
  }

  return {
    apiKey,
  };
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(getServerEnv()),
  });
}

function getDb() {
  return getFirestore(getAdminApp());
}

function getAdminAuth() {
  return getAuth(getAdminApp());
}

function formatRunId() {
  const iso = new Date().toISOString().replace(/[-:.TZ]/g, '');
  return `smoke${iso.slice(0, 14)}`;
}

function formatDatetimeLocal(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function createPassword() {
  return 'SmokePass!123';
}

async function ensureAppReachable(appUrl) {
  const response = await fetch(`${appUrl}/login`, { redirect: 'manual' });
  if (!response.ok && response.status !== 307 && response.status !== 308) {
    throw new Error(
      `Ride-Match is not reachable at ${appUrl}. Start the app before running this smoke suite.`
    );
  }
}

async function createSessionCookieForUser(user) {
  const { apiKey } = getClientEnv();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Firebase ID token for ${user.email}: ${errorBody}`);
  }

  const payload = await response.json();
  const idToken = payload.idToken;
  if (typeof idToken !== 'string' || !idToken) {
    throw new Error(`Firebase sign-in did not return an ID token for ${user.email}`);
  }

  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: AUTH_COOKIE_MAX_AGE_MS,
  });
}

async function attachSessionCookie(context, appUrl, sessionCookie) {
  const url = new URL(appUrl);
  await context.addCookies([
    {
      name: AUTH_COOKIE_NAME,
      value: sessionCookie,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'Lax',
      expires: Math.floor((Date.now() + AUTH_COOKIE_MAX_AGE_MS) / 1000),
    },
  ]);
}

async function createSmokeUser(auth, db, input) {
  const password = createPassword();
  const userRecord = await auth.createUser({
    email: input.email,
    password,
    displayName: input.displayName,
  });

  const now = new Date().toISOString();
  await db.collection('users').doc(userRecord.uid).set({
    phone: null,
    display_name: input.displayName,
    avatar_url: null,
    rating_avg: 0,
    rating_count: 0,
    created_at: now,
    updated_at: now,
  });

  return {
    uid: userRecord.uid,
    email: input.email,
    password,
    displayName: input.displayName,
  };
}

async function createCommunity(db, input) {
  const now = new Date().toISOString();
  await db.collection('communities').doc(input.id).set({
    name: input.name,
    description: input.description ?? null,
    type: input.type ?? 'verified',
    membership_mode: input.membershipMode,
    listed: true,
    is_system: false,
    invite_code: null,
    created_by: input.createdBy ?? null,
    created_at: now,
    updated_at: now,
  });
}

async function addCommunityMembership(db, communityId, userId, role) {
  await db.collection('community_members').doc(`${communityId}_${userId}`).set({
    community_id: communityId,
    user_id: userId,
    role,
    joined_at: new Date().toISOString(),
    joined_via: 'open_join',
  });
}

async function expectUrl(page, predicate, message) {
  const ok = await page.waitForURL(predicate, { timeout: 15000 }).then(
    () => true,
    () => false
  );
  assert.ok(ok, message);
}

async function withStep(state, name, fn) {
  process.stdout.write(`- ${name}... `);

  try {
    await fn();
    state.results.push({ name, ok: true });
    process.stdout.write('PASS\n');
  } catch (error) {
    state.results.push({
      name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    process.stdout.write('FAIL\n');
    throw error;
  }
}

async function waitForConfirmedBooking(db, tripId, userId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const snap = await db
      .collection('bookings')
      .where('trip_id', '==', tripId)
      .where('passenger_id', '==', userId)
      .where('status', '==', 'confirmed')
      .limit(1)
      .get();

    if (!snap.empty) {
      return snap.docs[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

async function waitForCancelledBooking(db, tripId, userId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const snap = await db
      .collection('bookings')
      .where('trip_id', '==', tripId)
      .where('passenger_id', '==', userId)
      .where('status', '==', 'cancelled')
      .limit(1)
      .get();

    if (!snap.empty) {
      return snap.docs[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

async function waitForMessage(db, tripId, userId, content, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const snap = await db
      .collection('messages')
      .where('trip_id', '==', tripId)
      .where('sender_id', '==', userId)
      .where('content', '==', content)
      .limit(1)
      .get();

    if (!snap.empty) {
      return snap.docs[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

async function main() {
  const appUrl = (process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
  const runId = formatRunId();
  const db = getDb();
  const auth = getAdminAuth();
  const state = {
    runId,
    appUrl,
    results: [],
  };

  await ensureAppReachable(appUrl);

  const driverEmail = `ride-match-${runId}-driver@example.com`;
  const riderEmail = `ride-match-${runId}-rider@example.com`;
  const adminEmail = `ride-match-${runId}-admin@example.com`;
  const outsiderEmail = `ride-match-${runId}-outsider@example.com`;

  const driver = await createSmokeUser(auth, db, {
    email: driverEmail,
    displayName: `Smoke Driver ${runId}`,
  });
  const rider = await createSmokeUser(auth, db, {
    email: riderEmail,
    displayName: `Smoke Rider ${runId}`,
  });
  const admin = await createSmokeUser(auth, db, {
    email: adminEmail,
    displayName: `Smoke Admin ${runId}`,
  });
  const outsider = await createSmokeUser(auth, db, {
    email: outsiderEmail,
    displayName: `Smoke Outsider ${runId}`,
  });

  const openCommunity = {
    id: `smoke-open-${runId}`,
    name: `Smoke Open ${runId}`,
  };
  const approvalCommunity = {
    id: `smoke-approval-${runId}`,
    name: `Smoke Approval ${runId}`,
  };

  await createCommunity(db, {
    id: openCommunity.id,
    name: openCommunity.name,
    description: 'Open verified smoke-test community.',
    membershipMode: 'open',
    createdBy: admin.uid,
  });
  await createCommunity(db, {
    id: approvalCommunity.id,
    name: approvalCommunity.name,
    description: 'Approval-required verified smoke-test community.',
    membershipMode: 'approval_required',
    createdBy: admin.uid,
  });

  await addCommunityMembership(db, openCommunity.id, admin.uid, 'admin');
  await addCommunityMembership(db, approvalCommunity.id, admin.uid, 'admin');

  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
  });

  const contexts = {
    admin: await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' }),
    driver: await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' }),
    rider: await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' }),
    outsider: await browser.newContext({ baseURL: appUrl, serviceWorkers: 'block' }),
  };

  const pages = {
    admin: await contexts.admin.newPage(),
    driver: await contexts.driver.newPage(),
    rider: await contexts.rider.newPage(),
    outsider: await contexts.outsider.newPage(),
  };

  let tripId = null;
  let tripUrl = null;
  let chatUrl = null;
  let reportId = null;

  try {
    await withStep(state, 'admin authenticated session bootstrap', async () => {
      const sessionCookie = await createSessionCookieForUser(admin);
      await attachSessionCookie(contexts.admin, appUrl, sessionCookie);
    });

    await withStep(state, 'driver authenticated session bootstrap', async () => {
      const sessionCookie = await createSessionCookieForUser(driver);
      await attachSessionCookie(contexts.driver, appUrl, sessionCookie);
    });

    await withStep(state, 'rider authenticated session bootstrap', async () => {
      const sessionCookie = await createSessionCookieForUser(rider);
      await attachSessionCookie(contexts.rider, appUrl, sessionCookie);
    });

    await withStep(state, 'outsider authenticated session bootstrap', async () => {
      const sessionCookie = await createSessionCookieForUser(outsider);
      await attachSessionCookie(contexts.outsider, appUrl, sessionCookie);
    });

    await withStep(state, 'driver joins open community', async () => {
      await pages.driver.goto(`${appUrl}/community`, { waitUntil: 'domcontentloaded' });
      const card = pages.driver.getByTestId(`community-card-${openCommunity.id}`);
      await assert.doesNotReject(() => card.waitFor({ state: 'visible', timeout: 15000 }));
      await card.getByTestId(`join-community-${openCommunity.id}`).click();
      await expectUrl(
        pages.driver,
        (url) => url.pathname === '/app' && url.searchParams.get('community_id') === openCommunity.id,
        'driver did not land in the joined open community'
      );
    });

    await withStep(state, 'rider joins open community', async () => {
      await pages.rider.goto(`${appUrl}/community`, { waitUntil: 'domcontentloaded' });
      const card = pages.rider.getByTestId(`community-card-${openCommunity.id}`);
      await assert.doesNotReject(() => card.waitFor({ state: 'visible', timeout: 15000 }));
      await card.getByTestId(`join-community-${openCommunity.id}`).click();
      await expectUrl(
        pages.rider,
        (url) => url.pathname === '/app' && url.searchParams.get('community_id') === openCommunity.id,
        'rider did not land in the joined open community'
      );
    });

    await withStep(state, 'rider requests approval-required community', async () => {
      await pages.rider.goto(`${appUrl}/community`, { waitUntil: 'domcontentloaded' });
      const card = pages.rider.getByTestId(`community-card-${approvalCommunity.id}`);
      await assert.doesNotReject(() => card.waitFor({ state: 'visible', timeout: 15000 }));
      await card.getByTestId(`request-community-${approvalCommunity.id}`).click();
      await assert.doesNotReject(() => card.getByText('Request pending').waitFor({ timeout: 15000 }));

      const membershipDoc = await db
        .collection('community_members')
        .doc(`${approvalCommunity.id}_${rider.uid}`)
        .get();
      assert.equal(membershipDoc.exists, false, 'rider should not become a member before admin approval');

      const requestDoc = await db
        .collection('community_join_requests')
        .doc(`${approvalCommunity.id}_${rider.uid}`)
        .get();
      assert.equal(requestDoc.exists, true, 'pending join request was not created');
      assert.equal(requestDoc.data()?.status, 'pending', 'join request should stay pending before approval');
    });

    await withStep(state, 'non-admin cannot access community admin queue', async () => {
      await pages.outsider.goto(
        `${appUrl}/admin/communities?community_id=${encodeURIComponent(approvalCommunity.id)}`,
        { waitUntil: 'domcontentloaded' }
      );
      await expectUrl(
        pages.outsider,
        (url) => url.pathname !== '/admin/communities',
        'outsider should not retain access to the admin communities page'
      );
    });

    await withStep(state, 'admin approves the pending join request', async () => {
      await pages.admin.goto(
        `${appUrl}/admin/communities?community_id=${encodeURIComponent(approvalCommunity.id)}`,
        { waitUntil: 'domcontentloaded' }
      );
      const approveButton = pages.admin.getByTestId(`approve-request-${rider.uid}`);
      await assert.doesNotReject(() => approveButton.waitFor({ state: 'visible', timeout: 15000 }));
      await approveButton.click();
      await pages.admin.waitForLoadState('networkidle');

      const membershipDoc = await db
        .collection('community_members')
        .doc(`${approvalCommunity.id}_${rider.uid}`)
        .get();
      assert.equal(membershipDoc.exists, true, 'admin approval should create rider membership');

      const requestDoc = await db
        .collection('community_join_requests')
        .doc(`${approvalCommunity.id}_${rider.uid}`)
        .get();
      assert.equal(requestDoc.data()?.status, 'approved', 'join request should be marked approved');
    });

    await withStep(state, 'approved rider sees the new membership', async () => {
      await pages.rider.goto(`${appUrl}/community`, { waitUntil: 'domcontentloaded' });
      await assert.doesNotReject(() =>
        pages.rider
          .getByTestId(`joined-community-${approvalCommunity.id}`)
          .waitFor({ state: 'visible', timeout: 15000 })
      );
    });

    await withStep(state, 'driver creates a trip inside the open community', async () => {
      await pages.driver.goto(
        `${appUrl}/trips/new?community_id=${encodeURIComponent(openCommunity.id)}`,
        { waitUntil: 'domcontentloaded' }
      );

      const departure = new Date(Date.now() + 30 * 60 * 1000);
      await pages.driver.locator('#origin').fill(`Smoke Origin ${runId}`);
      await pages.driver.locator('#destination').fill(`Smoke Destination ${runId}`);
      await pages.driver.locator('#departure').fill(formatDatetimeLocal(departure));
      await pages.driver.getByTestId('publish-trip-button').click();
      await pages.driver.waitForURL(
        (url) => url.pathname.startsWith('/trips/') && url.pathname !== '/trips/new',
        { timeout: 20000 }
      );

      const currentUrl = new URL(pages.driver.url());
      const pathParts = currentUrl.pathname.split('/').filter(Boolean);
      tripId = pathParts[pathParts.length - 1];
      tripUrl = `${appUrl}/trips/${tripId}`;
      chatUrl = `${appUrl}/trips/${tripId}/chat`;

      assert.ok(tripId && tripId !== 'new', 'trip id was not captured from the create-trip redirect');
      await assert.doesNotReject(() =>
        pages.driver.locator(`text=${openCommunity.name}`).first().waitFor({ timeout: 15000 })
      );
    });

    await withStep(state, 'outsider cannot open a trip outside their communities', async () => {
      const response = await pages.outsider.goto(tripUrl, { waitUntil: 'domcontentloaded' });
      const bodyText = (await pages.outsider.locator('body').textContent().catch(() => '')) ?? '';
      const canSeeTripContent =
        bodyText.includes(`Smoke Origin ${runId}`) ||
        bodyText.includes(`Smoke Destination ${runId}`) ||
        (await pages.outsider.getByTestId('start-booking-button').count()) > 0;

      assert.ok(
        response?.status() === 404 || !canSeeTripContent,
        'outsider should not be able to view trip details or booking controls'
      );
    });

    await withStep(state, 'rider books a seat on the trip', async () => {
      await pages.rider.goto(tripUrl, { waitUntil: 'domcontentloaded' });
      const bookingButton = pages.rider.getByTestId('start-booking-button');
      const isBookingVisible = await bookingButton.isVisible().catch(() => false);
      if (!isBookingVisible) {
        const excerpt = ((await pages.rider.locator('body').textContent().catch(() => '')) ?? '')
          .replace(/\s+/g, ' ')
          .slice(0, 600);
        throw new Error(`Booking CTA missing. URL=${pages.rider.url()} Body=${excerpt}`);
      }

      await bookingButton.click();
      await pages.rider.getByTestId('confirm-booking-button').click();
      const bookingDoc = await waitForConfirmedBooking(db, tripId, rider.uid, 15000);
      assert.ok(bookingDoc, 'booking record was not created for the rider');
    });

    await withStep(state, 'booked rider can open chat and send a message', async () => {
      await pages.rider.goto(chatUrl, { waitUntil: 'domcontentloaded' });
      await pages.rider.waitForURL(/\/trips\/[^/]+\/chat/, { timeout: 15000 });

      const messageText = `Smoke chat ${runId}`;
      const chatInput = pages.rider.getByTestId('chat-message-input');
      const chatSendButton = pages.rider.getByTestId('chat-send-button');
      await chatInput.fill(messageText);
      await chatSendButton.click();
      const messageDoc = await waitForMessage(db, tripId, rider.uid, messageText, 15000);
      if (!messageDoc) {
        const disabled = await chatInput.isDisabled().catch(() => false);
        const placeholder = await chatInput.getAttribute('placeholder').catch(() => null);
        const excerpt = ((await pages.rider.locator('body').textContent().catch(() => '')) ?? '')
          .replace(/\s+/g, ' ')
          .slice(0, 500);
        throw new Error(
          `chat message was not persisted for the rider. disabled=${disabled} placeholder=${placeholder ?? 'n/a'} url=${pages.rider.url()} body=${excerpt}`
        );
      }
    });

    await withStep(state, 'trip participant can submit a report', async () => {
      await pages.rider.goto(tripUrl, { waitUntil: 'domcontentloaded' });
      await pages.rider.getByTestId('report-driver-button').click();
      await pages.rider.getByRole('radio', { name: 'Unsafe driving' }).check();
      await pages.rider.getByTestId('report-context-input').fill(`Smoke report ${runId}`);
      await pages.rider.getByTestId('submit-report-button').click();
      await assert.doesNotReject(() =>
        pages.rider.getByText('Report submitted', { exact: false }).waitFor({ timeout: 15000 })
      );

      const reportSnap = await db
        .collection('reports')
        .where('trip_id', '==', tripId)
        .where('reporter_id', '==', rider.uid)
        .where('reported_id', '==', driver.uid)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      assert.equal(reportSnap.empty, false, 'participant report should create a pending report');
      reportId = reportSnap.docs[0].id;
    });

    await withStep(state, 'admin can resolve the pending report in the correct community', async () => {
      await pages.admin.goto(
        `${appUrl}/admin/communities?community_id=${encodeURIComponent(openCommunity.id)}`,
        { waitUntil: 'domcontentloaded' }
      );
      const resolveButton = pages.admin.getByTestId(`mark-report-resolved-${reportId}`);
      await assert.doesNotReject(() => resolveButton.waitFor({ state: 'visible', timeout: 15000 }));
      await resolveButton.click();
      await pages.admin.waitForLoadState('networkidle');

      const reportDoc = await db.collection('reports').doc(reportId).get();
      assert.equal(reportDoc.data()?.status, 'resolved', 'admin should be able to resolve the pending report');
    });

    await withStep(state, 'rider cancels the booking', async () => {
      await pages.rider.goto(tripUrl, { waitUntil: 'domcontentloaded' });
      await pages.rider.getByTestId('start-cancel-booking-button').click();
      const confirmSelector = '[data-testid="confirm-cancel-booking-button"]';
      await pages.rider.waitForSelector(confirmSelector, { state: 'visible', timeout: 15000 });
      await pages.rider.waitForTimeout(250);
      await pages.rider.locator(confirmSelector).evaluate((node) => {
        node.click();
      });

      const cancelledBookingDoc = await waitForCancelledBooking(db, tripId, rider.uid, 15000);
      assert.ok(cancelledBookingDoc, 'booking record was not marked cancelled for the rider');
    });

    await withStep(state, 'cancelled rider loses chat access', async () => {
      await pages.rider.goto(chatUrl, { waitUntil: 'domcontentloaded' });
      await expectUrl(
        pages.rider,
        (url) => url.pathname === '/messages',
        'cancelled rider should be redirected away from trip chat'
      );
    });

    console.log('');
    console.log('Smoke suite passed.');
    console.log(`Run id: ${runId}`);
    console.log(`Trip id: ${tripId}`);
    console.log(`Open community: ${openCommunity.id}`);
    console.log(`Approval community: ${approvalCommunity.id}`);
  } catch (error) {
    console.log('');
    console.error('Smoke suite failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await Promise.all(
      Object.values(pages).map((page) => page.close().catch(() => undefined))
    );
    await Promise.all(
      Object.values(contexts).map((context) => context.close().catch(() => undefined))
    );
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
