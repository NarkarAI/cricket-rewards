"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SPORTS, SPORT_SLUGS } from "@/lib/sportConfig";

const sports = SPORT_SLUGS.map((slug) => SPORTS[slug]);

export default function LandingPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % sports.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  const current = sports[active];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero slideshow with fan images */}
      <div
        className="relative rounded-2xl overflow-hidden mb-8"
        style={{ minHeight: 400 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background images — all preloaded, only active one visible */}
        {sports.map((sport, i) => (
          <div
            key={sport.slug}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: i === active ? 1 : 0,
              backgroundImage: `url(${sport.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 text-center text-white">
          <p
            className="text-sm sm:text-base font-semibold uppercase tracking-widest mb-3"
            style={{ color: current.color, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
          >
            {current.name}
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
            {current.tagline}
          </h1>
          <p className="text-base sm:text-lg text-gray-200 max-w-xl mx-auto mb-8 drop-shadow">
            Show your appreciation by sending real money rewards to{" "}
            {current.label.toLowerCase()} players. Secure payments with real-time
            notifications.
          </p>
          <Link
            href={`/${current.slug}/players`}
            className="inline-block font-semibold px-8 py-3 rounded-lg text-lg transition-colors shadow-lg"
            style={{
              backgroundColor: current.color,
              color: "#fff",
            }}
          >
            Browse {current.label} Players
          </Link>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {sports.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sport tabs */}
      <div className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-5">
          Choose Your Sport
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {sports.map((sport) => (
            <button
              key={sport.slug}
              onClick={() => router.push(`/${sport.slug}`)}
              className="group relative px-5 py-3 rounded-xl border-2 bg-white font-semibold text-sm sm:text-base transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                borderColor: sport.color,
                color: sport.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = sport.color;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.color = sport.color;
              }}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-10">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Secure Payments</h3>
          <p className="text-gray-600">
            Stripe for US users, Razorpay for India. 3D Secure, UPI, cards, and
            more.
          </p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Real-Time Updates</h3>
          <p className="text-gray-600">
            Instant notifications when your reward is delivered. Live wallet
            updates.
          </p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-3">Transparent Fees</h3>
          <p className="text-gray-600">
            Only 5% platform fee. Full financial ledger. Track every
            transaction.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-block bg-primary text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
