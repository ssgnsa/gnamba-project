"""Database configuration and session management."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/egs_local"
)

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Import models to register them with Base.metadata
# This is needed for Alembic autogenerate to work
# Models are imported in alembic/env.py instead to avoid circular imports
# from app.models import (
#     ProjectModel, User, Party,
#     FoncierVillage, FoncierLotissement, FoncierIlot, FoncierLot,
#     FoncierAttestation, FoncierAttestationTemoin, UserVillageAccess, ActivityLog
# )


def get_db():
    """Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()