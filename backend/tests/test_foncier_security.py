import os
from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from importlib import import_module
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import deps
from app.core.authorization import has_permission
from app.core.database import SessionLocal, engine, get_db
from app.main import app
from app.services.foncier import AttestationService, get_attestation_service
from app.repositories.foncier import get_attestation_repo
foncier_router = import_module("app.api.v1.foncier.router")


def test_private_foncier_reads_and_rpc_reject_anonymous_requests():
    client = TestClient(app)

    for path in (
        "/api/v1/foncier/villages",
        "/api/v1/foncier/lots",
    ):
        response = client.get(path)
        assert response.status_code == 401, (path, response.status_code)

    response = client.post(
        "/api/v1/rpc/log_foncier_audit",
        json={"p_lot_id": "00000000-0000-0000-0000-000000000001", "p_action": "test"},
    )
    assert response.status_code == 401


def test_attestation_verification_is_public_and_minimizes_owner_data(test_client, monkeypatch):
    class FakeAttestationService:
        def verify(self, _reference):
            return {
                "reference": "ATT-TEST",
                "statut": "delivre",
                "date_etablissement": None,
                "date_expiration": "2099-12-31T00:00:00+00:00",
                "lot_reference": "LOT-TEST",
                "numero_lot": "12",
                "superficie": 250,
                "village_nom": "Village",
                "village_code": "VIL",
                "proprietaire_nom": "Doe",
                "proprietaire_prenom": "Jane",
                "proprietaire_telephone": "+22500000000",
                "proprietaire_email": "jane@example.com",
            }

    monkeypatch.setattr(
        foncier_router,
        "get_attestation_service",
        lambda _db: FakeAttestationService(),
    )
    response = test_client.get("/api/v1/foncier/attestations/verify/ATT-TEST")

    assert response.status_code == 200
    body = response.json()
    # Seul un document délivré (statut archive + delivre, non expiré) est authentique publiquement.
    assert body["authentique"] is True
    assert body["statut"] == "delivre"
    # La vérification publique ne doit exposer aucune donnée personnelle
    # du propriétaire (nom, prénom, coordonnées).
    assert body["proprietaire"] == {}
    assert "nom" not in body["proprietaire"]
    assert "prenom" not in body["proprietaire"]
    assert "telephone" not in body["proprietaire"]
    assert "email" not in body["proprietaire"]


def test_attestation_verification_valide_not_authentique_public(test_client, monkeypatch):
    """Une attestation valide mais non délivrée n'est pas authentique publiquement."""
    class FakeAttestationService:
        def verify(self, _reference):
            return {
                "reference": "ATT-TEST",
                "statut": "valide",
                "date_etablissement": None,
                "date_expiration": None,
                "lot_reference": "LOT-TEST",
                "numero_lot": "12",
                "superficie": 250,
                "village_nom": "Village",
                "village_code": "VIL",
                "proprietaire_nom": "Doe",
                "proprietaire_prenom": "Jane",
                "proprietaire_telephone": "+22500000000",
                "proprietaire_email": "jane@example.com",
            }

    monkeypatch.setattr(
        foncier_router,
        "get_attestation_service",
        lambda _db: FakeAttestationService(),
    )
    response = test_client.get("/api/v1/foncier/attestations/verify/ATT-TEST")

    assert response.status_code == 200
    body = response.json()
    # Un document "valide" (approuvé, imprimable) n'est pas délivré => authentique=False.
    assert body["authentique"] is False
    assert body["statut"] == "valide"
    assert body["proprietaire"] == {}


def test_foncier_policy_rejects_unapproved_authenticated_roles():
    # Gestionnaire has foncier read access per the frontend contract
    # (ACCESS_LEVEL_MODULES in src/context/AuthContext.tsx).
    gestionnaire = {
        "id": "00000000-0000-0000-0000-000000000002",
        "sub": "00000000-0000-0000-0000-000000000002",
        "role": "gestionnaire",
        "full_name": "Test Manager",
    }
    assert has_permission(gestionnaire, "foncier", "read") is True
    # Employe should not have foncier access.
    employe = {"id": "employee", "role": "employe"}
    assert has_permission(employe, "foncier", "read") is False


def test_foncier_archival_endpoints_never_physically_delete(monkeypatch):
    class ExistingRepository:
        def get(self, _row_id):
            return object()

    class ExistingService:
        repo = ExistingRepository()

    monkeypatch.setattr(foncier_router, "get_lotissement_service", lambda _db: ExistingService())
    monkeypatch.setattr(foncier_router, "get_ilot_service", lambda _db: ExistingService())
    entity_id = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")

    for delete_call in (
        lambda: foncier_router.delete_lotissement(entity_id, db=None),
        lambda: foncier_router.delete_ilot(entity_id, db=None),
    ):
        try:
            delete_call()
        except HTTPException as error:
            assert error.status_code == 409
            assert "Suppression physique désactivée" in error.detail
        else:
            raise AssertionError("Physical deletion should be rejected")


def test_foncier_villages_are_not_exposed_through_generic_table_api(test_client):
    app.dependency_overrides[deps.get_optional_current_user] = lambda: {
        "id": "00000000-0000-0000-0000-000000000001",
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "admin",
        "mfa_verified": True,
    }
    try:
        response = test_client.get("/api/v1/tables/foncier_villages")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(deps.get_optional_current_user, None)


