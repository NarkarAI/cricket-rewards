"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GeoInfo } from "@/types";

export function useGeo() {
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      try {
        const data = await api.getGeo();
        setGeo(data);
      } catch {
        setGeo({ country_code: "US", currency: "USD", detected_ip: "" });
      }
      setLoading(false);
    }
    detect();
  }, []);

  return { geo, loading };
}
