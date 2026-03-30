'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';

import { clientEnv } from '@/lib/config/env';

const firebaseConfig = {
  apiKey: clientEnv.apiKey,
  authDomain: clientEnv.authDomain,
  projectId: clientEnv.projectId,
  storageBucket: clientEnv.storageBucket,
  messagingSenderId: clientEnv.messagingSenderId,
  appId: clientEnv.appId,
};

type FirebaseBrowserGlobals = typeof globalThis & {
  __rideMatchFirebaseApp?: FirebaseApp;
  __rideMatchFirebaseAuth?: Auth;
  __rideMatchFirestore?: Firestore;
};

const firebaseGlobals = globalThis as FirebaseBrowserGlobals;

function shouldForceLongPolling() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    process.env.NODE_ENV === 'development' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  );
}

function getFirebaseApp() {
  if (!firebaseGlobals.__rideMatchFirebaseApp) {
    firebaseGlobals.__rideMatchFirebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }

  return firebaseGlobals.__rideMatchFirebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseGlobals.__rideMatchFirebaseAuth) {
    firebaseGlobals.__rideMatchFirebaseAuth = getAuth(getFirebaseApp());
  }

  return firebaseGlobals.__rideMatchFirebaseAuth;
}

export function getFirebaseFirestore() {
  if (!firebaseGlobals.__rideMatchFirestore) {
    firebaseGlobals.__rideMatchFirestore = initializeFirestore(getFirebaseApp(), {
      // Keep one stable Firestore client in memory so dev HMR and route churn
      // do not recreate listen state while active snapshot subscriptions exist.
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: shouldForceLongPolling(),
    });
  }

  return firebaseGlobals.__rideMatchFirestore;
}
