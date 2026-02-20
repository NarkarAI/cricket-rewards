"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { PlayerVerificationBadges } from "@/components/ui/VerificationBadges";
import type { Player, PaginatedResponse } from "@/types";

export default function PlayersPage() {
  const { user, refreshUser } = useAuthContext();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Become a player form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    sport: "Cricket",
    teams: [""],
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      try {
        const result = await api.listPlayers(page, search);
        setData(result);
      } catch {}
      setLoading(false);
    }
    fetchPlayers();
  }, [page, search]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        display_name: prev.display_name || user.display_name || "",
      }));
    }
  }, [user]);

  const handleBecomePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const validTeams = formData.teams.filter(t => t.trim());
    if (!formData.display_name.trim() || validTeams.length === 0) {
      setFormError("Name and at least one team are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.becomePlayer({ ...formData, teams: validTeams });
      await refreshUser();
      setShowForm(false);
      // Refresh players list
      const result = await api.listPlayers(1, "");
      setData(result);
      setPage(1);
      setSearch("");
    } catch (err: any) {
      setFormError(err.message || "Failed to register as player.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSpectator = user && user.role === "spectator";
  const isPlayer = user && user.role === "player";
  const needsKyc = isPlayer && user.kyc_status !== "approved";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Cricket Players</h1>
        {isSpectator && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark"
          >
            {showForm ? "Cancel" : "Become a Player"}
          </button>
        )}
      </div>

      {/* KYC Banner for players */}
      {needsKyc && (
        <div className={`rounded-xl border p-4 mb-6 ${
          user.kyc_status === "rejected"
            ? "bg-red-50 border-red-200"
            : user.kyc_status === "pending"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {user.kyc_status === "not_started" && "Complete KYC to receive rewards"}
                {user.kyc_status === "pending" && "KYC verification is under review"}
                {user.kyc_status === "rejected" && "KYC verification was rejected"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {user.kyc_status === "not_started" && "You need to verify your identity before fans can send you rewards."}
                {user.kyc_status === "pending" && "Your documents are being reviewed. This usually takes 24-48 hours."}
                {user.kyc_status === "rejected" && "Please re-upload your documents with correct information."}
              </p>
            </div>
            {user.kyc_status !== "pending" && (
              <Link
                href="/kyc"
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-primary-dark"
              >
                {user.kyc_status === "rejected" ? "Re-upload Documents" : "Start KYC"}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Player already registered banner */}
      {isPlayer && user.kyc_status === "approved" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold">You are a verified player</span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">KYC Approved</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Fans can find you here and send you rewards.</p>
        </div>
      )}

      {/* Become a Player Form */}
      {showForm && isSpectator && (
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Register as a Player</h2>
          <p className="text-gray-600 text-sm mb-4">
            Fill in your details to become a player. After registering, you&apos;ll need to complete KYC verification to receive rewards.
          </p>

          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{formError}</div>
          )}

          <form onSubmit={handleBecomePlayer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Your public name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team(s) *</label>
                {formData.teams.map((team, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={team}
                      onChange={(e) => {
                        const updated = [...formData.teams];
                        updated[idx] = e.target.value;
                        setFormData({ ...formData, teams: updated });
                      }}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="e.g., Mumbai Indians"
                      required={idx === 0}
                    />
                    {formData.teams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.teams.filter((_, i) => i !== idx);
                          setFormData({ ...formData, teams: updated });
                        }}
                        className="text-red-500 text-sm px-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, teams: [...formData.teams, ""] })}
                  className="text-primary text-sm hover:underline"
                >
                  + Add another team
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                placeholder="Tell fans about yourself..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register as Player"}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search players by name, sport, or team..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md border rounded-lg px-4 py-2"
        />
      </div>

      {/* Players List */}
      {loading ? (
        <p className="text-gray-500">Loading players...</p>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((player: any) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition"
              >
                <div className="flex items-center gap-4 mb-3">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                        {player.display_name?.[0] || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{player.display_name}</h3>
                        <PlayerVerificationBadges user={player} compact />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {player.teams?.length > 0 ? player.teams.map((t: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t}</span>
                        )) : (
                          <span className="text-sm text-gray-400">No team</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{player.sport}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{player.bio}</p>
                  {player.is_verified_player && (
                    <p className="text-sm text-primary mt-2">
                      {player.total_rewards_received} rewards received
                    </p>
                  )}
              </Link>
            ))}
          </div>

          {data.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {data.page} of {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-2">No verified players yet.</p>
          {!user && (
            <p className="text-sm text-gray-400">
              <Link href="/register" className="text-primary hover:underline">Register</Link> and become a player to appear here.
            </p>
          )}
          {isSpectator && !showForm && (
            <p className="text-sm text-gray-400">
              Be the first! Click &quot;Become a Player&quot; above to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
