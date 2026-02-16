"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface KycReviewItem {
  id: string;
  user_id: string;
  document_type: string;
  status: string;
  submitted_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminKycReviewPage() {
  const [pending, setPending] = useState<KycReviewItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = () =>
    api.admin.getPendingKyc().then((data: any) => setPending(data.items || data || [])).catch(() => {});

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (docId: string, status: "approved" | "rejected") => {
    setProcessing(docId);
    try {
      await api.admin.reviewKyc(docId, {
        status,
        review_notes: reviewNotes[docId] || "",
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
      <h2 className="text-xl font-bold mb-4">KYC Pending Review</h2>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          No pending KYC documents to review.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium">{doc.user_name || doc.user_id}</p>
                  {doc.user_email && <p className="text-sm text-gray-500">{doc.user_email}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Document: <span className="font-medium">{doc.document_type.replace("_", " ")}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(doc.submitted_at).toLocaleString()}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  {doc.status}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Review Notes</label>
                <textarea
                  value={reviewNotes[doc.id] || ""}
                  onChange={(e) => setReviewNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(doc.id, "approved")}
                  disabled={processing === doc.id}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(doc.id, "rejected")}
                  disabled={processing === doc.id}
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
