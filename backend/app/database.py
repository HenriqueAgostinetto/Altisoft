from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/altisoft"
    jwt_secret_key: str = "troque-esta-chave-em-producao"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    frontend_origin: str = "http://localhost:4200"
    supabase_storage_url: str | None = None
    supabase_service_key: str | None = None
    supabase_bucket: str = "tickets"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
