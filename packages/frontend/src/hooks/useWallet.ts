"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Wallet, LedgerEntry, PaginatedResponse } from "@/types";

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<PaginatedResponse<LedgerEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const data = await api.getWallet();
      setWallet(data);
    } catch {
      setWallet(null);
    }
    setLoading(false);
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const data = await api.getWalletHistory(page);
      setHistory(data);
    } catch {
      setHistory(null);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { wallet, history, loading, fetchWallet, fetchHistory };
}
