from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "WinamGames API"
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/winam"
    intelli_base_url: str = Field(
        default="https://api.intellihq.net/api/v1",
        validation_alias=AliasChoices("WINAM_INTELLI_BASE_URL", "INTELLI_BASE_URL"),
    )
    intelli_service_path_id: str = Field(
        default="1",
        validation_alias=AliasChoices("WINAM_INTELLI_SERVICE_PATH_ID", "INTELLI_SERVICE_PATH_ID"),
    )
    intelli_telco: str = Field(
        default="MTN",
        validation_alias=AliasChoices("WINAM_INTELLI_TELCO", "INTELLI_TELCO"),
    )
    intelli_mock: bool = Field(
        default=True,
        validation_alias=AliasChoices("WINAM_INTELLI_MOCK", "INTELLI_MOCK"),
    )
    frontend_origin: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("WINAM_FRONTEND_ORIGIN", "FRONTEND_ORIGIN"),
    )
    admin_origin: str = Field(
        default="http://localhost:3001",
        validation_alias=AliasChoices("WINAM_ADMIN_ORIGIN", "ADMIN_ORIGIN"),
    )
    session_secret: str = Field(
        default="dev-session-secret",
        validation_alias=AliasChoices("WINAM_SESSION_SECRET", "SESSION_SECRET"),
    )
    cookie_secure: bool = Field(
        default=False,
        validation_alias=AliasChoices("WINAM_COOKIE_SECURE", "COOKIE_SECURE"),
    )


settings = Settings()
