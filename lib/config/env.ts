/**
 * Client-Side Environment
 * Prefix: NEXT_PUBLIC_
 * Safe to expose to the browser bundle.
 */
export const clientEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

// Validate Client Env at runtime
Object.entries(clientEnv).forEach(([key, value]) => {
  if (!value) {
    if (typeof window !== 'undefined') {
      console.error(`[Config Error] Missing Client Env Variable for Firebase: ${key}`);
    } else {
      console.warn(`[Config Warning] Missing Client Env Variable during SSR: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);
    }
  }
});

/**
 * Server-Side Environment
 * Only available in Node.js context (API routes, Server Actions, Server Components).
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('Attempted to access server environment variables on the client.');
  }

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