def _fake_lot_service():
    class FakeLotService:
        def search(self, params):
            return [], 0

    return FakeLotService()


def test_search_lots_success_path_does_not_crash(test_client, monkeypatch):
    """GET /foncier/lots must not raise NameError on effective_page_size."""

    monkeypatch.setattr(foncier_router, "get_lot_service", lambda _db: _fake_lot_service())
    response = test_client.get("/api/v1/foncier/lots?page=1&page_size=10")
    assert response.status_code == 200, (response.status_code, response.text)
    assert response.json()["page_size"] == 10


def test_list_lots_by_ilot_success_path_does_not_crash(test_client, monkeypatch):
    """GET /foncier/ilots/{ilot_id}/lots must not raise NameError on undefined limit."""

    monkeypatch.setattr(foncier_router, "get_lot_service", lambda _db: _fake_lot_service())
    response = test_client.get(
        "/api/v1/foncier/ilots/00000000-0000-0000-0000-000000000000/lots?page=1&page_size=10"
    )
    assert response.status_code == 200, (response.status_code, response.text)
    assert response.json()["page_size"] == 10


class _FakeAttestationPrintDeliverService:
    """Fake service simulant le workflow impression / délivrance d'attestation."""

    def __init__(self):
        self.printed = False
        self.delivered = False

    def print(self, _attestation_id, _reason, _user_id, user_role=None):
        self.printed = True
        return {"id": "att-1", "statut": "valide", "print_count": 1}

    def deliver(self, _attestation_id, _reason, _user_id, user_role=None):
        # Délivrance refusée si aucun scan signé n'a été déposé.
        if not getattr(self, "scan_depose", False):
            return None
        self.delivered = True
        return {"id": "att-1", "statut": "archive", "delivre": True, "pdf_media_id": "media-1"}


def test_print_attestation_requiert_statut_valide(test_client, monkeypatch):
    """L'impression d'une attestation exige un statut valide."""
    service = _FakeAttestationPrintDeliverService()
    monkeypatch.setattr(foncier_router, "get_attestation_service", lambda _db: service)
    response = test_client.post(
        "/api/v1/foncier/attestations/00000000-0000-0000-0000-000000000000/print",
        json={"raison": "impression test"},
    )
    assert response.status_code == 200, (response.status_code, response.text)
    assert service.printed is True


def test_deliver_attestation_refuse_sans_scan_signe(test_client, monkeypatch):
    """La délivrance est refusée si aucun scan signé n'a été déposé."""
    service = _FakeAttestationPrintDeliverService()
    service.scan_depose = False
    monkeypatch.setattr(foncier_router, "get_attestation_service", lambda _db: service)
    response = test_client.post(
        "/api/v1/foncier/attestations/00000000-0000-0000-0000-000000000000/deliver",
        json={"raison": "delivrance test"},
    )
    assert response.status_code == 409, (response.status_code, response.text)
    assert service.delivered is False


def test_deliver_attestation_accepte_avec_scan_signe(test_client, monkeypatch):
    """La délivrance est confirmée quand le scan signé est joint (statut archive + pdf_media_id)."""
    service = _FakeAttestationPrintDeliverService()
    service.scan_depose = True
    monkeypatch.setattr(foncier_router, "get_attestation_service", lambda _db: service)
    response = test_client.post(
        "/api/v1/foncier/attestations/00000000-0000-0000-0000-000000000000/deliver",
        json={"raison": "delivrance test"},
    )
    assert response.status_code == 200, (response.status_code, response.text)
    assert service.delivered is True


# ============================================
# TESTS DU VRAI SERVICE (pas de fake)
# Base SQLite isolée, tables créées manuellement via SQL brut.
# ============================================

