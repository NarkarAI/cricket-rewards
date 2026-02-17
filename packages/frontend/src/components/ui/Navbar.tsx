"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { logout } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    document.cookie = "firebase-auth-token=; path=/; max-age=0";
    setMenuOpen(false);
    router.push("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary" onClick={closeMenu}>
            CricRewards
          </Link>

          {/* Desktop nav */}
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
                <Link
                  href="/register"
                  className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/players" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
              Players
            </Link>
            {user && (
              <>
                <Link href="/dashboard" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/wallet" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
                  Wallet
                </Link>
                <Link href="/rewards" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
                  Rewards
                </Link>
                {user.role === "player" && (
                  <Link href="/kyc" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
                    KYC
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-primary">
                    Admin
                  </Link>
                )}
              </>
            )}

            <div className="border-t pt-3 mt-2">
              {loading ? (
                <span className="text-gray-400 text-sm">Loading...</span>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 truncate">{user.display_name || user.email}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.role}</span>
                  </div>
                  <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600 text-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={closeMenu} className="flex-1 text-center py-2 border rounded-lg text-sm">
                    Login
                  </Link>
                  <Link href="/register" onClick={closeMenu} className="flex-1 text-center py-2 bg-primary text-white rounded-lg text-sm">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
