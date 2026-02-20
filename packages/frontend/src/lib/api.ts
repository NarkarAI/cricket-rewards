import { getIdToken } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(data.detail || "Request failed");
  }

  return res.json();
}

// Auth
export const api = {
  register: (firebaseToken: string, displayName: string) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ firebase_token: firebaseToken, display_name: displayName }),
    }),

  getMe: () => request<any>("/api/v1/auth/me"),

  // Users
  getUserProfile: () => request<any>("/api/v1/users/me"),
  updateProfile: (data: any) =>
    request("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  becomePlayer: (data: any) =>
    request<any>("/api/v1/users/me/become-player", { method: "POST", body: JSON.stringify(data) }),
  getGeo: () => request<any>("/api/v1/users/me/geo"),
  uploadAvatar: async (file: File) => {
    const token = await getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/users/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(data.detail || "Upload failed");
    }
    return res.json();
  },

  // Players
  listPlayers: (page = 1, search = "") =>
    request<any>(`/api/v1/players/?page=${page}&search=${encodeURIComponent(search)}`),
  getPlayer: (id: string) => request<any>(`/api/v1/players/${id}`),
  getPlayerRewards: (id: string, page = 1) =>
    request<any>(`/api/v1/players/${id}/rewards?page=${page}`),

  // Rewards
  createReward: (data: any) =>
    request<any>("/api/v1/rewards/", { method: "POST", body: JSON.stringify(data) }),
  getSentRewards: (page = 1) => request<any>(`/api/v1/rewards/sent?page=${page}`),
  getReceivedRewards: (page = 1) => request<any>(`/api/v1/rewards/received?page=${page}`),
  getReward: (id: string) => request<any>(`/api/v1/rewards/${id}`),

  // Payments
  verifyRazorpay: (data: any) =>
    request("/api/v1/payments/verify-razorpay", { method: "POST", body: JSON.stringify(data) }),

  // Wallet
  getWallet: () => request<any>("/api/v1/wallets/me"),
  getWalletHistory: (page = 1) => request<any>(`/api/v1/wallets/me/history?page=${page}`),
  withdraw: (amount: string, currency: string) =>
    request("/api/v1/wallets/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    }),

  // KYC
  getKycStatus: () => request<any>("/api/v1/kyc/status"),
  getKycFullStatus: () => request<any>("/api/v1/kyc/full-status"),
  submitKyc: () => request("/api/v1/kyc/submit", { method: "POST" }),
  submitKycProfile: (data: any) =>
    request("/api/v1/kyc/profile", { method: "POST", body: JSON.stringify(data) }),
  submitBankAccount: (data: any) =>
    request("/api/v1/kyc/bank", { method: "POST", body: JSON.stringify(data) }),
  getBankAccount: () => request<any>("/api/v1/kyc/bank"),
  uploadKycDocument: async (documentType: string, file: File) => {
    const token = await getIdToken();
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/kyc/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(data.detail || "Upload failed");
    }
    return res.json();
  },

  // Admin
  admin: {
    listUsers: (page = 1, role = "") =>
      request<any>(`/api/v1/admin/users?page=${page}&role=${role}`),
    updateUserRole: (id: string, data: any) =>
      request(`/api/v1/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify(data) }),
    getPendingKyc: () => request<any>("/api/v1/admin/kyc/pending"),
    reviewKyc: (id: string, data: any) =>
      request(`/api/v1/admin/kyc/${id}/review`, { method: "PATCH", body: JSON.stringify(data) }),
    listTransactions: (page = 1) => request<any>(`/api/v1/admin/transactions?page=${page}`),
    listRewards: (page = 1, status = "") =>
      request<any>(`/api/v1/admin/rewards?page=${page}&status=${status}`),
    listFees: () => request<any>("/api/v1/admin/fees"),
    createFee: (data: any) =>
      request("/api/v1/admin/fees", { method: "POST", body: JSON.stringify(data) }),
    getPendingBanks: () => request<any>("/api/v1/admin/kyc/banks/pending"),
    verifyBank: (id: string, data: any) =>
      request(`/api/v1/admin/kyc/banks/${id}/verify`, { method: "PATCH", body: JSON.stringify(data) }),
    getAmlFlagged: () => request<any>("/api/v1/admin/aml/flagged"),
    reviewAml: (userId: string, data: any) =>
      request(`/api/v1/admin/aml/${userId}/review`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};
