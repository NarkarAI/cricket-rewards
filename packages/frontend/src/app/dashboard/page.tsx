"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import type { Wallet } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recentSent, setRecentSent] = useState<any>(null);
  const [recentReceived, setRecentReceived] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api.getWallet().then(setWallet).catch(() => {});
    api.getSentRewards(1).then(setRecentSent).catch(() => {});
    api.getReceivedRewards(1).then(setRecentReceived).catch(() => {});
  }, [user]);

  if (authLoading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Please log in.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.display_name || user.email}</p>

      {wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold">
              {wallet.currency} {wallet.available_balance}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold">
              {wallet.currency} {wallet.pending_balance}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-sm text-gray-500">Lifetime Received</p>
            <p className="text-2xl font-bold">
              {wallet.currency} {wallet.lifetime_received}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Sent</h2>
            <Link href="/rewards" className="text-primary text-sm">View all</Link>
          </div>
          {recentSent?.items?.slice(0, 5).map((r: any) => (
            <div key={r.reward_id} className="bg-white p-3 rounded border mb-2">
              <div className="flex justify-between">
                <span>{r.receiver_name}</span>
                <span className="font-medium">{r.currency} {r.gross_amount}</span>
              </div>
              <span className={`text-xs ${r.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                {r.status}
              </span>
            </div>
          )) || <p className="text-gray-500 text-sm">No rewards sent yet.</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Received</h2>
            <Link href="/rewards" className="text-primary text-sm">View all</Link>
          </div>
          {recentReceived?.items?.slice(0, 5).map((r: any) => (
            <div key={r.reward_id} className="bg-white p-3 rounded border mb-2">
              <div className="flex justify-between">
                <span>{r.sender_name}</span>
                <span className="font-medium">{r.currency} {r.net_amount}</span>
              </div>
              <span className={`text-xs ${r.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                {r.status}
              </span>
            </div>
          )) || <p className="text-gray-500 text-sm">No rewards received yet.</p>}
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/players" className="bg-primary text-white px-6 py-2 rounded-lg">
          Browse Players
        </Link>
        <Link href="/wallet" className="border border-primary text-primary px-6 py-2 rounded-lg">
          Wallet Details
        </Link>
      </div>
    </div>
  );
}
