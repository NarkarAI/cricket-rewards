from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017/cricket_rewards"
    mongodb_db_name: str = "cricket_rewards"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Firebase
    firebase_project_id: str = ""
    firebase_service_account_path: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # KYC File Storage
    kyc_upload_dir: str = "/app/uploads/kyc"
    kyc_max_file_size: int = 10 * 1024 * 1024  # 10MB
    kyc_allowed_types: str = "image/jpeg,image/png,image/webp,application/pdf"

    # Avatar Storage
    avatar_upload_dir: str = "/app/uploads/avatars"
    avatar_max_file_size: int = 5 * 1024 * 1024  # 5MB

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