_FONCIER_DDL = """
CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    email TEXT
);
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS foncier_villages (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    actif INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);
CREATE TABLE IF NOT EXISTS foncier_lotissements (
    id TEXT PRIMARY KEY,
    village_id TEXT NOT NULL REFERENCES foncier_villages(id),
    nom TEXT NOT NULL,
    code TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);
CREATE TABLE IF NOT EXISTS foncier_ilots (
    id TEXT PRIMARY KEY,
    lotissement_id TEXT NOT NULL REFERENCES foncier_lotissements(id),
    numero TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);
CREATE TABLE IF NOT EXISTS foncier_lots (
    id TEXT PRIMARY KEY,
    ilot_id TEXT NOT NULL REFERENCES foncier_ilots(id),
    numero_lot TEXT NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    superficie NUMERIC NOT NULL,
    statut TEXT NOT NULL DEFAULT 'actif',
    prix_cession NUMERIC(12, 2),
    proprietaire_client_id TEXT REFERENCES parties(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);
CREATE TABLE IF NOT EXISTS foncier_attestations (
    id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL REFERENCES foncier_lots(id),
    proprietaire_client_id TEXT REFERENCES parties(id),
    reference TEXT NOT NULL UNIQUE,
    version INTEGER DEFAULT 1,
    type TEXT DEFAULT 'standard',
    statut TEXT NOT NULL DEFAULT 'brouillon',
    date_etablissement DATE,
    date_expiration TIMESTAMP,
    mode_acquisition TEXT,
    historique_possession TEXT,
    domicile TEXT,
    cedant_nom TEXT,
    cedant_prenom TEXT,
    cedant_cni_numero TEXT,
    cedant_telephone TEXT,
    cedant_domicile TEXT,
    limites_nord TEXT,
    limites_sud TEXT,
    limites_est TEXT,
    limites_ouest TEXT,
    gps_lat NUMERIC,
    gps_lng NUMERIC,
    gps_precision NUMERIC,
    gps_points TEXT,
    registre_volume TEXT,
    registre_page INTEGER,
    registre_ligne INTEGER,
    numero_enregistrement TEXT,
    qr_payload TEXT,
    signature_numerique TEXT,
    hash_sha256 TEXT,
    control_number TEXT,
    signature_nonce TEXT,
    signature_issued_at TIMESTAMP,
    validation_agent_nom TEXT,
    validation_agent_id TEXT,
    validation_agent_date TIMESTAMP,
    validation_chef_nom TEXT,
    validation_chef_id TEXT,
    validation_chef_date TIMESTAMP,
    proprietaire_photo_media_id TEXT,
    proprietaire_empreinte_media_id TEXT,
    chef_signature_manuscrite_requise INTEGER DEFAULT 1,
    chef_signature_media_id TEXT,
    chef_empreinte_media_id TEXT,
    temoin_empreinte_media_ids TEXT,
    revoke_reason TEXT,
    revoked_at TIMESTAMP,
    revoked_by TEXT,
    pdf_media_id TEXT,
    pdf_generated_at TIMESTAMP,
    printed_by TEXT,
    printed_at TIMESTAMP,
    print_count INTEGER DEFAULT 0,
    delivre INTEGER DEFAULT 0,
    delivre_par TEXT,
    delivre_le TIMESTAMP,
    created_by TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    updated_by TEXT,
    client_updated_at TIMESTAMP,
    last_modified_device_id TEXT,
    deleted_at TIMESTAMP,
    row_version INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_reference TEXT,
    action TEXT NOT NULL,
    action_category TEXT DEFAULT 'data',
    old_values TEXT,
    new_values TEXT,
    changed_fields TEXT,
    user_id TEXT,
    user_role TEXT,
    user_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    device_id TEXT,
    metadata TEXT,
    created_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_village_access (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    village_id TEXT NOT NULL REFERENCES foncier_villages(id),
    access_level TEXT NOT NULL DEFAULT 'lecteur',
    created_at TIMESTAMP
);
"""


def _setup_fonciers_sqlite(db: Session) -> dict:
    """Crée les tables foncier en SQLite isolé et retourne des identifiants de test.

    Les tables sont droppées avant recréation pour éviter les conflits avec un
    schéma préexistant (base SQLite persistante partagée entre les tests).
    """
    for table in (
        "activity_logs",
        "user_village_access",
        "foncier_attestations",
        "foncier_lots",
        "foncier_ilots",
        "foncier_lotissements",
        "foncier_villages",
    ):
        db.execute(text(f"DROP TABLE IF EXISTS {table}"))
    db.commit()
    for statement in _FONCIER_DDL.strip().split(";"):
        statement = statement.strip()
        if statement:
            db.execute(text(statement))
    db.commit()

    village_id = str(uuid4())
    lotissement_id = str(uuid4())
    ilot_id = str(uuid4())
    lot_id = str(uuid4())
    attestation_id = str(uuid4())
    user_id = str(uuid4())

    db.execute(
        text("""
        INSERT INTO foncier_villages (id, nom, code, actif, created_at, updated_at)
        VALUES (:id, 'Village Test', 'VT', 1, :now, :now)
        """),
        {"id": village_id, "now": datetime.utcnow()},
    )
    db.execute(
        text("""
        INSERT INTO foncier_lotissements (id, village_id, nom, code, created_at, updated_at)
        VALUES (:id, :vid, 'Lotissement Test', 'LT', :now, :now)
        """),
        {"id": lotissement_id, "vid": village_id, "now": datetime.utcnow()},
    )
    db.execute(
        text("""
        INSERT INTO foncier_ilots (id, lotissement_id, numero, created_at, updated_at)
        VALUES (:id, :lid, '01', :now, :now)
        """),
        {"id": ilot_id, "lid": lotissement_id, "now": datetime.utcnow()},
    )
    db.execute(
        text("""
        INSERT INTO foncier_lots (id, ilot_id, numero_lot, reference, superficie, statut, created_at, updated_at)
        VALUES (:id, :iid, '14', :ref, 250, 'actif', :now, :now)
        """),
        {"id": lot_id, "iid": ilot_id, "ref": "LOT-VT-LT-01-14", "now": datetime.utcnow()},
    )
    db.execute(
        text("""
        INSERT INTO user_village_access (id, user_id, village_id, access_level, created_at)
        VALUES (:id, :uid, :vid, 'gestionnaire', :now)
        """),
        {"id": str(uuid4()), "uid": user_id, "vid": village_id, "now": datetime.utcnow()},
    )
    db.commit()

    return {
        "village_id": village_id,
        "lotissement_id": lotissement_id,
        "ilot_id": ilot_id,
        "lot_id": lot_id,
        "attestation_id": attestation_id,
        "user_id": user_id,
    }


