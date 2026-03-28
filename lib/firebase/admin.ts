import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getServerEnv } from '@/lib/config/env';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  const env = getServerEnv();

  return initializeApp({
    credential: cert(env),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
