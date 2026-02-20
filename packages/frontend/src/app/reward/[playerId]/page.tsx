"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
function uuidv4(): string {
  return crypto.randomUUID();
}
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useGeo } from "@/hooks/useGeo";
import { PaymentMethodSelector } from "@/components/payment/PaymentMethodSelector";
import { countryCodeToFlag } from "@/lib/profileThemes";
import type { Player, Reward } from "@/types";

export default function RewardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const router = useRouter();
  const { user } = useAuthContext();
  const { geo } = useGeo();

  const [player, setPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [reward, setReward] = useState<Reward | null>(null);
  const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPlayer(playerId).then(setPlayer).catch(() => {});
  }, [playerId]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p>Please log in to send a reward.</p>
      </div>
    );
  }

  const currency = geo?.currency || "USD";
  const gateway = geo?.country_code === "IN" ? "razorpay" : "stripe";

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await api.createReward({
        receiver_id: playerId,
        amount: parseFloat(amount),
        currency,
        message,
        is_public: isPublic,
        idempotency_key: idempotencyKey,
        payment_gateway: gateway,
      });
      setReward(result);
      setStep("payment");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Send Reward</h1>
      {player && (
        <p className="text-gray-600 mb-6">
          To: <span className="font-semibold">
            {player.nationality && <span className="mr-1">{countryCodeToFlag(player.nationality)}</span>}
            {player.display_name}
          </span> ({player.teams?.join(", ") || "No team"})
        </p>
      )}

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      {step === "amount" && (
        <form onSubmit={handleCreateReward} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({currency})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={currency === "INR" ? 50 : 1}
              step="0.01"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="text-sm">Show publicly on player&apos;s profile</span>
          </label>

          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p>Payment method: <span className="font-medium">{gateway === "stripe" ? "Stripe (Card/Apple Pay)" : "Razorpay (UPI/Card)"}</span></p>
            <p>Platform fee: 5%</p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Creating reward..." : "Continue to Payment"}
          </button>
        </form>
      )}

      {step === "payment" && reward && geo && (
        <PaymentMethodSelector
          reward={reward}
          geo={geo}
          onSuccess={() => setStep("success")}
          onError={(msg) => setError(msg)}
        />
      )}

      {step === "success" && (
        <div className="text-center py-8">
          <div className="text-green-600 text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-bold mb-2">Payment Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your reward will be delivered once payment is confirmed.
          </p>
          <button
            onClick={() => router.push("/rewards")}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            View My Rewards
          </button>
        </div>
      )}
    </div>
  );
}