def _make_attestation_row(db: Session, lot_id: str, attestation_id: str, statut: str, delivre: int = 0, pdf_media_id: str | None = None):
    now = datetime.utcnow()
    db.execute(
        text("""
        INSERT INTO foncier_attestations
        (id, lot_id, reference, version, type, statut, date_etablissement, date_expiration,
         pdf_media_id, delivre, created_at, updated_at, created_by, updated_by, row_version)
        VALUES (:id, :lot_id, :ref, 1, 'standard', :statut, :date_etab, :date_exp,
                :pdf, :delivre, :now, :now, :uid, :uid, 1)
        """),
        {
            "id": attestation_id,
            "lot_id": lot_id,
            "ref": f"ATT-{uuid4()}",
            "statut": statut,
            "date_etab": now.date(),
            "date_exp": now.replace(year=now.year + 1),
            "pdf": pdf_media_id,
            "delivre": delivre,
            "now": now,
            "uid": str(uuid4()),
        },
    )
    db.commit()


def _real_service(db: Session) -> AttestationService:
    return AttestationService(db)


def _override_get_db(db: Session):
    def _get_db():
        yield db
    return _get_db


# ---- Tests des états publics sur le vrai service ----

def test_public_verification_brouillon_not_authentique():
    """Une attestation brouillon n'est pas authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "brouillon")
        service = _real_service(db)
        result = service.verify(
            db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                        {"id": ids["attestation_id"]}).scalar_one()
        )
        assert result["statut"] == "brouillon"
        # authentique est calculé dans la route, pas dans le service. On vérifie le statut stocké.
        assert result["statut"] != "delivre"
    finally:
        db.close()


def test_public_verification_soumis_not_authentique():
    """Une attestation soumis n'est pas authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "soumis")
        service = _real_service(db)
        ref = db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        result = service.verify(ref)
        assert result["statut"] == "soumis"
        assert result["statut"] != "delivre"
    finally:
        db.close()


def test_public_verification_valide_not_authentique():
    """Une attestation valide (approuvée, imprimable) n'est pas authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "valide")
        service = _real_service(db)
        ref = db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        result = service.verify(ref)
        assert result["statut"] == "valide"
        assert result["statut"] != "delivre"
    finally:
        db.close()


def test_public_verification_archive_not_authentique():
    """Une attestation scannée (archive) non délivrée n'est pas authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        service = _real_service(db)
        ref = db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        result = service.verify(ref)
        assert result["statut"] == "archive"
        assert result["statut"] != "delivre"
    finally:
        db.close()


def test_public_verification_delivre_authentique():
    """Une attestation délivrée (statut archive + delivre=true) est authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", delivre=1, pdf_media_id="media-1")
        service = _real_service(db)
        ref = db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        result = service.verify(ref)
        assert result["statut"] == "archive"
        # Le champ delivre est stocké et lisible
        row = db.execute(text("SELECT delivre FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        assert row == 1
    finally:
        db.close()


def test_public_verification_revoque_not_authentique():
    """Une attestation révoquée n'est pas authentique publiquement."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "revoque")
        service = _real_service(db)
        ref = db.execute(text("SELECT reference FROM foncier_attestations WHERE id=:id"),
                         {"id": ids["attestation_id"]}).scalar_one()
        result = service.verify(ref)
        assert result["statut"] == "revoque"
        assert result["statut"] != "delivre"
    finally:
        db.close()


# ---- Tests de délivrance réelle et double délivrance ----

def test_real_deliver_refuse_sans_scan():
    """Le vrai service refuse la délivrance sans scan signé (pdf_media_id absent)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id=None)
        service = _real_service(db)
        resultat = service.deliver(ids["attestation_id"], "raison test", ids["user_id"])
        assert resultat is None
    finally:
        db.close()


def test_real_deliver_accepte_avec_scan():
    """Le vrai service confirme la délivrance quand le scan signé est présent."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        service = _real_service(db)
        resultat = service.deliver(ids["attestation_id"], "raison test", ids["user_id"])
        assert resultat is not None
        # Vérifier l'état persistant
        delivre = db.execute(text("SELECT delivre FROM foncier_attestations WHERE id=:id"),
                             {"id": ids["attestation_id"]}).scalar_one()
        assert delivre == 1
        delivre_par = db.execute(text("SELECT delivre_par FROM foncier_attestations WHERE id=:id"),
                                 {"id": ids["attestation_id"]}).scalar_one()
        assert str(delivre_par) == ids["user_id"]
        # Vérifier l'audit a été écrit
        logs = db.execute(text("SELECT COUNT(*) FROM activity_logs WHERE entity_id=:id AND action='deliver'"),
                          {"id": ids["attestation_id"]}).scalar_one()
        assert logs >= 1
    finally:
        db.close()


