"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import { KycStepBadge } from "@/components/ui/VerificationBadges";
import type { KycDocument, KycFullStatus } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STEPS = ["Country", "Personal Info", "Documents", "Bank Details"];

const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

function getDocTypes(country: string) {
  if (country === "IN") {
    return [
      { value: "pan_card", label: "PAN Card" },
      { value: "id_proof", label: "Aadhaar / Government ID" },
      { value: "selfie", label: "Selfie with ID" },
    ];
  }
  return [
    { value: "id_proof", label: "Government ID (Driver's License / Passport)" },
    { value: "address_proof", label: "Address Proof" },
    { value: "selfie", label: "Selfie with ID" },
  ];
}

export default function KycPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<KycFullStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Step 1: Country
  const [country, setCountry] = useState("");

  // Step 2: Personal info
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [ssnLast4, setSsnLast4] = useState("");
  const [govIdType, setGovIdType] = useState("drivers_license");

  // Step 3: Documents
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4: Bank
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");

  const fetchStatus = async (autoNavigate = false) => {
    try {
      const data = await api.getKycFullStatus();
      setStatus(data);
      setDocuments(data.documents || []);
      // Pre-fill from saved profile
      if (data.kyc_profile) {
        const p = data.kyc_profile;
        setCountry(p.country);
        setFullName(p.full_name);
        setDob(p.date_of_birth);
        setAddress1(p.address_line1);
        setAddress2(p.address_line2 || "");
        setCity(p.city);
        setState(p.state);
        setPostalCode(p.postal_code);
        setPanNumber(p.pan_number || "");
        setAadhaarLast4(p.aadhaar_last4 || "");
        setSsnLast4(p.ssn_last4 || "");
        setGovIdType(p.gov_id_type || "drivers_license");
        if (data.bank_account) {
          setBankName(data.bank_account.account_holder_name);
          setIfscCode(data.bank_account.ifsc_code || "");
          setRoutingNumber(data.bank_account.routing_number || "");
          setAccountType(data.bank_account.account_type || "checking");
          setUpiId(data.bank_account.upi_id || "");
        }
        // Only auto-navigate on initial page load
        if (autoNavigate) {
          if (data.bank_account) {
            setStep(3);
          } else if (data.documents.length > 0) {
            setStep(2);
          } else {
            setStep(1);
          }
        }
      } else if (!data.kyc_profile && autoNavigate) {
        setStep(0);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStatus(true);
  }, [user]);

  const showMsg = (msg: string, type: "success" | "error" = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  // Step 1 handler
  const selectCountry = (c: string) => {
    setCountry(c);
    setStep(1);
  };

  // Step 2 handler
  const handleSaveProfile = async () => {
    if (!fullName.trim() || !dob || !address1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      showMsg("Please fill in all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.submitKycProfile({
        country,
        full_name: fullName,
        date_of_birth: dob,
        address_line1: address1,
        address_line2: address2,
        city,
        state,
        postal_code: postalCode,
        pan_number: country === "IN" ? panNumber : undefined,
        aadhaar_last4: country === "IN" ? aadhaarLast4 : undefined,
        ssn_last4: country === "US" ? ssnLast4 : undefined,
        gov_id_type: country === "US" ? govIdType : undefined,
      });
      showMsg("Personal information saved.");
      setStep(2);
      fetchStatus();
    } catch (e: any) {
      showMsg(e.message || "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Step 3 handler
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadDocType) {
      showMsg("Please select a document type and file.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showMsg("File too large. Maximum 10MB.", "error");
      return;
    }
    setUploading(true);
    try {
      await api.uploadKycDocument(uploadDocType, file);
      showMsg("Document uploaded.");
      if (fileRef.current) fileRef.current.value = "";
      fetchStatus();
    } catch (e: any) {
      showMsg(e.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitDocs = async () => {
    setSaving(true);
    try {
      await api.submitKyc();
      showMsg("Documents submitted for review.");
      fetchStatus();
    } catch (e: any) {
      showMsg(e.message || "Submission failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Step 4 handler
  const handleSaveBank = async () => {
    if (!bankName.trim() || !accountNumber.trim()) {
      showMsg("Please fill in all required fields.", "error");
      return;
    }
    if (accountNumber !== confirmAccount) {
      showMsg("Account numbers do not match.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.submitBankAccount({
        country,
        account_holder_name: bankName,
        account_number: accountNumber,
        ifsc_code: country === "IN" ? ifscCode : undefined,
        upi_id: country === "IN" ? upiId || undefined : undefined,
        routing_number: country === "US" ? routingNumber : undefined,
        account_type: country === "US" ? accountType : undefined,
      });
      showMsg("Bank details saved. Pending verification.");
      fetchStatus();
    } catch (e: any) {
      showMsg(e.message || "Failed to save bank details.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;
  }
  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Please log in.</div>;
  }
  if (user.role !== "player" && user.role !== "admin") {
    return <div className="max-w-2xl mx-auto px-4 py-8">KYC verification is for players only.</div>;
  }

  const docTypes = getDocTypes(country);
  const uploadedTypes = new Set(documents.map((d) => d.document_type));
  const stateList = country === "IN" ? INDIA_STATES : US_STATES;
  const profileSaved = !!status?.kyc_profile;
  const bankSaved = !!status?.bank_account;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">KYC Verification</h1>
      <p className="text-gray-500 text-sm mb-6">Complete identity and bank verification to receive rewards.</p>

      {/* Progress Bar */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded-full transition-colors ${
                i <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <p className={`text-[10px] sm:text-xs mt-1 text-center ${
              i === step ? "text-blue-600 font-medium" : "text-gray-400"
            }`}>
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* Status Badges */}
      {status && (
        <div className="flex flex-wrap gap-2 mb-6">
          <KycStepBadge completed={profileSaved} label="Profile" />
          <KycStepBadge completed={documents.length >= docTypes.length} label="Documents" />
          <KycStepBadge completed={bankSaved} label="Bank" />
          {status.pan_verified && <KycStepBadge completed label="PAN Verified" />}
          {status.bank_verified && <KycStepBadge completed label="Bank Verified" />}
          {status.kyc_completed && <KycStepBadge completed label="KYC Completed" />}
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          messageType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message}
        </div>
      )}

      {/* Step 0: Country Selection */}
      {step === 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Select Your Country</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => selectCountry("IN")}
              className={`p-6 rounded-xl border-2 text-center transition-all ${
                country === "IN" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-4xl block mb-2">🇮🇳</span>
              <span className="font-medium">India</span>
              <span className="block text-xs text-gray-500 mt-1">₹ INR</span>
            </button>
            <button
              onClick={() => selectCountry("US")}
              className={`p-6 rounded-xl border-2 text-center transition-all ${
                country === "US" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-4xl block mb-2">🇺🇸</span>
              <span className="font-medium">USA</span>
              <span className="block text-xs text-gray-500 mt-1">$ USD</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Personal Information</h2>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{country === "IN" ? "🇮🇳 India" : "🇺🇸 USA"}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5"
                placeholder="As on official ID"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address Line 1 *</label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5"
                >
                  <option value="">Select</option>
                  {stateList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {country === "IN" ? "PIN Code *" : "ZIP Code *"}
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5"
                placeholder={country === "IN" ? "6-digit PIN" : "5-digit ZIP"}
                maxLength={country === "IN" ? 6 : 10}
              />
            </div>

            {/* India-specific */}
            {country === "IN" && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full border rounded-lg px-3 py-2.5 uppercase"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Aadhaar Last 4 Digits</label>
                  <input
                    type="text"
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ""))}
                    className="w-full border rounded-lg px-3 py-2.5"
                    placeholder="Last 4 digits"
                    maxLength={4}
                  />
                </div>
              </>
            )}

            {/* USA-specific */}
            {country === "US" && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">SSN Last 4 Digits</label>
                  <input
                    type="text"
                    value={ssnLast4}
                    onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, ""))}
                    className="w-full border rounded-lg px-3 py-2.5"
                    placeholder="Last 4 digits"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Government ID Type</label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5"
                  >
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-2.5 border rounded-lg text-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Document Uploads */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">Upload Documents</h2>
            <div className="space-y-3 mb-6">
              {docTypes.map((dt) => {
                const uploaded = documents.find((d) => d.document_type === dt.value);
                return (
                  <div key={dt.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{dt.label}</p>
                      {uploaded && (
                        <p className="text-xs text-gray-400">{uploaded.file_name}</p>
                      )}
                    </div>
                    <div>
                      {uploaded ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          uploaded.status === "approved" ? "bg-green-100 text-green-700" :
                          uploaded.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {uploaded.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5"
                >
                  <option value="">Select type</option>
                  {docTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} {uploadedTypes.has(t.value) ? "(Replace)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  File <span className="text-gray-400">(JPEG, PNG, WebP, PDF - max 10MB)</span>
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
                disabled={uploading || !uploadDocType}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 border rounded-lg text-gray-600"
            >
              Back
            </button>
            {documents.length > 0 && status?.kyc_status !== "pending" && status?.kyc_status !== "approved" && (
              <button
                onClick={handleSubmitDocs}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit for Review"}
              </button>
            )}
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium"
            >
              Continue to Bank Details
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Bank Details */}
      {step === 3 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Bank Verification</h2>
            {status?.bank_account && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status.bank_account.status === "verified" ? "bg-green-100 text-green-700" :
                status.bank_account.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {status.bank_account.status}
              </span>
            )}
          </div>

          {status?.bank_account && status.bank_account.status === "verified" ? (
            <div className="text-center py-4">
              <div className="text-green-600 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">Bank Account Verified</p>
              <p className="text-sm text-gray-500 mt-1">
                Account ending in ****{status.bank_account.account_number_last4}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status?.bank_account && status.bank_account.status === "rejected" && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  Bank verification was rejected. Please re-submit with correct details.
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5"
                  placeholder="Name as on bank account"
                />
              </div>

              {country === "IN" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="Bank account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Confirm Account Number *</label>
                    <input
                      type="text"
                      value={confirmAccount}
                      onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ""))}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="Re-enter account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full border rounded-lg px-3 py-2.5 uppercase"
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="yourname@upi"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Payouts via UPI / bank transfer in ₹ (INR)</p>
                </>
              )}

              {country === "US" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Routing Number *</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="9-digit routing number"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="Bank account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Confirm Account Number *</label>
                    <input
                      type="text"
                      value={confirmAccount}
                      onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ""))}
                      className="w-full border rounded-lg px-3 py-2.5"
                      placeholder="Re-enter account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Type *</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">Payouts via ACH bank transfer in $ (USD)</p>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 border rounded-lg text-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveBank}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Bank Details"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overall Status Summary */}
      {status?.kyc_completed && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-green-600 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-800">KYC Verification Complete</h3>
          <p className="text-sm text-green-600 mt-1">
            {country === "IN" ? "Verified in India 🇮🇳" : "Verified in the USA 🇺🇸"}
          </p>
        </div>
      )}
    </div>
  );
}
