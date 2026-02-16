import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SocketProvider } from "@/components/realtime/SocketProvider";
import { NotificationToast } from "@/components/realtime/NotificationToast";
import { Navbar } from "@/components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CricRewards - Cricket Fan Rewards Platform",
  description: "Reward your favorite cricket players with real money",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <NotificationToast />
            <main className="min-h-screen">{children}</main>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
