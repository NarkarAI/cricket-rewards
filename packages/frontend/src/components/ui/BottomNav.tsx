"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { logout } from "@/lib/firebase";
import { getSportFromPath, sportPath } from "@/lib/sportConfig";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
  );
}

function PlayersIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const HIDDEN_PATHS = ["/login", "/register"];

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (loading) return null;

  const sport = getSportFromPath(pathname);
  const sp = (path: string) => sportPath(sport, path);

  const tabs = [
    { label: "Home", href: `/${sport}`, icon: HomeIcon, matchPaths: [`/${sport}`] },
    { label: "Players", href: sp("/players"), icon: PlayersIcon, matchPaths: [`/${sport}/players`, `/${sport}/reward`] },
    { label: "Dashboard", href: sp("/dashboard"), icon: DashboardIcon, matchPaths: [`/${sport}/dashboard`, `/${sport}/rewards`], requiresAuth: true },
    { label: "Wallet", href: sp("/wallet"), icon: WalletIcon, matchPaths: [`/${sport}/wallet`], requiresAuth: true },
    { label: "More", href: "#more", icon: ({ active }: { active: boolean }) => <MoreIcon />, matchPaths: [] as string[] },
  ];

  const isActive = (tab: typeof tabs[0]): boolean => {
    if (tab.href === `/${sport}` && pathname === `/${sport}`) return true;
    if (tab.href === `/${sport}`) return false;
    return tab.matchPaths.some((p) => pathname.startsWith(p));
  };

  const handleLogout = async () => {
    await logout();
    document.cookie = "firebase-auth-token=; path=/; max-age=0";
    setMoreOpen(false);
    router.push(`/${sport}`);
  };

  const visibleTabs = user ? tabs : tabs.filter((t) => !("requiresAuth" in t && t.requiresAuth));

  return (
    <>
      {/* Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMoreOpen(false)} />
      )}

      {/* More menu sheet */}
      {moreOpen && (
        <div className="fixed left-2 right-2 z-50 bg-white border rounded-2xl shadow-lg px-2 py-3 space-y-1 md:hidden"
             style={{ bottom: "calc(var(--bottom-nav-height) + var(--sab) + 0.5rem)" }}>
          {user ? (
            <>
              <div className="px-3 py-2 border-b mb-2">
                <p className="text-sm font-medium truncate">{user.display_name || user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <Link href={sp("/profile")} onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </Link>
              <Link href={sp("/rewards")} onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Rewards History
              </Link>
              {user.role === "player" && (
                <Link href={sp("/kyc")} onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  KYC Verification
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-red-50 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 p-2">
              <Link href="/login" onClick={() => setMoreOpen(false)}
                className="flex-1 text-center py-3 border rounded-lg text-sm font-medium">
                Login
              </Link>
              <Link href="/register" onClick={() => setMoreOpen(false)}
                className="flex-1 text-center py-3 bg-primary text-white rounded-lg text-sm font-medium">
                Register
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden"
           style={{ paddingBottom: "var(--sab)" }}>
        <div className="flex items-center justify-around" style={{ height: "var(--bottom-nav-height)" }}>
          {visibleTabs.map((tab) => {
            if (tab.href === "#more") {
              return (
                <button key="more" onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${moreOpen ? "text-primary" : "text-gray-400"}`}>
                  <tab.icon active={moreOpen} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }
            const active = isActive(tab);
            return (
              <Link key={tab.href} href={tab.href} onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${active ? "text-primary" : "text-gray-400"}`}>
                <tab.icon active={active} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
