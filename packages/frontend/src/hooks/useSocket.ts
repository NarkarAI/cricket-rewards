"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const socket = await connectSocket();
        if (mounted) {
          socketRef.current = socket;
          setConnected(true);

          socket.on("disconnect", () => {
            if (mounted) setConnected(false);
          });
        }
      } catch {
        if (mounted) setConnected(false);
      }
    }

    connect();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  return { socket: socketRef.current, connected };
}
