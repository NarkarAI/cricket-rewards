"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PaginatedResponse, LedgerEntry } from "@/types";

export default function AdminTransactionsPage() {
  const [data, setData] = useState<PaginatedResponse<LedgerEntry> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.admin.listTransactions(page).then(setData).catch(() => {});
  }, [page]);

  const entryTypeLabels: Record<string, string> = {
    reward_received: "Reward Received",
    reward_sent: "Reward Sent",
    platform_fee: "Platform Fee",
    withdrawal: "Withdrawal",
    withdrawal_reversal: "Withdrawal Reversed",
    refund: "Refund",
    adjustment: "Adjustment",
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Transaction Ledger</h2>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Entry ID</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Direction</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-right p-3">Balance After</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items?.map((entry) => (
              <tr key={entry.entry_id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-500">
                  {entry.entry_id.substring(0, 8)}...
                </td>
                <td className="p-3">{entryTypeLabels[entry.entry_type] || entry.entry_type}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    entry.direction === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {entry.direction}
                  </span>
                </td>
                <td className="p-3 text-right font-medium">
                  {entry.currency} {entry.amount}
                </td>
                <td className="p-3 text-right text-gray-500">
                  {entry.currency} {entry.balance_after}
                </td>
                <td className="p-3 text-gray-500 max-w-xs truncate">{entry.description}</td>
                <td className="p-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
              </tr>
            )) || (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">No transactions found.</td></tr>
            )}
          </tbody>
        </table>

        {data && data.total_pages > 1 && (
          <div className="p-3 border-t flex justify-between items-center">
            <span className="text-xs text-gray-500">Page {page} of {data.total_pages} ({data.total} entries)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded text-xs disabled:opacity-50">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.total_pages}
                className="px-3 py-1 border rounded text-xs disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
