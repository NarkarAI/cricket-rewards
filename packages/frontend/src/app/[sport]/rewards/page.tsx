"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import { sportPath } from "@/lib/sportConfig";
import type { PaginatedResponse, RewardSummary } from "@/types";

export default function RewardsPage() {
  const params = useParams();
  const sport = params.sport as string;
  const sp = (path: string) => sportPath(sport, path);
  const { user, loading: authLoading } = useAuthContext();
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [sent, setSent] = useState<PaginatedResponse<RewardSummary> | null>(null);
  const [received, setReceived] = useState<PaginatedResponse<RewardSummary> | null>(null);
  const [sentPage, setSentPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    api.getSentRewards(sentPage).then(setSent).catch(() => {});
  }, [user, sentPage]);

  useEffect(() => {
    if (!user) return;
    api.getReceivedRewards(receivedPage).then(setReceived).catch(() => {});
  }, [user, receivedPage]);

  if (authLoading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Please log in.</div>;

  const data = tab === "sent" ? sent : received;
  const currentPage = tab === "sent" ? sentPage : receivedPage;
  const setPage = tab === "sent" ? setSentPage : setReceivedPage;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rewards</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("sent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "sent" ? "bg-primary text-white" : "bg-white border text-gray-600"
          }`}
        >
          Sent ({sent?.total || 0})
        </button>
        <button
          onClick={() => setTab("received")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "received" ? "bg-primary text-white" : "bg-white border text-gray-600"
          }`}
        >
          Received ({received?.total || 0})
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        {data?.items?.length ? (
          <>
            <div className="divide-y">
              {data.items.map((r) => (
                <Link
                  key={r.reward_id}
                  href={sp(`/rewards/${r.reward_id}`)}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {tab === "sent" ? `To: ${r.receiver_name}` : `From: ${r.sender_name}`}
                      </p>
                      {r.message && (
                        <p className="text-sm text-gray-500 mt-1">&quot;{r.message}&quot;</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {r.currency} {tab === "sent" ? r.gross_amount : r.net_amount}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : r.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {data.total_pages > 1 && (
              <div className="p-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {data.total_pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p: number) => Math.min(data.total_pages, p + 1))}
                    disabled={currentPage >= data.total_pages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="p-8 text-center text-gray-500">
            {tab === "sent" ? "No rewards sent yet." : "No rewards received yet."}
          </p>
        )}
      </div>
    </div>
  );
}
