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
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _messaging: Messaging | undefined;

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

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!_messaging) {
    try {
      _messaging = getMessaging(getFirebaseApp());
    } catch {
      return null;
    }
  }
  return _messaging;
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

/**
 * Request push notification permission and return FCM token.
 * Returns null if permission denied or messaging unavailable.
 */
export async function requestPushPermission(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register the FCM-specific service worker (separate from the PWA sw.js)
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-cloud-messaging-push-scope" }
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    return token || null;
  } catch (err) {
    console.error("Failed to get push token:", err);
    return null;
  }
}

/**
 * Listen for foreground FCM messages.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, callback);
}
