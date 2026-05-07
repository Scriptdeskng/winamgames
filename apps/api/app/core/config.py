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


settings = Settings()
