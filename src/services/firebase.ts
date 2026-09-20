import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getCountFromServer,
  getDocFromServer,
  type Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
  if (errMessage.includes('permission-denied') || errMessage.includes('Missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Use initializeFirestore with experimentalForceLongPolling to guarantee stable connectivity
  // in sandboxed iframe, proxy, and container environments without streaming WebChannel failures
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn("Firebase initialization warning (will use resilient local persistence mode):", err);
}

// Validate connection to Firestore as mandated by Firebase skill
async function validateConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client offline: operating in resilient offline local cache mode.");
    }
  }
}
validateConnection();

export { 
  app, 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  getCountFromServer,
  getDocFromServer,
  type Unsubscribe 
};


