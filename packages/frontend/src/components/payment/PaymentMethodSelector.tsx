"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/razorpay";
import { api } from "@/lib/api";
import type { Reward } from "@/types";

interface Props {
  reward: Reward;
  geo: { country_code: string; currency: string };
  onSuccess: () => void;
  onError: (error: string) => void;
}

function StripeCheckoutForm({ onSuccess, onError }: { onSuccess: () => void; onError: (e: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/rewards" },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed");
    } else {
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50"
      >
        {processing ? "Processing..." : "Pay with Stripe"}
      </button>
    </form>
  );
}

export function PaymentMethodSelector({ reward, geo, onSuccess, onError }: Props) {
  const isIndia = geo.country_code === "IN";
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    if (isIndia) {
      loadRazorpay().catch(() => onError("Failed to load Razorpay"));
    }
  }, [isIndia, onError]);

  if (isIndia && reward.razorpay_order_id && reward.razorpay_key_id) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Pay via UPI, Card, or Net Banking</p>
        <button
          onClick={() => {
            openRazorpayCheckout({
              key: reward.razorpay_key_id!,
              amount: parseInt(reward.gross_amount) * 100,
              currency: reward.currency,
              order_id: reward.razorpay_order_id!,
              name: "CricRewards",
              description: `Reward for player`,
              handler: async (response) => {
                try {
                  await api.verifyRazorpay({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    reward_id: reward.reward_id,
                  });
                  onSuccess();
                } catch (err: any) {
                  onError(err.message);
                }
              },
              theme: { color: "#2563eb" },
            });
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Pay with Razorpay
        </button>
      </div>
    );
  }

  if (reward.stripe_client_secret) {
    return (
      <Elements stripe={getStripe()} options={{ clientSecret: reward.stripe_client_secret }}>
        <StripeCheckoutForm onSuccess={onSuccess} onError={onError} />
      </Elements>
    );
  }

  return <p className="text-gray-500">Initializing payment...</p>;
}
