"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { countryCodeToFlag, getBackgroundStyle } from "@/lib/profileThemes";
import type { Player, PaginatedResponse } from "@/types";

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as string;
  const { user } = useAuthContext();
  const [player, setPlayer] = useState<Player | null>(null);
  const [rewards, setRewards] = useState<PaginatedResponse<any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [p, r] = await Promise.all([
          api.getPlayer(playerId),
          api.getPlayerRewards(playerId),
        ]);
        setPlayer(p);
        setRewards(r);
      } catch {}
      setLoading(false);
    }
    fetch();
  }, [playerId]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!player) return <div className="max-w-4xl mx-auto px-4 py-8">Player not found.</div>;

  const bannerBg = getBackgroundStyle(player.profile_background, player.nationality);
  const flag = countryCodeToFlag(player.nationality);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
        {/* Banner */}
        <div
          className="h-36 sm:h-44 relative"
          style={{ background: bannerBg }}
        >
          {flag && (
            <span className="absolute top-3 right-4 text-3xl drop-shadow-lg">{flag}</span>
          )}
        </div>

        {/* Profile Content */}
        <div className="relative px-6 sm:px-8 pb-8">
          {/* Avatar overlapping the banner */}
          <div className="-mt-12 mb-4">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt={player.display_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-3xl border-4 border-white shadow-lg">
                {player.display_name?.[0] || "?"}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {player.display_name}
                {flag && <span className="ml-2 text-2xl">{flag}</span>}
              </h1>
              <p className="text-gray-500">{player.sport}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {player.teams?.length > 0 ? player.teams.map((t, i) => (
                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
                )) : (
                  <span className="text-xs text-gray-400">No team listed</span>
                )}
              </div>
              {player.is_verified_player && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">
                  Verified Player
                </span>
              )}
            </div>

            {user && user.id !== playerId && (
              <Link
                href={`/reward/${playerId}`}
                className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-dark font-semibold text-center"
              >
                Send Reward
              </Link>
            )}
          </div>

          {player.bio && (
            <p className="text-gray-700 mt-4">{player.bio}</p>
          )}
          <p className="text-primary font-semibold mt-3">
            {player.total_rewards_received} rewards received
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Public Rewards</h2>
      {rewards && rewards.items.length > 0 ? (
        <div className="space-y-3">
          {rewards.items.map((r: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{r.sender_name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {r.currency} {r.gross_amount}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.message && <p className="text-sm text-gray-600 mt-1">{r.message}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No public rewards yet.</p>
      )}
    </div>
  );
}