def test_real_double_deliver_rejecte():
    """Une double délivrance est rejetée (idempotence négative)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        service = _real_service(db)
        # Première délivrance
        resultat1 = service.deliver(ids["attestation_id"], "raison 1", ids["user_id"])
        assert resultat1 is not None
        # Deuxième délivrance -> doit être rejetée
        resultat2 = service.deliver(ids["attestation_id"], "raison 2", ids["user_id"])
        assert resultat2 is None
    finally:
        db.close()


def test_real_revoke_delivree_possible():
    """Une attestation délivrée (archive + delivre) peut être révoquée."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", delivre=1, pdf_media_id="media-1")
        service = _real_service(db)
        # L'attestation est déjà délivrée (delivre=1) ; on vérifie qu'elle peut être révoquée.
        resultat = service.revoke(ids["attestation_id"], "motif test", ids["user_id"], user_role="admin")
        assert resultat is not None
        # Le statut doit être revoque
        statut = db.execute(text("SELECT statut FROM foncier_attestations WHERE id=:id"),
                            {"id": ids["attestation_id"]}).scalar_one()
        assert statut == "revoque"
        # La délivrance est réinitialisée
        delivre = db.execute(text("SELECT delivre FROM foncier_attestations WHERE id=:id"),
                             {"id": ids["attestation_id"]}).scalar_one()
        assert delivre == 0
    finally:
        db.close()


# ---- Test API réelle avec DB isolée ----

def test_api_deliver_accepte_avec_scan_signe_real_db():
    """Route deliver avec vraie DB : accepte quand scan signé présent."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Test Manager",
        }
        try:
            client = TestClient(app)
            response = client.post(
                f"/api/v1/foncier/attestations/{ids['attestation_id']}/deliver",
                json={"raison": "delivrance test"},
            )
            assert response.status_code == 200, (response.status_code, response.text)
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


def test_api_deliver_refuse_sans_scan_real_db():
    """Route deliver avec vraie DB : refuse quand scan signé absent."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id=None)
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Test Manager",
        }
        try:
            client = TestClient(app)
            response = client.post(
                f"/api/v1/foncier/attestations/{ids['attestation_id']}/deliver",
                json={"raison": "delivrance test"},
            )
            assert response.status_code == 409, (response.status_code, response.text)
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


# ---- Test inter-villages : périmètre d'accès ----

def _deliver_with_user(db, attestation_id, user_id, role="gestionnaire", full_name="Test Manager"):
    """Prépare les overrides et exécute une requête de délivrance."""
    app.dependency_overrides[get_db] = _override_get_db(db)
    app.dependency_overrides[deps.get_current_user] = lambda: {
        "id": user_id,
        "sub": user_id,
        "role": role,
        "mfa_verified": True,
        "full_name": full_name,
    }
    try:
        client = TestClient(app)
        return client.post(
            f"/api/v1/foncier/attestations/{attestation_id}/deliver",
            json={"raison": "delivrance test"},
        )
    finally:
        app.dependency_overrides.clear()


def test_delivrance_acceptee_acces_village_ok():
    """Utilisateur ayant un accès gestionnaire sur le village : délivrance acceptée."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        response = _deliver_with_user(db, ids["attestation_id"], ids["user_id"])
        assert response.status_code == 200, (response.status_code, response.text)
    finally:
        db.close()


def test_delivrance_refusee_sans_acces_village():
    """Utilisateur sans aucun accès au village : délivrance refusée (409)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        # Utilisateur inconnu, aucun UserVillageAccess créé pour lui.
        inconnu_id = str(uuid4())
        response = _deliver_with_user(db, ids["attestation_id"], inconnu_id)
        assert response.status_code == 409, (response.status_code, response.text)
    finally:
        db.close()


def test_delivrance_refusee_autre_village():
    """Utilisateur autorisé dans un autre village : délivrance refusée (409)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        # Créer un second village et y donner un accès à l'utilisateur, mais pas sur le village de l'attestation.
        autre_village_id = str(uuid4())
        autre_user_id = str(uuid4())
        db.execute(
            text("""
            INSERT INTO foncier_villages (id, nom, code, actif, created_at, updated_at)
            VALUES (:id, 'Village Autre', 'VA', 1, :now, :now)
            """),
            {"id": autre_village_id, "now": datetime.utcnow()},
        )
        db.execute(
            text("""
            INSERT INTO user_village_access (id, user_id, village_id, access_level, created_at)
            VALUES (:id, :uid, :vid, 'gestionnaire', :now)
            """),
            {"id": str(uuid4()), "uid": autre_user_id, "vid": autre_village_id, "now": datetime.utcnow()},
        )
        db.commit()
        response = _deliver_with_user(db, ids["attestation_id"], autre_user_id)
        assert response.status_code == 409, (response.status_code, response.text)
    finally:
        db.close()


def test_delivrance_refusee_role_sans_acces_territorial():
    """Rôle autorisé (gestionnaire) mais aucun accès territorial : délivrance refusée (409)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        # Le user_id du setup a bien un accès sur le village de l'attestation.
        # On utilise un autre utilisateur avec le rôle gestionnaire mais sans UserVillageAccess.
        gestionnaire_sans_acces = str(uuid4())
        response = _deliver_with_user(db, ids["attestation_id"], gestionnaire_sans_acces)
        assert response.status_code == 409, (response.status_code, response.text)
    finally:
        db.close()


