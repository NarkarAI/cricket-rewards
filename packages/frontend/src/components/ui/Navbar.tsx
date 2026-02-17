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
    document.cookie = "firebase-auth-token=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary">
            CricRewards
          </Link>

          {/* Mobile: just avatar or login link (navigation is in BottomNav) */}
          <div className="md:hidden flex items-center">
            {loading ? (
              <span className="text-gray-400 text-sm">...</span>
            ) : user ? (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                {(user.display_name || user.email)?.[0]?.toUpperCase() || "?"}
              </div>
            ) : (
              <Link href="/login" className="text-sm text-primary font-medium">
                Login
              </Link>
            )}
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/players" className="text-gray-600 hover:text-gray-900 text-sm">
              Players
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                  Dashboard
                </Link>
                <Link href="/wallet" className="text-gray-600 hover:text-gray-900 text-sm">
                  Wallet
                </Link>
                <Link href="/rewards" className="text-gray-600 hover:text-gray-900 text-sm">
                  Rewards
                </Link>
                {user.role === "player" && (
                  <Link href="/kyc" className="text-gray-600 hover:text-gray-900 text-sm">
                    KYC
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <span className="text-gray-400 text-sm">Loading...</span>
            ) : user ? (
              <>
                <span className="text-sm text-gray-600 truncate max-w-[120px]">{user.display_name || user.email}</span>
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
                <Link href="/register" className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">
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
