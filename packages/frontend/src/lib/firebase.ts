import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

// Lazy getter - only call from client-side code
const auth: Auth = typeof window !== "undefined"
  ? getFirebaseAuth()
  : (new Proxy({} as Auth, { get: () => () => {} }));

export { auth, onAuthStateChanged };
export type { FirebaseUser };

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getFirebaseAuth(), provider);
}

export async function logout() {
  return signOut(getFirebaseAuth());
}

export async function getIdToken(): Promise<string | null> {
  const a = getFirebaseAuth();
  const user = a.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
