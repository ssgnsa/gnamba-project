# Foncier API Routes - FastAPI
# Endpoints REST pour le module Foncier

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db, SessionLocal
from app.api.deps import get_current_user
from app.services.foncier import (
    get_village_service, get_lotissement_service, get_ilot_service,
    get_lot_service, get_attestation_service, get_audit_service,
    get_user_access_service
)
from app.schemas.foncier import (
    VillageCreate, VillageUpdate, VillageResponse, VillageWithStats, VillageStats,
    LotissementCreate, LotissementUpdate, LotissementResponse,
    IlotCreate, IlotUpdate, IlotResponse,
    LotCreate, LotUpdate, LotResponse, LotSearchParams, LotArchiveRequest,
    AttestationCreate, AttestationUpdate, AttestationResponse,
    AttestationSubmitRequest, AttestationValidateRequest, AttestationScanRequest,
    TemoinCreate, TemoinResponse, DuplicateCheckParams,
    AttestationVerificationResponse, PaginatedResponse,
    ActivityLogResponse, AuditSearchParams, TimelineResponse,
    SyncStatusResponse, SyncQueueItem, ConflictResolutionRequest
)

router = APIRouter(prefix="/api/v1/foncier", tags=["foncier"])

# ============================================
# DEPENDENCY - USER ID
# ============================================

def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Extrait l'ID utilisateur depuis le token JWT"""
    user_id = current_user.get("id") or current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Utilisateur non authentifié")
    return user_id

def get_device_id(current_user: dict = Depends(get_current_user)) -> str:
    return current_user.get("device_id", "web")

# ============================================
# VILLAGES
# ============================================

