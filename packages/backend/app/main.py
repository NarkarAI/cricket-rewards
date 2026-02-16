import logging
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.dependencies import close_redis
from app.realtime.server import sio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized.")
    yield
    # Shutdown
    await close_redis()
    logger.info("Shutdown complete.")


def create_app() -> FastAPI:
    fastapi_app = FastAPI(
        title="Cricket Fan Rewards API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler
    @fastapi_app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    # Register routers
    from app.routers import auth, users, players, rewards, payments, webhooks, wallets, kyc, admin

    fastapi_app.include_router(auth.router)
    fastapi_app.include_router(users.router)
    fastapi_app.include_router(players.router)
    fastapi_app.include_router(rewards.router)
    fastapi_app.include_router(payments.router)
    fastapi_app.include_router(webhooks.router)
    fastapi_app.include_router(wallets.router)
    fastapi_app.include_router(kyc.router)
    fastapi_app.include_router(admin.router)

    # Health check
    @fastapi_app.get("/health")
    async def health():
        return {"status": "ok"}

    return fastapi_app


# Create FastAPI app
fastapi_app = create_app()

# Mount Socket.io as ASGI app
socket_app = socketio.ASGIApp(sio, other_app=fastapi_app)

# This is the ASGI entry point
app = socket_app
