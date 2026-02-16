"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface AmlFlagged {
  user_id: string;
  user_name: string;
  user_email: string;
  pending_balance: string;
  currency: string;
  flags: string[];
  flagged_rewards: number;
}

export default function AdminAmlPage() {
  const [flagged, setFlagged] = useState<AmlFlagged[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchFlagged = () =>
    api.admin.getAmlFlagged().then((data: any) => setFlagged(data.items || data || [])).catch(() => {});

  useEffect(() => { fetchFlagged(); }, []);

  const handleReview = async (userId: string, action: "approve" | "reject") => {
    setProcessing(userId);
    try {
      await api.admin.reviewAml(userId, {
        action,
        notes: notes[userId] || "",
      });
      fetchFlagged();
    } catch (e: any) {
      alert(e.message || "Review failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">AML Flagged Accounts</h2>

      {flagged.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          No AML-flagged accounts requiring review.
        </div>
      ) : (
        <div className="space-y-4">
          {flagged.map((item) => (
            <div key={item.user_id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">{item.user_name}</p>
                  <p className="text-sm text-gray-500">{item.user_email}</p>
                  <p className="text-sm mt-2">
                    Pending Balance:{" "}
                    <span className="font-bold text-yellow-600">
                      {item.currency} {item.pending_balance}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">{item.flagged_rewards} flagged reward(s)</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.flags?.map((flag: string) => (
                    <span key={flag} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Review Notes</label>
                <textarea
                  value={notes[item.user_id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [item.user_id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Document your review findings..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(item.user_id, "approve")}
                  disabled={processing === item.user_id}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Clear - Release Funds
                </button>
                <button
                  onClick={() => handleReview(item.user_id, "reject")}
                  disabled={processing === item.user_id}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Escalate - Freeze Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
