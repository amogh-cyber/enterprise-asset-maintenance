import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AssetFlow Enterprise Asset Maintenance & Work Order Management"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-enterprise-key-for-assetflow-dev-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for dev/demo convenience
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/assetflow.db" if os.getenv("VERCEL") else "sqlite:///./assetflow.db"
    )
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="allow")

settings = Settings()
