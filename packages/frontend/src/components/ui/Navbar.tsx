"use client";

import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { logout } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary">
              CricRewards
            </Link>
            <Link href="/players" className="text-gray-600 hover:text-gray-900">
              Players
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/wallet" className="text-gray-600 hover:text-gray-900">
                  Wallet
                </Link>
                <Link href="/rewards" className="text-gray-600 hover:text-gray-900">
                  Rewards
                </Link>
                {user.role === "player" && (
                  <Link href="/kyc" className="text-gray-600 hover:text-gray-900">
                    KYC
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : user ? (
              <>
                <span className="text-sm text-gray-600">{user.display_name || user.email}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.role}</span>
                <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