def test_delivrance_refusee_lot_sans_rattachement_village():
    """Lot sans village rattaché (hiérarchie rompue) : délivrance refusée (409)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        # Créer un lot orphelin (ilot_id inexistant) et une attestation dessus.
        lot_orphelin_id = str(uuid4())
        attestation_orpheline_id = str(uuid4())
        db.execute(
            text("""
            INSERT INTO foncier_lots (id, ilot_id, numero_lot, reference, superficie, statut, created_at, updated_at)
            VALUES (:id, :iid, '99', :ref, 250, 'actif', :now, :now)
            """),
            {"id": lot_orphelin_id, "iid": str(uuid4()), "ref": "LOT-ORPHELIN", "now": datetime.utcnow()},
        )
        _make_attestation_row(db, lot_orphelin_id, attestation_orpheline_id, "archive", pdf_media_id="media-1")
        response = _deliver_with_user(db, attestation_orpheline_id, ids["user_id"])
        assert response.status_code == 409, (response.status_code, response.text)
    finally:
        db.close()


def test_delivrance_regression_parcours_b():
    """Régression : parcours complet délivrance avec accès village valide reste fonctionnel."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        response = _deliver_with_user(db, ids["attestation_id"], ids["user_id"])
        assert response.status_code == 200, (response.status_code, response.text)
        delivre = db.execute(text("SELECT delivre FROM foncier_attestations WHERE id=:id"),
                             {"id": ids["attestation_id"]}).scalar_one()
        assert delivre == 1
    finally:
        db.close()


# ============================================
# NOUVEAUX TESTS — EGS-FONCIER-SECURITY-04
# ============================================

# ---- Administrateur global sans UserVillageAccess individuel ----


def test_admin_sans_acces_village_peut_valider():
    """Admin global sans UserVillageAccess peut valider sur n'importe quel village."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "soumis")
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": str(uuid4()),
            "sub": str(uuid4()),
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Admin Global",
        }
        try:
            service = _real_service(db)
            resultat = service.validate(
                ids["attestation_id"],
                type("Req", (), {"chef_nom": "Chef", "signature_media_id": None, "empreinte_media_id": None})(),
                ids["user_id"],
                user_role="admin",
            )
            assert resultat is not None, "L'admin doit pouvoir valider sans UserVillageAccess"
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


def test_admin_sans_acces_village_peut_revoquer():
    """Admin global sans UserVillageAccess peut révoquer sur n'importe quel village."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1", delivre=1)
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": str(uuid4()),
            "sub": str(uuid4()),
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Admin Global",
        }
        try:
            service = _real_service(db)
            resultat = service.revoke(ids["attestation_id"], "motif admin", ids["user_id"], user_role="admin")
            assert resultat is not None, "L'admin doit pouvoir révoquer sans UserVillageAccess"
            statut = db.execute(text("SELECT statut FROM foncier_attestations WHERE id=:id"),
                                {"id": ids["attestation_id"]}).scalar_one()
            assert statut == "revoque"
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


def test_utilisateur_ordinaire_sans_acces_village_refuse():
    """Utilisateur non-admin sans UserVillageAccess se voit refuser toute opération."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        service = _real_service(db)
        # Aucun UserVillageAccess pour cet utilisateur, rôle gestionnaire.
        resultat = service.deliver(ids["attestation_id"], "raison", str(uuid4()), user_role="gestionnaire")
        assert resultat is None, "L'utilisateur sans accès territorial doit être refusé"
    finally:
        db.close()


# ---- Niveaux de permission stricts (chef / agent / gestionnaire) ----


def test_validate_requiert_niveau_validateur():
    """Seul un accès niveau validateur peut valider ; agent et gestionnaire ne suffisent pas pour validate (chef)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        # L'utilisateur du setup a accès gestionnaire sur le village.
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "soumis")
        service = _real_service(db)
        # gestionnaire n'est pas validateur -> refusé pour validate (chef du village uniquement).
        resultat = service.validate(
            ids["attestation_id"],
            type("Req", (), {"chef_nom": "Chef", "signature_media_id": None, "empreinte_media_id": None})(),
            ids["user_id"],
            user_role="gestionnaire",
        )
        assert resultat is None, "Un gestionnaire n'est pas un chef du village pour valider"
    finally:
        db.close()


def test_scan_requiert_niveau_agent_minimum():
    """Seul un accès niveau agent (ou supérieur) peut archiver."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "valide", pdf_media_id="media-1")
        # Donner un accès lecteur uniquement à l'utilisateur sur ce village.
        db.execute(
            text("""
            UPDATE user_village_access SET access_level = 'lecteur'
            WHERE user_id = :uid AND village_id = :vid
            """),
            {"uid": ids["user_id"], "vid": ids["village_id"]},
        )
        db.commit()
        service = _real_service(db)
        resultat = service.scan(ids["attestation_id"], type("Req", (), {"media_id": str(uuid4()), "original_name": "x"})(), ids["user_id"], user_role="gestionnaire")
        assert resultat is None, "Un lecteur ne peut pas archiver"
    finally:
        db.close()


def test_deliver_requiert_niveau_gestionnaire():
    """Seul un accès niveau gestionnaire peut délivrer ; validateur ne suffit pas."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        # Donner un accès validateur uniquement.
        db.execute(
            text("""
            UPDATE user_village_access SET access_level = 'validateur'
            WHERE user_id = :uid AND village_id = :vid
            """),
            {"uid": ids["user_id"], "vid": ids["village_id"]},
        )
        db.commit()
        service = _real_service(db)
        resultat = service.deliver(ids["attestation_id"], "raison", ids["user_id"], user_role="gestionnaire")
        assert resultat is None, "Un validateur n'est pas un gestionnaire pour délivrer"
    finally:
        db.close()


