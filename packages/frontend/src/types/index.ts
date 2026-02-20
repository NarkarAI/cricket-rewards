export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: "spectator" | "player" | "admin";
  sport: string;
  teams: string[];
  bio: string;
  nationality: string;
  profile_background: string;
  is_verified_player: boolean;
  geo: GeoInfo;
  kyc_status: string;
  kyc_profile?: KycProfile;
  pan_verified?: boolean;
  bank_verified?: boolean;
  kyc_completed?: boolean;
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
  teams: string[];
  bio: string;
  nationality: string;
  profile_background: string;
  is_verified_player: boolean;
  kyc_status: string;
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
  file_name: string;
  content_type: string;
  status: string;
  created_at: string;
}

export interface KycProfile {
  country: string;
  full_name: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  pan_number?: string;
  aadhaar_last4?: string;
  ssn_last4?: string;
  gov_id_type?: string;
}

export interface BankAccount {
  id: string;
  country: string;
  account_holder_name: string;
  account_number_last4: string;
  ifsc_code?: string;
  upi_id?: string;
  routing_number?: string;
  account_type?: string;
  status: string;
  verification_method: string;
  created_at: string;
}

export interface KycFullStatus {
  kyc_status: string;
  kyc_profile: KycProfile | null;
  documents: KycDocument[];
  bank_account: BankAccount | null;
  pan_verified: boolean;
  bank_verified: boolean;
  kyc_completed: boolean;
}
