"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import type { KycDocument } from "@/types";

const DOC_TYPES = [
  { value: "id_proof", label: "Government ID (Required)" },
  { value: "address_proof", label: "Address Proof" },
  { value: "pan_card", label: "PAN Card" },
  { value: "selfie", label: "Selfie with ID" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function KycPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [kycStatus, setKycStatus] = useState<string>("not_started");
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [previewDoc, setPreviewDoc] = useState<KycDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStatus = () =>
    api.getKycStatus().then((data: any) => {
      setKycStatus(data.kyc_status);
      setDocuments(data.documents || []);
    }).catch(() => {});

  useEffect(() => {
    if (!user) return;
    fetchStatus();
  }, [user]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      await api.uploadKycDocument(selectedType, file);
      setMessage("Document uploaded successfully.");
      if (fileRef.current) fileRef.current.value = "";
      fetchStatus();
    } catch (e: any) {
      setMessage(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      await api.submitKyc();
      setMessage("KYC submitted for review.");
      fetchStatus();
    } catch (e: any) {
      setMessage(e.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Please log in.</div>;
  if (user.role !== "player" && user.role !== "admin") {
    return <div className="max-w-3xl mx-auto px-4 py-8">KYC verification is for players only.</div>;
  }

  const statusColors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const docStatusColors: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const docPreviewUrl = (docId: string) =>
    `${API_URL}/api/v1/kyc/documents/${docId}/file`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
      <p className="text-gray-600 mb-8">
        Complete identity verification to receive rewards as a player.
      </p>

      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Verification Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[kycStatus]}`}>
            {kycStatus.replace("_", " ")}
          </span>
        </div>
        {kycStatus === "approved" && (
          <p className="text-green-600 mt-2 text-sm">Your identity has been verified. You can receive rewards.</p>
        )}
        {kycStatus === "rejected" && (
          <p className="text-red-600 mt-2 text-sm">Your verification was rejected. Please re-upload documents.</p>
        )}
      </div>

      {kycStatus !== "approved" && (
        <>
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Upload Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  File <span className="text-gray-400">(JPEG, PNG, WebP, or PDF - max 10MB)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {documents.length > 0 && kycStatus !== "pending" && (
            <div className="mb-8">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit KYC for Review"}
              </button>
            </div>
          )}
        </>
      )}

      {message && (
        <p className={`mb-6 text-sm ${message.includes("success") || message.includes("submitted") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      {documents.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Uploaded Documents</h2>
          </div>
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-none">
                      {doc.file_name} &middot; {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {previewDoc?.id === doc.id ? "Hide" : "Preview"}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${docStatusColors[doc.status]}`}>
                      {doc.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {previewDoc?.id === doc.id && (
                  <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50 p-2">
                    {doc.content_type?.startsWith("image/") ? (
                      <img
                        src={docPreviewUrl(doc.id)}
                        alt={doc.file_name}
                        className="max-w-full max-h-64 mx-auto rounded"
                      />
                    ) : (
                      <div className="text-center py-4">
                        <a
                          href={docPreviewUrl(doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open PDF: {doc.file_name}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
