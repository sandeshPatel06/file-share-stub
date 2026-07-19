import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";

let _app: App | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  // Dynamic require so this only runs server-side at request time
  const { initializeApp, getApps, cert } = require("firebase-admin/app");

  if (getApps().length > 0) {
    _app = getApps()[0] as App;
    return _app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\\\n/g, "\n") || '';

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
    throw new Error('Missing Firebase Admin env vars. Copy .env.local.example → .env.local and fill from Firebase Console (Project Settings > Service Accounts).');
  }

  _app = initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  });

  return _app;
}

export function getAdminDb(): Firestore {
  if (!_db) {
    const { getFirestore } = require("firebase-admin/firestore");
    _db = getFirestore(getAdminApp());
  }
  return _db!;
}

export function getAdminStorage(): Storage {
  if (!_storage) {
    const { getStorage } = require("firebase-admin/storage");
    _storage = getStorage(getAdminApp());
  }
  return _storage!;
}

// Convenience getters (use these in route handlers)
export const adminDb = new Proxy({} as Firestore, { get: (_, p) => (getAdminDb() as any)[p] });
export const adminStorage = new Proxy({} as Storage, { get: (_, p) => (getAdminStorage() as any)[p] });

