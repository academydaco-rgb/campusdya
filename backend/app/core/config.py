from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Base de datos
    DATABASE_URL: str = "postgresql+asyncpg://academia:academia@db:5432/academia_da"

    # Seguridad
    SECRET_KEY: str = "cambia-esto-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias

    # URLs / CORS
    BACKEND_URL: str = "http://localhost:8010"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"

    # Email (fase 2)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "no-reply@academia.local"

    # Seed admin inicial
    SEED_ADMIN_EMAIL: str = "academydaco@gmail.com"
    SEED_ADMIN_PASSWORD: str = ""

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
