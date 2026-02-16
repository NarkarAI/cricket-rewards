"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Player, PaginatedResponse } from "@/types";

export default function PlayersPage() {
  const [data, setData] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const result = await api.listPlayers(page, search);
        setData(result);
      } catch {}
      setLoading(false);
    }
    fetch();
  }, [page, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Cricket Players</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search players by name, sport, or team..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md border rounded-lg px-4 py-2"
        />
      </div>

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
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                    {player.display_name?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{player.display_name}</h3>
                    <p className="text-sm text-gray-500">{player.team}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{player.sport}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{player.bio}</p>
                <p className="text-sm text-primary mt-2">
                  {player.total_rewards_received} rewards received
                </p>
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
        <p className="text-gray-500">No players found.</p>
      )}
    </div>
  );
}
