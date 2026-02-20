"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginWithEmail, loginWithGoogle } from "@/lib/firebase";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user: authUser, loading: authLoading } = useAuthContext();

  // Redirect if already authenticated (e.g. after Google sign-in)
  useEffect(() => {
    if (!authLoading && authUser) {
      router.push(redirect);
    }
  }, [authUser, authLoading, redirect, router]);

  const ensureBackendUser = async (firebaseToken: string, displayName: string) => {
    try {
      await api.getMe();
    } catch {
      await api.register(firebaseToken, displayName);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await loginWithEmail(email, password);
      const token = await cred.user.getIdToken();
      document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      await ensureBackendUser(token, cred.user.displayName || "");
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      const token = await cred.user.getIdToken();
      document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      await ensureBackendUser(token, cred.user.displayName || "");
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mt-8 sm:mt-16 p-6 sm:p-8 bg-white rounded-xl shadow-sm border mx-4 sm:mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 text-base"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-base"
        >
          Sign in with Google
        </button>
      </div>

      <p className="text-center mt-4 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-16 p-8 text-center text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
