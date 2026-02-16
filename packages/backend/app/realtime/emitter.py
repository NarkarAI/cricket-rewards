from app.realtime.server import sio


class RealtimeEmitter:
    async def emit_wallet_update(self, user_uid: str, wallet) -> None:
        await sio.emit(
            "wallet:update",
            {
                "available_balance": str(wallet.available_balance),
                "pending_balance": str(wallet.pending_balance),
                "held_balance": str(wallet.held_balance),
                "currency": wallet.currency,
            },
            room=f"user:{user_uid}",
        )

    async def emit_reward_new(self, player_uid: str, reward) -> None:
        await sio.emit(
            "reward:new",
            {
                "reward_id": reward.reward_id,
                "sender_id": reward.sender_id,
                "gross_amount": str(reward.gross_amount),
                "net_amount": str(reward.net_amount),
                "currency": reward.currency,
                "message": reward.message,
            },
            room=f"player:{player_uid}",
        )

    async def emit_reward_status(self, sender_uid: str, reward) -> None:
        await sio.emit(
            "reward:status",
            {
                "reward_id": reward.reward_id,
                "status": reward.status,
                "gross_amount": str(reward.gross_amount),
                "currency": reward.currency,
            },
            room=f"user:{sender_uid}",
        )

    async def emit_kyc_status(self, user_uid: str, status: str) -> None:
        await sio.emit(
            "kyc:status",
            {"status": status},
            room=f"user:{user_uid}",
        )


emitter = RealtimeEmitter()
