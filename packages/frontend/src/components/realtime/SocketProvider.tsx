"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthContext } from "@/components/auth/AuthProvider";
import type { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const socketState = useSocket();

  // Only connect when authenticated
  if (!user) {
    return (
      <SocketContext.Provider value={{ socket: null, connected: false }}>
        {children}
      </SocketContext.Provider>
    );
  }

  return (
    <SocketContext.Provider value={socketState}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
