"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithEmail, loginWithGoogle } from "@/lib/firebase";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user: authUser, loading: authLoading } = useAuthContext();

  // Redirect if already authenticated (e.g. after Google sign-in)
  useEffect(() => {
    if (!authLoading && authUser) {
      router.push("/cricket/dashboard");
    }
  }, [authUser, authLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await registerWithEmail(email, password);
      const token = await cred.user.getIdToken();
      document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      await api.register(token, name);
      if (phone.trim()) {
        await api.updateProfile({ phone_number: phone.trim() });
      }
      router.push("/cricket/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      const token = await cred.user.getIdToken();
      document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      await api.register(token, cred.user.displayName || "");
      if (phone.trim()) {
        await api.updateProfile({ phone_number: phone.trim() });
      }
      router.push("/cricket/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mt-8 sm:mt-16 p-6 sm:p-8 bg-white rounded-xl shadow-sm border mx-4 sm:mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
            required
          />
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 text-base"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-base"
        >
          Sign up with Google
        </button>
      </div>

      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
