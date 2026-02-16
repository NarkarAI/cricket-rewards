export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: "spectator" | "player" | "admin";
  sport: string;
  team: string;
  bio: string;
  is_verified_player: boolean;
  geo: GeoInfo;
  kyc_status: string;
}

export interface GeoInfo {
  country_code: string;
  currency: string;
  detected_ip: string;
}

export interface Player {
  id: string;
  display_name: string;
  avatar_url: string;
  sport: string;
  team: string;
  bio: string;
  is_verified_player: boolean;
  total_rewards_received: number;
  total_amount_received: string;
}

export interface Reward {
  id: string;
  reward_id: string;
  sender_id: string;
  receiver_id: string;
  gross_amount: string;
  fee_amount: string;
  net_amount: string;
  currency: string;
  message: string;
  is_public: boolean;
  payment_gateway: string;
  status: string;
  created_at: string;
  stripe_client_secret?: string;
  razorpay_order_id?: string;
  razorpay_key_id?: string;
}

export interface RewardSummary {
  id: string;
  reward_id: string;
  sender_name: string;
  receiver_name: string;
  gross_amount: string;
  net_amount: string;
  currency: string;
  message: string;
  status: string;
  created_at: string;
}

export interface Wallet {
  user_id: string;
  currency: string;
  available_balance: string;
  pending_balance: string;
  held_balance: string;
  lifetime_received: string;
  lifetime_sent: string;
}

export interface LedgerEntry {
  entry_id: string;
  entry_type: string;
  direction: "credit" | "debit";
  amount: string;
  currency: string;
  balance_after: string;
  description: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface KycDocument {
  id: string;
  document_type: string;
  status: string;
  created_at: string;
}
