"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, onAuthStateChanged, requestPushPermission, type FirebaseUser } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { User } from "@/types";

function setAuthCookie(token: string | null) {
  if (token) {
    document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
  } else {
    document.cookie = "firebase-auth-token=; path=/; max-age=0";
  }
}

async function registerPushToken() {
  try {
    const token = await requestPushPermission();
    if (token) {
      await api.saveFcmToken(token);
    }
  } catch {
    // Push registration is best-effort
  }
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setAuthCookie(token);
          try {
            const me = await api.getMe();
            setUser(me);
            registerPushToken();
          } catch {
            // User exists in Firebase but not backend (e.g. new Google sign-in)
            // Auto-register them
            try {
              await api.register(token, fbUser.displayName || "");
              const me = await api.getMe();
              setUser(me);
              registerPushToken();
            } catch {
              setUser(null);
              setAuthCookie(null);
            }
          }
        } catch {
          setUser(null);
          setAuthCookie(null);
        }
      } else {
        setUser(null);
        setAuthCookie(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  return { firebaseUser, user, loading, refreshUser };
}
