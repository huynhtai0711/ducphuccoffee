from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Coffee Roastery Manager"
    secret_key: str = "super-secret-dev-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./data/roastery.db"
    default_low_stock_threshold: float = 60.0


settings = Settings()
