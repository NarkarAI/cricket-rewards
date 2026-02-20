"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useSocketContext } from "@/components/realtime/SocketProvider";
import { api } from "@/lib/api";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import type { Wallet, LedgerEntry, PaginatedResponse } from "@/types";

export default function WalletPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { socket } = useSocketContext();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<PaginatedResponse<LedgerEntry> | null>(null);
  const [page, setPage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchWallet = () => api.getWallet().then(setWallet).catch(() => {});
  const fetchHistory = (p: number) => api.getWalletHistory(p).then(setHistory).catch(() => {});

  useEffect(() => {
    if (!user) return;
    fetchWallet();
    fetchHistory(page);
  }, [user, page]);

  useEffect(() => {
    if (!socket) return;
    const onWalletUpdate = () => {
      fetchWallet();
      fetchHistory(page);
    };
    socket.on("wallet:update", onWalletUpdate);
    return () => { socket.off("wallet:update", onWalletUpdate); };
  }, [socket, page]);

  const handleWithdraw = async () => {
    if (!wallet || !withdrawAmount) return;
    setWithdrawing(true);
    setMessage("");
    try {
      await api.withdraw(withdrawAmount, wallet.currency);
      setMessage("Withdrawal initiated successfully.");
      setWithdrawAmount("");
      fetchWallet();
      fetchHistory(page);
    } catch (e: any) {
      setMessage(e.message || "Withdrawal failed.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (authLoading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Please log in.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Wallet</h1>

      {wallet && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl border">
              <p className="text-xs sm:text-sm text-gray-500">Available</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(wallet.available_balance, wallet.currency)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl border">
              <p className="text-xs sm:text-sm text-gray-500">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">
                {formatCurrency(wallet.pending_balance, wallet.currency)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl border">
              <p className="text-xs sm:text-sm text-gray-500">Held</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(wallet.held_balance, wallet.currency)}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl border">
              <p className="text-xs sm:text-sm text-gray-500">Lifetime Received</p>
              <p className="text-lg sm:text-2xl font-bold truncate">
                {formatCurrency(wallet.lifetime_received, wallet.currency)}
              </p>
            </div>
          </div>

          {user.role === "player" && (
            <div className="bg-white p-6 rounded-xl border mb-8">
              <h2 className="text-lg font-bold mb-4">Withdraw Funds</h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Amount ({getCurrencySymbol(wallet.currency)})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {withdrawing ? "Processing..." : "Withdraw"}
                </button>
              </div>
              {message && (
                <p className={`mt-2 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                  {message}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Transaction History</h2>
        </div>
        {history?.items?.length ? (
          <>
            <div className="divide-y">
              {history.items.map((entry) => (
                <div key={entry.entry_id} className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{formatEntryType(entry.entry_type)}</p>
                    <p className="text-sm text-gray-500">{entry.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${entry.direction === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {entry.direction === "credit" ? "+" : "-"}{formatCurrency(entry.amount, entry.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {formatCurrency(entry.balance_after, entry.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Page {history.page} of {history.total_pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(history.total_pages, p + 1))}
                  disabled={page >= history.total_pages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="p-4 text-gray-500 text-sm">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}

function formatEntryType(type: string): string {
  const labels: Record<string, string> = {
    reward_received: "Reward Received",
    reward_sent: "Reward Sent",
    platform_fee: "Platform Fee",
    withdrawal: "Withdrawal",
    withdrawal_reversal: "Withdrawal Reversed",
    refund: "Refund",
    adjustment: "Adjustment",
  };
  return labels[type] || type;
}
