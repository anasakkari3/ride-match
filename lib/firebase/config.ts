'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { clientEnv } from '@/lib/config/env';

const firebaseConfig = {
  apiKey: clientEnv.apiKey,
  authDomain: clientEnv.authDomain,
  projectId: clientEnv.projectId,
  storageBucket: clientEnv.storageBucket,
  messagingSenderId: clientEnv.messagingSenderId,
  appId: clientEnv.appId,
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}
