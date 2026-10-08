from sqlalchemy import String, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.infrastructure.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.models.entity import Entity


def test_auth_repository_finds_users_with_case_insensitive_email() -> None:
    # Keep this focused repository test SQLite-compatible without changing the
    # PostgreSQL model declarations used in production.
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if type(column.type).__name__ in {"UUID", "ARRAY", "INET"}:
                column.type = String()

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        entity = Entity(
            type="user",
            status="active",
            email="CASE-USER@EGS.LOCAL",
            display_name="Case User",
        )
        session.add(entity)
        session.commit()

        user = SqlAlchemyUserRepository(session).create(
            {
                "email": "case-user@egs.local",
                "password": "StrongPassword2026!",
                "full_name": "Case User",
                "role": "employe",
                "access_level": "employe",
            }
        )
        found = SqlAlchemyUserRepository(session).get_by_email("CASE-USER@EGS.LOCAL")

    assert found is not None
    assert found.id == user.id
