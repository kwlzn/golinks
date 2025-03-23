import datetime
import os
from pathlib import Path

from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


class Settings(BaseSettings):
    # Environment
    ENV: str = "development"  # options: development, testing, production
    
    # Database settings
    DB_TYPE: str = "sqlite"   # options: sqlite, postgresql
    
    # PostgreSQL settings (used when DB_TYPE is postgresql)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "golinks"
    
    # SQLite settings (used when DB_TYPE is sqlite)
    SQLITE_FILE: str = "golinks.db"
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DB_TYPE == "sqlite":
            # SQLite URL - using absolute path for better compatibility
            base_dir = Path(__file__).resolve().parent.parent
            sqlite_path = base_dir / self.SQLITE_FILE
            return f"sqlite:///{sqlite_path}"
        else:
            # PostgreSQL URL
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    model_config = {
        "env_file": ".env"
    }


settings = Settings()
print(f"Using {settings.DB_TYPE} database in {settings.ENV} environment")
print(f"Database URL: {settings.DATABASE_URL}")

# Configure SQLAlchemy based on DB type
connect_args = {}
if settings.DB_TYPE == "sqlite":
    connect_args = {"check_same_thread": False}  # Needed for SQLite

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    url = Column(String, nullable=False)
    username = Column(String, nullable=False)
    is_dynamic = Column(Integer, default=0, nullable=False)  # 0=static, 1=dynamic with %s placeholder
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Note: Additional validation for slug format is handled in the API layer


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
