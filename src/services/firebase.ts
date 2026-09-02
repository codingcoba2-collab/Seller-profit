import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  // Initialize Firestore with custom database ID
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.warn("Firebase initialization warning (will use resilient local persistence mode):", err);
}

export { app, db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc };

