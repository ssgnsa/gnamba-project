from sqlalchemy import String, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import hash_password, verify_password
from app.models.entity import Entity
from app.models.user import User
from app.repositories.sqlalchemy_user_repository import UserRepository, seed_system


# SQLite cannot compile PostgreSQL-specific types used by the schema (UUID, ARRAY, INET).
# These tests validate repository logic, not PostgreSQL DDL compilation, so we downgrade
# the unsupported column types to SQLite-safe String values in memory.
for table in Base.metadata.tables.values():
    for column in table.columns:
        type_name = type(column.type).__name__
        if type_name in {"UUID", "ARRAY", "INET"}:
            column.type = String()


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


def test_seed_system_updates_stale_admin_password(monkeypatch) -> None:
    monkeypatch.setenv("INITIAL_ADMIN_PASSWORD", "FreshAdminPass2026!")
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        entity = Entity(
            type="user",
            status="active",
            email="admin@egs.local",
            display_name="Administrateur EGS",
            phone="",
            entity_metadata={"role": "admin", "department": "Direction", "poste": "Administrateur"},
        )
        session.add(entity)
        session.commit()
        session.refresh(entity)

        admin = User(
            id="00000000-0000-0000-0000-000000000001",
            email="admin@egs.local",
            full_name="Administrateur EGS",
            password_hash=hash_password("Admin@EGS2025!"),
            role="admin",
            access_level="admin",
            entity_id=entity.id,
        )
        session.add(admin)
        session.commit()

        seed_system(session)
        session.refresh(admin)

        assert verify_password("FreshAdminPass2026!", admin.password_hash) is True
        assert verify_password("Admin@EGS2025!", admin.password_hash) is False


def test_seed_system_keeps_custom_admin_password(monkeypatch) -> None:
    monkeypatch.setenv("INITIAL_ADMIN_PASSWORD", "FreshAdminPass2026!")
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        entity = Entity(
            type="user",
            status="active",
            email="admin@egs.local",
            display_name="Administrateur EGS",
            phone="",
            entity_metadata={"role": "admin", "department": "Direction", "poste": "Administrateur"},
        )
        session.add(entity)
        session.commit()
        session.refresh(entity)

        admin = User(
            id="00000000-0000-0000-0000-000000000001",
            email="admin@egs.local",
            full_name="Administrateur EGS",
            password_hash=hash_password("CustomAdminPass2026!"),
            role="admin",
            access_level="admin",
            entity_id=entity.id,
        )
        session.add(admin)
        session.commit()

        seed_system(session)
        session.refresh(admin)

        assert verify_password("CustomAdminPass2026!", admin.password_hash) is True
        assert verify_password("FreshAdminPass2026!", admin.password_hash) is False


def test_seed_system_repairs_default_admin_when_local_repair_flag_is_enabled(monkeypatch) -> None:
    monkeypatch.setenv("INITIAL_ADMIN_PASSWORD", "FreshAdminPass2026!")
    monkeypatch.setenv("AUTO_RESET_DEFAULT_ADMIN_PASSWORD", "true")
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as session:
        entity = Entity(
            type="user",
            status="active",
            email="admin@egs.local",
            display_name="Administrateur EGS",
            phone="",
            entity_metadata={"role": "admin", "department": "Direction", "poste": "Administrateur"},
        )
        session.add(entity)
        session.commit()
        session.refresh(entity)

        admin = User(
            id="00000000-0000-0000-0000-000000000001",
            email="admin@egs.local",
            full_name="Administrateur EGS",
            password_hash=hash_password("TotallyUnrelatedLegacyPass2026!"),
            role="admin",
            access_level="admin",
            entity_id=entity.id,
        )
        session.add(admin)
        session.commit()

        seed_system(session)
        session.refresh(admin)

        assert verify_password("FreshAdminPass2026!", admin.password_hash) is True
        assert verify_password("TotallyUnrelatedLegacyPass2026!", admin.password_hash) is False
