"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import type { Reward } from "@/types";

export default function RewardDetailPage() {
  const { rewardId } = useParams<{ rewardId: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !rewardId) return;
    api.getReward(rewardId).then(setReward).catch((e) => setError(e.message));
  }, [user, rewardId]);

  if (authLoading) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return <div className="max-w-2xl mx-auto px-4 py-8">Please log in.</div>;
  if (error) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-600">{error}</div>;
  if (!reward) return <div className="max-w-2xl mx-auto px-4 py-8">Loading reward...</div>;

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
    initiated: "bg-blue-100 text-blue-700",
    payment_pending: "bg-yellow-100 text-yellow-700",
    payment_confirmed: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/rewards" className="text-primary text-sm mb-4 inline-block">
        &larr; Back to Rewards
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">Reward Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[reward.status] || "bg-gray-100"}`}>
            {reward.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Gross Amount</p>
            <p className="text-lg font-bold">{reward.currency} {reward.gross_amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net Amount (after fees)</p>
            <p className="text-lg font-bold">{reward.currency} {reward.net_amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fee</p>
            <p className="text-lg">{reward.currency} {reward.fee_amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Gateway</p>
            <p className="text-lg capitalize">{reward.payment_gateway}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-lg">{new Date(reward.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Visibility</p>
            <p className="text-lg">{reward.is_public ? "Public" : "Private"}</p>
          </div>
        </div>

        {reward.message && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Message</p>
            <p className="italic">&quot;{reward.message}&quot;</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-xs text-gray-400">
          <p>Reward ID: {reward.reward_id}</p>
        </div>
      </div>
    </div>
  );
}
