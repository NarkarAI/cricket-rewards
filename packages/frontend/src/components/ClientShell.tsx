"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SocketProvider } from "@/components/realtime/SocketProvider";
import { NotificationToast } from "@/components/realtime/NotificationToast";
import { Navbar } from "@/components/ui/Navbar";

export function ClientShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-8">
                <span className="text-xl font-bold text-primary">CricRewards</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <Navbar />
        <NotificationToast />
        <main className="min-h-screen">{children}</main>
      </SocketProvider>
    </AuthProvider>
  );
}