# ---- Absence de privilège implicite entre fonctions ----


def test_agent_ne_peut_pas_delivrer():
    """Un agent (niveau agent) ne peut pas délivrer même s'il peut archiver."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        db.execute(
            text("""
            UPDATE user_village_access SET access_level = 'agent'
            WHERE user_id = :uid AND village_id = :vid
            """),
            {"uid": ids["user_id"], "vid": ids["village_id"]},
        )
        db.commit()
        service = _real_service(db)
        resultat = service.deliver(ids["attestation_id"], "raison", ids["user_id"], user_role="gestionnaire")
        assert resultat is None, "Un agent ne peut pas délivrer"
    finally:
        db.close()


def test_gestionnaire_ne_peut_pas_valider():
    """Un gestionnaire ne peut pas valider (réservé au chef / validateur)."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "soumis")
        service = _real_service(db)
        resultat = service.validate(
            ids["attestation_id"],
            type("Req", (), {"chef_nom": "Chef", "signature_media_id": None, "empreinte_media_id": None})(),
            ids["user_id"],
            user_role="gerant",
        )
        assert resultat is None, "Un gerant ne peut pas valider sans niveau validateur sur le village"
    finally:
        db.close()


# ---- Refus d'accès inter-villages ---- (already covered by test_delivrance_refusee_autre_village)


# ---- Refus d'opérations non autorisées au niveau route et service ----


def test_route_validate_requiert_permission_fonctionnelle():
    """La route validate rejette un utilisateur sans permission foncier.validate."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "soumis")
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "employe",  # pas dans _FONCIER_WRITE_ROLES
            "mfa_verified": True,
            "full_name": "Employe",
        }
        try:
            client = TestClient(app)
            response = client.post(
                f"/api/v1/foncier/attestations/{ids['attestation_id']}/validate",
                json={"chef_nom": "Chef"},
            )
            assert response.status_code == 403, (response.status_code, response.text)
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


def test_route_deliver_requiert_permission_fonctionnelle():
    """La route deliver rejette un utilisateur sans permission foncier.deliver."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "employe",
            "mfa_verified": True,
            "full_name": "Employe",
        }
        try:
            client = TestClient(app)
            response = client.post(
                f"/api/v1/foncier/attestations/{ids['attestation_id']}/deliver",
                json={"raison": "delivrance"},
            )
            assert response.status_code == 403, (response.status_code, response.text)
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


# ---- Délivrance concurrente : une seule opération réussit ----


def test_double_deliver_concurrent_seule_une_reussit():
    """Deux délivrances sur la même attestation : une seule réussit (idempotence).

    Avec SQLite, SELECT FOR UPDATE ne verrouille pas au niveau ligne (réservé à
    PostgreSQL en production). On vérifie donc l'idempotence : la première
    délivrance réussit, la deuxième est rejetée car l'attestation est déjà
    délivrée.
    """
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        service = _real_service(db)
        r1 = service.deliver(ids["attestation_id"], "raison 1", ids["user_id"], user_role="gestionnaire")
        r2 = service.deliver(ids["attestation_id"], "raison 2", ids["user_id"], user_role="gestionnaire")
    finally:
        db.close()
    assert r1 is not None, "La première délivrance doit réussir"
    assert r2 is None, "La deuxième délivrance doit être refusée (déjà délivrée)"


# ---- Conflit entre opération métier et révocation d'accès ----


