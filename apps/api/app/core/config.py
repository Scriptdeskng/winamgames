from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "WinamGames API"
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/winam"
    intelli_base_url: str = "https://api.intellihq.net/api/v1"
    intelli_service_path_id: str = "1"
    intelli_telco: str = "MTN"
    intelli_mock: bool = True


settings = Settings()
