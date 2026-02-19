"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface BankReviewItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  country: string;
  account_holder_name: string;
  account_number_last4: string;
  ifsc_code?: string;
  routing_number?: string;
  account_type?: string;
  upi_id?: string;
  status: string;
  created_at: string;
}

export default function AdminBankReviewPage() {
  const [pending, setPending] = useState<BankReviewItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = () =>
    api.admin.getPendingBanks().then((data: any) => setPending(data.items || data || [])).catch(() => {});

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (bankId: string, status: "verified" | "rejected") => {
    setProcessing(bankId);
    try {
      await api.admin.verifyBank(bankId, {
        status,
        review_notes: reviewNotes[bankId] || "",
      });
      fetchPending();
    } catch (e: any) {
      alert(e.message || "Review failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bank Accounts Pending Verification</h2>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          No pending bank accounts to review.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((bank) => (
            <div key={bank.id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium">{bank.user_name || bank.user_id}</p>
                  {bank.user_email && <p className="text-sm text-gray-500">{bank.user_email}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  bank.country === "IN" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {bank.country === "IN" ? "🇮🇳 India" : "🇺🇸 USA"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Account Holder</p>
                  <p className="font-medium">{bank.account_holder_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account Number</p>
                  <p className="font-medium">****{bank.account_number_last4}</p>
                </div>
                {bank.ifsc_code && (
                  <div>
                    <p className="text-gray-500">IFSC Code</p>
                    <p className="font-medium">{bank.ifsc_code}</p>
                  </div>
                )}
                {bank.routing_number && (
                  <div>
                    <p className="text-gray-500">Routing Number</p>
                    <p className="font-medium">{bank.routing_number}</p>
                  </div>
                )}
                {bank.account_type && (
                  <div>
                    <p className="text-gray-500">Account Type</p>
                    <p className="font-medium capitalize">{bank.account_type}</p>
                  </div>
                )}
                {bank.upi_id && (
                  <div>
                    <p className="text-gray-500">UPI ID</p>
                    <p className="font-medium">{bank.upi_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium">{new Date(bank.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Review Notes</label>
                <textarea
                  value={reviewNotes[bank.id] || ""}
                  onChange={(e) => setReviewNotes((prev) => ({ ...prev, [bank.id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(bank.id, "verified")}
                  disabled={processing === bank.id}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleReview(bank.id, "rejected")}
                  disabled={processing === bank.id}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
