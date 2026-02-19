"use client";

interface BadgeProps {
  label: string;
  color: "green" | "blue" | "yellow" | "gray";
}

function Badge({ label, color }: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {(color === "green" || color === "blue") && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </span>
  );
}

interface PlayerVerificationBadgesProps {
  user: {
    is_verified_player?: boolean;
    kyc_status?: string;
    kyc_completed?: boolean;
    pan_verified?: boolean;
    bank_verified?: boolean;
    geo?: { country_code?: string };
    kyc_profile?: { country?: string };
  };
  compact?: boolean;
}

export function PlayerVerificationBadges({ user, compact = false }: PlayerVerificationBadgesProps) {
  const country = user.kyc_profile?.country || user.geo?.country_code || "";

  if (user.kyc_completed) {
    return (
      <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
        {country === "IN" && <Badge label="Verified in India" color="blue" />}
        {country === "US" && <Badge label="Verified in USA" color="blue" />}
        {!compact && user.pan_verified && <Badge label="PAN Verified" color="green" />}
        {!compact && user.bank_verified && <Badge label="Bank Verified" color="green" />}
      </div>
    );
  }

  if (user.is_verified_player) {
    return (
      <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
        <Badge label="Verified" color="green" />
        {!compact && user.pan_verified && <Badge label="PAN Verified" color="green" />}
        {!compact && user.bank_verified && <Badge label="Bank Verified" color="green" />}
      </div>
    );
  }

  if (user.kyc_status === "pending") {
    return <Badge label="KYC Pending" color="yellow" />;
  }

  return null;
}

export function KycStepBadge({ completed, label }: { completed: boolean; label: string }) {
  return completed ? (
    <Badge label={label} color="green" />
  ) : (
    <Badge label={label} color="gray" />
  );
}