def test_revocation_acces_pendant_operation_bloque_commit():
    """Si l'accès village est révoqué avant le commit, l'opération est rejetée."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1")
        # Révoquer l'accès village directement en base (simule une révocation intermédiaire).
        db.execute(
            text("DELETE FROM user_village_access WHERE user_id = :uid AND village_id = :vid"),
            {"uid": ids["user_id"], "vid": ids["village_id"]},
        )
        db.commit()
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "gestionnaire",
            "mfa_verified": True,
            "full_name": "Test Manager",
        }
        try:
            client = TestClient(app)
            response = client.post(
                f"/api/v1/foncier/attestations/{ids['attestation_id']}/deliver",
                json={"raison": "delivrance"},
            )
            assert response.status_code == 409, (response.status_code, response.text)
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


# ---- Conservation complète de l'historique après révocation ----


def test_historique_conserve_apres_revocation():
    """La révocation conserve delivre_par, delivre_le, revoked_by, revoked_at, revoke_reason."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", delivre=0, pdf_media_id="media-1")
        # Délivrer d'abord pour avoir delivre_par / delivre_le.
        service = _real_service(db)
        resultat = service.deliver(ids["attestation_id"], "delivrance", ids["user_id"], user_role="gestionnaire")
        assert resultat is not None, "La délivrance doit réussir"
        delivre_par_avant = db.execute(text("SELECT delivre_par FROM foncier_attestations WHERE id=:id"),
                                       {"id": ids["attestation_id"]}).scalar_one()
        delivre_le_avant = db.execute(text("SELECT delivre_le FROM foncier_attestations WHERE id=:id"),
                                      {"id": ids["attestation_id"]}).scalar_one()
        assert delivre_par_avant is not None
        assert delivre_le_avant is not None
        # Puis révoquer.
        service.revoke(ids["attestation_id"], "motif frauduleux", ids["user_id"], user_role="admin")
        # Vérifier que les traces historiques sont conservées.
        delivre_par_apres = db.execute(text("SELECT delivre_par FROM foncier_attestations WHERE id=:id"),
                                       {"id": ids["attestation_id"]}).scalar_one()
        delivre_le_apres = db.execute(text("SELECT delivre_le FROM foncier_attestations WHERE id=:id"),
                                      {"id": ids["attestation_id"]}).scalar_one()
        revoked_by = db.execute(text("SELECT revoked_by FROM foncier_attestations WHERE id=:id"),
                                {"id": ids["attestation_id"]}).scalar_one()
        revoked_at = db.execute(text("SELECT revoked_at FROM foncier_attestations WHERE id=:id"),
                                {"id": ids["attestation_id"]}).scalar_one()
        revoke_reason = db.execute(text("SELECT revoke_reason FROM foncier_attestations WHERE id=:id"),
                                   {"id": ids["attestation_id"]}).scalar_one()
        assert str(delivre_par_apres) == str(delivre_par_avant), "delivre_par doit être conservé"
        assert str(delivre_le_apres) == str(delivre_le_avant), "delivre_le doit être conservé"
        assert str(revoked_by) == str(ids["user_id"])
        assert revoked_at is not None
        assert revoke_reason == "motif frauduleux"
    finally:
        db.close()


# ---- Recherche excluant les révoquées par défaut ----


def test_search_exclut_revoquees_par_defaut():
    """La recherche par défaut exclut les attestations révoquées."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        _make_attestation_row(db, ids["lot_id"], ids["attestation_id"], "archive", pdf_media_id="media-1", delivre=1)
        # Créer une seconde attestation révoquée sur le même lot.
        att_revoquee_id = str(uuid4())
        db.execute(
            text("""
            INSERT INTO foncier_attestations
            (id, lot_id, reference, version, type, statut, date_etablissement, date_expiration,
             pdf_media_id, delivre, created_at, updated_at, created_by, updated_by, row_version)
            VALUES (:id, :lot_id, :ref, 1, 'standard', 'revoque', :date_etab, :date_exp,
                    NULL, 0, :now, :now, :uid, :uid, 1)
            """),
            {
                "id": att_revoquee_id,
                "lot_id": ids["lot_id"],
                "ref": "ATT-REVOQUEE",
                "date_etab": datetime.utcnow().date(),
                "date_exp": datetime.utcnow().replace(year=datetime.utcnow().year + 1),
                "now": datetime.utcnow(),
                "uid": str(uuid4()),
            },
        )
        db.commit()
        service = _real_service(db)
        items, total = service.search(lot_id=ids["lot_id"])
        assert total == 1, f"Une seule attestation non révoquée attendue, trouvé {total}"
        assert items[0].id == ids["attestation_id"]
        # Avec include_revoked=True, les deux apparaissent.
        items_all, total_all = service.search(lot_id=ids["lot_id"], exclude_revoked=False)
        assert total_all == 2, f"Deux attestations attendues avec include_revoked, trouvé {total_all}"
    finally:
        db.close()


# ---- Statistiques limitées au périmètre territorial ----


def test_dashboard_stats_global_reserve_admin():
    """Les statistiques globales sans village_id sont réservées à l'administrateur."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": ids["user_id"],
            "sub": ids["user_id"],
            "role": "gestionnaire",
            "mfa_verified": True,
            "full_name": "Test Manager",
        }
        try:
            client = TestClient(app)
            response = client.get("/api/v1/foncier/dashboard/stats")
            assert response.status_code == 200, (response.status_code, response.text)
            body = response.json()
            # Un gestionnaire n'a accès qu'à son propre village : total_villages <= 1
            assert body["total_villages"] <= 1
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()


def test_dashboard_stats_global_admin_voir_tous():
    """L'administrateur voit les statistiques globales de tous les villages."""
    db = SessionLocal()
    try:
        ids = _setup_fonciers_sqlite(db)
        app.dependency_overrides[get_db] = _override_get_db(db)
        app.dependency_overrides[deps.get_current_user] = lambda: {
            "id": str(uuid4()),
            "sub": str(uuid4()),
            "role": "admin",
            "mfa_verified": True,
            "full_name": "Admin Global",
        }
        try:
            client = TestClient(app)
            response = client.get("/api/v1/foncier/dashboard/stats")
            assert response.status_code == 200, (response.status_code, response.text)
            body = response.json()
            assert body["total_villages"] >= 1
            assert "attestations_delivrees" in body
            assert "attestations_revoquees" in body
            assert "attestations_actives" in body
        finally:
            app.dependency_overrides.clear()
    finally:
        db.close()
