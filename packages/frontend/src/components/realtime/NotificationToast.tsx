"use client";

import { useEffect, useState } from "react";
import { useSocketContext } from "./SocketProvider";

interface Notification {
  id: number;
  message: string;
  type: "reward" | "wallet" | "kyc";
}

let notifId = 0;

export function NotificationToast() {
  const { socket } = useSocketContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    function addNotif(message: string, type: Notification["type"]) {
      const id = ++notifId;
      setNotifications((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    }

    socket.on("reward:new", (data) => {
      addNotif(
        `New reward received: ${data.currency} ${data.gross_amount}`,
        "reward"
      );
    });

    socket.on("wallet:update", (data) => {
      addNotif(
        `Wallet updated: ${data.currency} ${data.available_balance} available`,
        "wallet"
      );
    });

    socket.on("reward:status", (data) => {
      addNotif(
        `Reward ${data.reward_id.slice(0, 8)}... is now ${data.status}`,
        "reward"
      );
    });

    socket.on("kyc:status", (data) => {
      addNotif(`KYC status updated: ${data.status}`, "kyc");
    });

    return () => {
      socket.off("reward:new");
      socket.off("wallet:update");
      socket.off("reward:status");
      socket.off("kyc:status");
    };
  }, [socket]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-xs animate-pulse ${
            n.type === "reward"
              ? "bg-green-600"
              : n.type === "wallet"
                ? "bg-blue-600"
                : "bg-yellow-600"
          }`}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