@router.post("/villages", response_model=VillageResponse, status_code=status.HTTP_201_CREATED)
def create_village(
    data: VillageCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Crée un nouveau village"""
    service = get_village_service(db)
    try:
        village = service.create(data, user_id)
        return village
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/villages", response_model=List[VillageResponse])
def list_villages(
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Liste les villages"""
    service = get_village_service(db)
    params = LotSearchParams(search=search, limit=limit, offset=offset)
    items, _ = service.search(params)
    return items

@router.get("/villages/with-stats", response_model=List[VillageWithStats])
def list_villages_with_stats(db: Session = Depends(get_db)):
    """Liste les villages avec leurs statistiques"""
    service = get_village_service(db)
    return service.get_all_with_stats()

@router.get("/villages/{village_id}", response_model=VillageResponse)
def get_village(village_id: UUID, db: Session = Depends(get_db)):
    """Récupère un village par ID"""
    service = get_village_service(db)
    village = service.repo.get(village_id)
    if not village:
        raise HTTPException(status_code=404, detail="Village introuvable")
    return village

@router.get("/villages/{village_id}/with-stats", response_model=VillageWithStats)
def get_village_with_stats(village_id: UUID, db: Session = Depends(get_db)):
    """Récupère un village avec ses statistiques détaillées"""
    service = get_village_service(db)
    result = service.get_with_stats(village_id)
    if not result:
        raise HTTPException(status_code=404, detail="Village introuvable")
    return result

@router.patch("/villages/{village_id}", response_model=VillageResponse)
def update_village(
    village_id: UUID,
    data: VillageUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Met à jour un village"""
    service = get_village_service(db)
    try:
        village = service.update(village_id, data, user_id)
        if not village:
            raise HTTPException(status_code=404, detail="Village introuvable")
        return village
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/villages/{village_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_village(
    village_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Supprime (archive) un village"""
    service = get_village_service(db)
    if not service.delete(village_id, user_id):
        raise HTTPException(status_code=404, detail="Village introuvable")

# ============================================
# LOTISSEMENTS
# ============================================

@router.post("/villages/{village_id}/lotissements", response_model=LotissementResponse, status_code=status.HTTP_201_CREATED)
def create_lotissement(
    village_id: UUID,
    data: LotissementCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Crée un lotissement dans un village"""
    service = get_lotissement_service(db)
    try:
        lotissement = service.create(village_id, data, user_id)
        return lotissement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/villages/{village_id}/lotissements", response_model=List[LotissementResponse])
def list_lotissements(
    village_id: UUID,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Liste les lotissements d'un village"""
    service = get_lotissement_service(db)
    params = LotSearchParams(search=search, limit=limit, offset=offset)
    items, _ = service.search(village_id, params)
    return items

@router.get("/lotissements/{lotissement_id}", response_model=LotissementResponse)
def get_lotissement(lotissement_id: UUID, db: Session = Depends(get_db)):
    """Récupère un lotissement par ID"""
    service = get_lotissement_service(db)
    lotissement = service.repo.get(lotissement_id)
    if not lotissement:
        raise HTTPException(status_code=404, detail="Lotissement introuvable")
    return lotissement

@router.patch("/lotissements/{lotissement_id}", response_model=LotissementResponse)
def update_lotissement(
    lotissement_id: UUID,
    data: LotissementUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Met à jour un lotissement"""
    service = get_lotissement_service(db)
    try:
        lotissement = service.update(lotissement_id, data, user_id)
        if not lotissement:
            raise HTTPException(status_code=404, detail="Lotissement introuvable")
        return lotissement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/lotissements/{lotissement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lotissement(lotissement_id: UUID, db: Session = Depends(get_db)):
    """Supprime un lotissement"""
    service = get_lotissement_service(db)
    if not service.delete(lotissement_id):
        raise HTTPException(status_code=404, detail="Lotissement introuvable")

# ============================================
# ÎLOTS
# ============================================

@router.post("/lotissements/{lotissement_id}/ilots", response_model=IlotResponse, status_code=status.HTTP_201_CREATED)
def create_ilot(
    lotissement_id: UUID,
    data: IlotCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Crée un îlot dans un lotissement"""
    service = get_ilot_service(db)
    try:
        ilot = service.create(lotissement_id, data, user_id)
        return ilot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lotissements/{lotissement_id}/ilots", response_model=List[IlotResponse])
def list_ilots(lotissement_id: UUID, db: Session = Depends(get_db)):
    """Liste les îlots d'un lotissement"""
    service = get_ilot_service(db)
    return service.get_by_lotissement(lotissement_id)

@router.get("/ilots/{ilot_id}", response_model=IlotResponse)
def get_ilot(ilot_id: UUID, db: Session = Depends(get_db)):
    """Récupère un îlot par ID"""
    service = get_ilot_service(db)
    ilot = service.repo.get(ilot_id)
    if not ilot:
        raise HTTPException(status_code=404, detail="Îlot introuvable")
    return ilot

@router.patch("/ilots/{ilot_id}", response_model=IlotResponse)
def update_ilot(
    ilot_id: UUID,
    data: IlotUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Met à jour un îlot"""
    service = get_ilot_service(db)
    try:
        ilot = service.update(ilot_id, data, user_id)
        if not ilot:
            raise HTTPException(status_code=404, detail="Îlot introuvable")
        return ilot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/ilots/{ilot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ilot(ilot_id: UUID, db: Session = Depends(get_db)):
    """Supprime un îlot"""
    service = get_ilot_service(db)
    if not service.delete(ilot_id):
        raise HTTPException(status_code=404, detail="Îlot introuvable")

# ============================================
# LOTS
# ============================================

@router.post("/ilots/{ilot_id}/lots", response_model=LotResponse, status_code=status.HTTP_201_CREATED)
def create_lot(
    ilot_id: UUID,
    data: LotCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id),
    device_id: str = Depends(get_device_id)
):
    """Crée un lot dans un îlot"""
    service = get_lot_service(db)
    try:
        lot = service.create(ilot_id, data, user_id, device_id)
        return lot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ilots/{ilot_id}/lots", response_model=PaginatedResponse)
def list_lots_by_ilot(
    ilot_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Liste les lots d'un îlot avec pagination"""
    service = get_lot_service(db)
    params = LotSearchParams(ilot_id=ilot_id, limit=page_size, offset=(page - 1) * page_size)
    items, total = service.search(params)
    # Convert SQLAlchemy models to Pydantic models
    from app.schemas.foncier import LotResponse
    items_pydantic = [LotResponse.model_validate(item, from_attributes=True) for item in items]
    return PaginatedResponse(
        items=items_pydantic,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/lots", response_model=PaginatedResponse)
def search_lots(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    village_id: Optional[UUID] = None,
    lotissement_id: Optional[UUID] = None,
    ilot_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Recherche avancée de lots"""
    service = get_lot_service(db)
    params = LotSearchParams(
        search=search,
        statut=statut,
        village_id=village_id,
        lotissement_id=lotissement_id,
        ilot_id=ilot_id,
        limit=page_size,
        offset=(page - 1) * page_size
    )
    items, total = service.search(params)
    # Convert SQLAlchemy models to Pydantic models
    from app.schemas.foncier import LotResponse
    items_pydantic = [LotResponse.model_validate(item, from_attributes=True) for item in items]
    return PaginatedResponse(
        items=items_pydantic,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/lots/{lot_id}", response_model=LotResponse)
def get_lot(lot_id: UUID, db: Session = Depends(get_db)):
    """Récupère un lot par ID avec hiérarchie"""
    service = get_lot_service(db)
    lot = service.get_with_hierarchy(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot introuvable")
    return lot

@router.patch("/lots/{lot_id}", response_model=LotResponse)
def update_lot(
    lot_id: UUID,
    data: LotUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id),
    device_id: str = Depends(get_device_id)
):
    """Met à jour un lot"""
    service = get_lot_service(db)
    try:
        lot = service.update(lot_id, data, user_id, device_id)
        if not lot:
            raise HTTPException(status_code=404, detail="Lot introuvable")
        return lot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/lots/{lot_id}/archive", response_model=LotResponse)
def archive_lot(
    lot_id: UUID,
    data: LotArchiveRequest = None,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Archive (soft delete) un lot"""
    if data is None:
        data = LotArchiveRequest()
    service = get_lot_service(db)
    lot = service.archive(lot_id, data.reason, user_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot introuvable ou déjà archivé")
    return lot

@router.post("/lots/{lot_id}/restore", response_model=LotResponse)
def restore_lot(
    lot_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Restaure un lot archivé"""
    service = get_lot_service(db)
    lot = service.restore(lot_id, user_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot introuvable ou non archivé")
    return lot

@router.post("/lots/check-duplicate")
def check_duplicate(
    params: DuplicateCheckParams,
    db: Session = Depends(get_db)
):
    """Vérifie si un lot existe déjà (doublon)"""
    service = get_lot_service(db)
    duplicates = service.check_duplicate(params)
    return {"duplicates": duplicates, "is_duplicate": len(duplicates) > 0}


@router.get("/lots/exists")
def check_lot_exists(
    reference: Optional[str] = None,
    numero_lot: Optional[str] = None,
    ilot_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Vérifie si un lot existe (par référence, numéro ou îlot)"""
    with SessionLocal() as session:
        query = "SELECT id, reference, numero_lot, ilot_id FROM foncier_lots WHERE deleted_at IS NULL"
        params = {}
        conditions = []
        if reference:
            conditions.append("reference = :reference")
            params["reference"] = reference
        if numero_lot:
            conditions.append("numero_lot = :numero_lot AND ilot_id = :ilot_id")
            params["numero_lot"] = numero_lot
        if ilot_id:
            params["ilot_id"] = ilot_id
        if conditions:
            query += " AND " + " AND ".join(conditions)
        row = session.execute(text(query), params).fetchone()
    if row:
        return {"exists": True, "lot_id": str(row[0]), "reference": row[1], "numero_lot": row[2]}
    return {"exists": False}


@router.post("/ilots/{ilot_id}/lots/import")
def import_lots(
    ilot_id: UUID,
    file: bytes = File(...),
    skip_header: bool = Form(True),
    delimiter: str = Form(","),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id),
    device_id: str = Depends(get_device_id)
):
    """Import lots from CSV/Excel"""
    # TODO: Implement CSV import
    raise HTTPException(status_code=501, detail="Import CSV non implémenté")

@router.post("/lots/export")
def export_lots(
    village_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export lots to CSV"""
    # TODO: Implement CSV export
    raise HTTPException(status_code=501, detail="Export CSV non implémenté")

# ============================================
# ATTESTATIONS
# ============================================

@router.post("/lots/{lot_id}/attestations", response_model=AttestationResponse, status_code=status.HTTP_201_CREATED)
def create_attestation(
    lot_id: UUID,
    data: AttestationCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id),
    device_id: str = Depends(get_device_id)
):
    """Crée une attestation pour un lot"""
    service = get_attestation_service(db)
    try:
        attestation = service.create(lot_id, data, user_id, device_id)
        return attestation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lots/{lot_id}/attestations", response_model=List[AttestationResponse])
def list_attestations_by_lot(lot_id: UUID, db: Session = Depends(get_db)):
    """Liste les attestations d'un lot"""
    service = get_attestation_service(db)
    return service.get_by_lot(lot_id)

@router.get("/attestations", response_model=PaginatedResponse)
def search_attestations(
    lot_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Recherche d'attestations"""
    service = get_attestation_service(db)
    items, total = service.search(lot_id=lot_id, statut=statut, limit=page_size, offset=(page - 1) * page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/attestations/{attestation_id}", response_model=AttestationResponse)
def get_attestation(attestation_id: UUID, db: Session = Depends(get_db)):
    """Récupère une attestation par ID avec relations"""
    service = get_attestation_service(db)
    attestation = service.get_with_relations(attestation_id)
    if not attestation:
        raise HTTPException(status_code=404, detail="Attestation introuvable")
    return attestation

@router.patch("/attestations/{attestation_id}", response_model=AttestationResponse)
def update_attestation(
    attestation_id: UUID,
    data: AttestationUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Met à jour une attestation (mode brouillon seulement)"""
    service = get_attestation_service(db)
    # TODO: implémenter update dans le service
    raise HTTPException(status_code=501, detail="Non implémenté")

@router.post("/attestations/{attestation_id}/submit", response_model=AttestationResponse)
def submit_attestation(
    attestation_id: UUID,
    data: AttestationSubmitRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Soumet une attestation pour validation (brouillon -> soumis)"""
    service = get_attestation_service(db)
    attestation = service.submit(attestation_id, data, user_id)
    if not attestation:
        raise HTTPException(status_code=400, detail="Attestation introuvable ou ne peut pas être soumise")
    return attestation

@router.post("/attestations/{attestation_id}/validate", response_model=AttestationResponse)
def validate_attestation(
    attestation_id: UUID,
    data: AttestationValidateRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Valide une attestation (soumis -> valide)"""
    service = get_attestation_service(db)
    attestation = service.validate(attestation_id, data, user_id)
    if not attestation:
        raise HTTPException(status_code=400, detail="Attestation introuvable ou ne peut pas être validée")
    return attestation

@router.post("/attestations/{attestation_id}/scan", response_model=AttestationResponse)
def scan_attestation(
    attestation_id: UUID,
    data: AttestationScanRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Archive le PDF scanné (valide -> archive)"""
    service = get_attestation_service(db)
    attestation = service.scan(attestation_id, data, user_id)
    if not attestation:
        raise HTTPException(status_code=400, detail="Attestation introuvable ou ne peut pas être archivée")
    return attestation

@router.post("/attestations/{attestation_id}/revoke", response_model=AttestationResponse)
def revoke_attestation(
    attestation_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Révoque une attestation"""
    service = get_attestation_service(db)
    attestation = service.revoke(attestation_id, reason, user_id)
    if not attestation:
        raise HTTPException(status_code=400, detail="Attestation introuvable ou ne peut pas être révoquée")
    return attestation

@router.post("/attestations/{attestation_id}/generate-pdf")
def generate_attestation_pdf(
    attestation_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Génère le PDF + QR Code d'une attestation"""
    # TODO: Implement PDF generation
    raise HTTPException(status_code=501, detail="Génération PDF non implémentée")

@router.get("/attestations/{attestation_id}/pdf")
def download_attestation_pdf(
    attestation_id: UUID,
    db: Session = Depends(get_db)
):
    """Télécharge le PDF d'une attestation"""
    # TODO: Implement PDF download
    raise HTTPException(status_code=501, detail="Téléchargement PDF non implémenté")

# ============================================
# VÉRIFICATION PUBLIQUE
# ============================================

@router.get("/attestations/verify/{reference}", response_model=AttestationVerificationResponse)
def verify_attestation(reference: str, db: Session = Depends(get_db)):
    """Vérification publique d'une attestation par référence"""
    service = get_attestation_service(db)
    result = service.verify(reference)
    if not result:
        raise HTTPException(status_code=404, detail="Attestation introuvable")
    
    return AttestationVerificationResponse(
        reference=result["reference"],
        statut=result["statut"],
        date_etablissement=result.get("date_etablissement"),
        date_expiration=result.get("date_expiration"),
        lot={
            "reference": result["lot_reference"],
            "numero": result["numero_lot"],
            "superficie": result["superficie"],
        },
        village={
            "nom": result["village_nom"],
            "code": result["village_code"],
        },
        proprietaire={
            "nom": result.get("proprietaire_nom"),
            "prenom": result.get("proprietaire_prenom"),
            "telephone": result.get("proprietaire_telephone"),
            "email": result.get("proprietaire_email"),
        },
        verifie_le=datetime.utcnow(),
        authentique=result["statut"] in ["valide", "archive"]
    )

# ============================================
# AUDIT / HISTORIQUE
# ============================================

@router.get("/audit/timeline/{entity_type}/{entity_id}", response_model=TimelineResponse)
def get_timeline(
    entity_type: str,
    entity_id: UUID,
    db: Session = Depends(get_db)
):
    """Récupère la timeline d'audit d'une entité"""
    service = get_audit_service(db)
    return service.get_timeline(entity_type, entity_id)

@router.get("/audit", response_model=PaginatedResponse)
def search_audit(
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    action: Optional[str] = None,
    user_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Recherche dans l'audit trail"""
    service = get_audit_service(db)
    params = AuditSearchParams(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        limit=page_size,
        offset=(page - 1) * page_size
    )
    items, total = service.search(params)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.post("/audit/export-pdf")
def export_audit_pdf(
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Export audit trail to PDF"""
    # TODO: Implement PDF export
    raise HTTPException(status_code=501, detail="Export PDF audit non implémenté")

@router.post("/audit/export-csv")
def export_audit_csv(
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Export audit trail to CSV"""
    # TODO: Implement CSV export
    raise HTTPException(status_code=501, detail="Export CSV audit non implémenté")

# ============================================
# ACCÈS UTILISATEUR / VILLAGE
# ============================================

@router.post("/access/{user_id}/villages/{village_id}")
def grant_village_access(
    user_id: UUID,
    village_id: UUID,
    access_level: str,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_user_id)
):
    """Accorde un accès village à un utilisateur"""
    service = get_user_access_service(db)
    # Vérifier que l'utilisateur actuel a droit de gestion
    if not service.check_access(current_user_id, village_id, "gestionnaire"):
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    access = service.grant_access(user_id, village_id, access_level, current_user_id)
    return {"status": "ok", "access": access}

@router.delete("/access/{user_id}/villages/{village_id}")
def revoke_village_access(
    user_id: UUID,
    village_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_user_id)
):
    """Révoque un accès village"""
    service = get_user_access_service(db)
    if not service.check_access(current_user_id, village_id, "gestionnaire"):
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    service.revoke_access(user_id, village_id)
    return {"status": "ok"}

@router.get("/access/me/villages")
def get_my_villages(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Récupère les villages accessibles par l'utilisateur courant"""
    service = get_user_access_service(db)
    accesses = service.get_user_villages(user_id)
    return {"accesses": accesses}

@router.get("/villages/{village_id}/users")
def get_village_users(
    village_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_user_id)
):
    """Liste les utilisateurs ayant accès à un village"""
    service = get_user_access_service(db)
    if not service.check_access(current_user_id, village_id, "validateur"):
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    users = service.get_village_users(village_id)
    return {"users": users}

# ============================================
# SYNC OFFLINE
# ============================================

@router.get("/sync/status", response_model=SyncStatusResponse)
def get_sync_status(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Statut de la synchronisation offline"""
    # TODO: Implement sync status
    return SyncStatusResponse(
        pending=0,
        last_sync=None,
        last_error=None,
        queue_size=0
    )

@router.post("/sync/trigger")
def trigger_sync(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Déclenche une synchronisation"""
    # TODO: Implement sync trigger
    return {"synced": 0, "failed": 0, "errors": []}

@router.get("/sync/queue", response_model=List[SyncQueueItem])
def get_sync_queue(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Récupère la file d'attente de sync"""
    # TODO: Implement sync queue
    return []

@router.post("/sync/queue/{queue_item_id}/resolve")
def resolve_sync_conflict(
    queue_item_id: UUID,
    data: ConflictResolutionRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Résout un conflit de sync"""
    # TODO: Implement conflict resolution
    raise HTTPException(status_code=501, detail="Résolution conflit non implémentée")

@router.post("/sync/cleanup")
def cleanup_sync(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Nettoie la queue de sync"""
    # TODO: Implement cleanup
    return {"deleted": 0}

# ============================================
# STATISTIQUES / DASHBOARD
# ============================================

@router.get("/dashboard/stats")
def get_dashboard_stats(
    village_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Statistiques pour le dashboard"""
    service = get_village_service(db)
    if village_id:
        # Vérifier accès
        access_service = get_user_access_service(db)
        if not access_service.check_access(user_id, village_id, "lecteur"):
            raise HTTPException(status_code=403, detail="Accès refusé")
        return service.get_stats(village_id)
    else:
        # Global stats
        result = db.execute(text("""
            SELECT 
                COUNT(DISTINCT v.id) as total_villages,
                COUNT(DISTINCT ls.id) as total_lotissements,
                COUNT(DISTINCT i.id) as total_ilots,
                COUNT(l.id) as total_lots,
                COUNT(CASE WHEN l.statut = 'actif' THEN 1 END) as lots_actifs,
                COUNT(CASE WHEN l.statut = 'vendu' THEN 1 END) as lots_vendus,
                COUNT(CASE WHEN l.statut = 'litige' THEN 1 END) as lots_litiges,
                COUNT(CASE WHEN l.statut = 'reserve' THEN 1 END) as lots_reserves,
                COALESCE(SUM(l.superficie), 0) as superficie_totale,
                COUNT(a.id) as total_attestations,
                COUNT(CASE WHEN a.statut = 'valide' THEN 1 END) as attestations_validees
            FROM foncier_villages v
            LEFT JOIN foncier_lotissements ls ON ls.village_id = v.id
            LEFT JOIN foncier_ilots i ON i.lotissement_id = ls.id
            LEFT JOIN foncier_lots l ON l.ilot_id = i.id AND l.deleted_at IS NULL
            LEFT JOIN foncier_attestations a ON a.lot_id = l.id AND a.deleted_at IS NULL
            WHERE v.actif = true
        """)).fetchone()
        return dict(result._mapping)


# ============================================
# ADDITIONAL ENDPOINTS FOR FRONTEND COMPATIBILITY
# ============================================

@router.get("/lotissements", response_model=List[LotissementResponse])
def list_all_lotissements(
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Liste tous les lotissements (endpoint plat pour compatibilité frontend)"""
    with SessionLocal() as session:
        query = """
            SELECT id, village_id, nom, code, description, superficie_totale, 
                   nombre_lots_prevus, arrete_lotissement, arrete_date,
                   created_at, updated_at, created_by, updated_by
            FROM foncier_lotissements
            WHERE 1=1
        """
        params = {}
        if search:
            query += " AND (nom ILIKE :search OR code ILIKE :search)"
            params["search"] = f"%{search}%"
        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset
        rows = session.execute(text(query), params).fetchall()
    return [
        {
            "id": str(row[0]),
            "village_id": str(row[1]),
            "nom": row[2],
            "code": row[3],
            "description": row[4],
            "superficie_totale": float(row[5]) if row[5] else None,
            "nombre_lots_prevus": row[6],
            "arrete_lotissement": row[7],
            "arrete_date": row[8],
            "created_at": row[9],
            "updated_at": row[10],
            "created_by": str(row[11]) if row[11] else None,
            "updated_by": str(row[12]) if row[12] else None,
        }
        for row in rows
    ]


@router.get("/ilots", response_model=List[IlotResponse])
def list_all_ilots(
    lotissement_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Liste tous les îlots (endpoint plat pour compatibilité frontend)"""
    with SessionLocal() as session:
        if lotissement_id:
            rows = session.execute(
                text("""
                    SELECT id, lotissement_id, numero, description, superficie_totale,
                           created_at, updated_at, created_by, updated_by
                    FROM foncier_ilots
                    WHERE lotissement_id = :lotissement_id
                    ORDER BY numero
                    """
                ),
                {"lotissement_id": lotissement_id},
            ).fetchall()
        else:
            rows = session.execute(
                text("""
                    SELECT id, lotissement_id, numero, description, superficie_totale,
                           created_at, updated_at, created_by, updated_by
                    FROM foncier_ilots
                    ORDER BY lotissement_id, numero
                    """
                )
            ).fetchall()
    return [
        {
            "id": str(row[0]),
            "lotissement_id": str(row[1]),
            "numero": row[2],
            "description": row[3],
            "superficie_totale": float(row[4]) if row[4] else None,
            "created_at": row[5],
            "updated_at": row[6],
            "created_by": str(row[7]) if row[7] else None,
            "updated_by": str(row[8]) if row[8] else None,
        }
        for row in rows
    ]


@router.get("/assembly")
def get_assembly(
    village_id: Optional[UUID] = None,
    lotissement_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Récupère l'assemblage hiérarchique (village -> lotissement -> ilot -> lots) pour compatibilité frontend"""
    if village_id:
        # Return lotissements for the village
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, village_id, nom, code, description
                    FROM foncier_lotissements
                    WHERE village_id = :village_id
                    ORDER BY nom
                    """
                ),
                {"village_id": village_id},
            ).fetchall()
        return [
            {"id": str(row[0]), "village_id": str(row[1]), "nom": row[2], "code": row[3], "description": row[4]}
            for row in rows
        ]
    elif lotissement_id:
        # Return ilots for the lotissement
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, lotissement_id, numero, description
                    FROM foncier_ilots
                    WHERE lotissement_id = :lotissement_id
                    ORDER BY numero
                    """
                ),
                {"lotissement_id": lotissement_id},
            ).fetchall()
        return [
            {"id": str(row[0]), "lotissement_id": str(row[1]), "numero": row[2], "description": row[3]}
            for row in rows
        ]
    else:
        # Return villages
        with SessionLocal() as session:
            rows = session.execute(
                text("""
                    SELECT id, nom, code
                    FROM foncier_villages
                    WHERE actif = true
                    ORDER BY nom
                    """
                )
            ).fetchall()
        return [
            {"id": str(row[0]), "nom": row[1], "code": row[2]}
            for row in rows
        ]


@router.get("/villages/names")
def get_village_names(db: Session = Depends(get_db)):
    """Récupère la liste des noms de villages pour compatibilité frontend"""
    with SessionLocal() as session:
        rows = session.execute(
            text("""
                SELECT id, nom, code
                FROM foncier_villages
                WHERE actif = true
                ORDER BY nom
                """
            )
        ).fetchall()
    return [
        {"id": str(row[0]), "nom": row[1], "code": row[2]}
        for row in rows
    ]


@router.post("/attestations/{attestation_id}/sign")
def sign_attestation(
    attestation_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_user_id)
):
    """Signe une attestation (ajoute signature numérique)"""
    signature = payload.get("signature", "")
    if not signature:
        raise HTTPException(status_code=400, detail="Signature requise")
    
    with SessionLocal() as session:
        # Check attestation exists
        row = session.execute(
            text("SELECT id FROM foncier_attestations WHERE id = :id AND deleted_at IS NULL"),
            {"id": attestation_id},
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Attestation introuvable")
        
        # Update with signature
        session.execute(
            text("""
                UPDATE foncier_attestations
                SET signature_numerique = :signature,
                    updated_at = NOW(),
                    updated_by = :user_id
                WHERE id = :id
            """
            ),
            {"id": attestation_id, "signature": signature, "user_id": user_id},
        )
        session.commit()
    
    return {"status": "ok", "attestation_id": str(attestation_id), "signed_at": datetime.utcnow().isoformat()}
