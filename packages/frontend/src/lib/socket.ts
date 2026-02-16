import { io, Socket } from "socket.io-client";
import { getIdToken } from "./firebase";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return new Promise((resolve, reject) => {
    socket!.on("connect", () => resolve(socket!));
    socket!.on("connect_error", (err) => reject(err));
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
