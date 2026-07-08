from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.repositories.sqlalchemy_user_repository import UserRepository


def test_sqlalchemy_repository_seeds_default_admin() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        repo = UserRepository(session)
        user = repo.get_by_email("admin@egs.local")

    assert user is not None
    assert user["email"] == "admin@egs.local"
    assert user["role"] == "admin"
    assert user["access_level"] == "admin"


def test_sqlalchemy_repository_normalizes_uppercase_role_values() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        repo = UserRepository(session)
        created = repo.create(
            {
                "email": "ops@egs.local",
                "password": "secret123",
                "full_name": "Ops User",
                "role": "ADMIN",
                "access_level": "ADMIN",
            }
        )

    assert created["email"] == "ops@egs.local"
    assert created["role"] == "admin"
    assert created["access_level"] == "admin"
