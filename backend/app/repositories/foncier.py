# Foncier Repository - SQLAlchemy
# Couche d'accès aux données pour le nouveau schéma PostgreSQL

from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
from sqlalchemy import select, func, and_, or_, desc, asc, text, delete, update
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.foncier import (
    FoncierVillage, FoncierLotissement, FoncierIlot, FoncierLot,
    FoncierAttestation, FoncierAttestationTemoin, UserVillageAccess, ActivityLog
)
from app.schemas.foncier import (
    VillageCreate, VillageUpdate, LotissementCreate, LotissementUpdate,
    IlotCreate, IlotUpdate, LotCreate, LotUpdate, LotSearchParams,
    AttestationCreate, AttestationUpdate, TemoinCreate,
    ActivityLogCreate, AuditSearchParams
)

# ============================================
# BASE REPOSITORY
# ============================================

class BaseRepository:
    def __init__(self, db: Session, model):
        self.db = db
        self.model = model
    
    def create(self, data: dict) -> Any:
        obj = self.model(**data)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def get(self, id: UUID) -> Any:
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_by_id(self, id: UUID, include_deleted: bool = False) -> Any:
        query = self.db.query(self.model).filter(self.model.id == id)
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.filter(self.model.deleted_at.is_(None))
        return query.first()
    
    def list(self, limit: int = 50, offset: int = 0, order_by: str = "created_at", 
             descending: bool = True, filters: Dict = None, include_deleted: bool = False) -> List:
        query = self.db.query(self.model)
        
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.filter(self.model.deleted_at.is_(None))
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        if hasattr(self.model, order_by):
            col = getattr(self.model, order_by)
            query = query.order_by(desc(col) if descending else asc(col))
        
        return query.offset(offset).limit(limit).all()
    
    def count(self, filters: Dict = None, include_deleted: bool = False) -> int:
        query = self.db.query(func.count(self.model.id))
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.filter(self.model.deleted_at.is_(None))
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        return query.scalar()
    
    def update(self, id: UUID, data: dict) -> Any:
        obj = self.get(id)
        if not obj:
            return None
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: UUID, soft: bool = True) -> bool:
        obj = self.get(id)
        if not obj:
            return False
        if soft and hasattr(self.model, 'deleted_at'):
            obj.deleted_at = datetime.utcnow()
            self.db.commit()
            return True
        else:
            self.db.delete(obj)
            self.db.commit()
            return True


# ============================================
# VILLAGE REPOSITORY
# ============================================

class VillageRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, FoncierVillage)
    
    def get_by_code(self, code: str) -> Optional[FoncierVillage]:
        return self.db.query(FoncierVillage).filter(
            FoncierVillage.code == code,
            FoncierVillage.actif == True
        ).first()
    
    def search(self, params: LotSearchParams) -> Tuple[List[FoncierVillage], int]:
        query = self.db.query(FoncierVillage).filter(FoncierVillage.actif == True)
        
        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(FoncierVillage.nom).like(search_term),
                    func.lower(FoncierVillage.code).like(search_term),
                )
            )
        
        total = query.count()
        items = query.offset(params.offset).limit(params.limit).all()
        return items, total
    
    def get_with_stats(self, village_id: UUID) -> Optional[Dict]:
        """Récupère un village avec ses statistiques"""
        village = self.get(village_id)
        if not village:
            return None
        
        stats = self.get_stats(village_id)
        return {
            "village": village,
            "stats": stats
        }
    
    def get_stats(self, village_id: UUID) -> Dict[str, Any]:
        # Requête SQL brute pour performance
        result = self.db.execute(text("""
            SELECT 
                v.id as village_id,
                v.nom as village_nom,
                v.code as village_code,
                COUNT(l.id) as total_lots,
                COUNT(CASE WHEN l.statut = 'actif' THEN 1 END) as lots_actifs,
                COUNT(CASE WHEN l.statut = 'vendu' THEN 1 END) as lots_vendus,
                COUNT(CASE WHEN l.statut = 'litige' THEN 1 END) as lots_litiges,
                COUNT(CASE WHEN l.statut = 'reserve' THEN 1 END) as lots_reserves,
                COUNT(CASE WHEN l.statut = 'archive' THEN 1 END) as lots_archives,
                COALESCE(SUM(l.superficie), 0) as superficie_totale,
                COALESCE(SUM(CASE WHEN l.statut = 'vendu' THEN l.superficie ELSE 0 END), 0) as superficie_vendue,
                COUNT(a.id) as nb_attestations,
                COUNT(CASE WHEN a.statut = 'valide' THEN 1 END) as nb_attestations_validees,
                COALESCE(SUM(CASE WHEN l.statut = 'vendu' THEN l.prix_cession ELSE 0 END), 0) as ca_total
            FROM foncier_villages v
            LEFT JOIN foncier_lotissements ls ON ls.village_id = v.id
            LEFT JOIN foncier_ilots i ON i.lotissement_id = ls.id
            LEFT JOIN foncier_lots l ON l.ilot_id = i.id AND l.deleted_at IS NULL
            LEFT JOIN foncier_attestations a ON a.lot_id = l.id AND a.deleted_at IS NULL
            WHERE v.id = :village_id AND v.deleted_at IS NULL
            GROUP BY v.id, v.nom, v.code
        """), {"village_id": str(village_id)}).fetchone()
        
        if result:
            return dict(result._mapping)
        return {}
    
    def get_all_with_stats(self) -> List[Dict]:
        result = self.db.execute(text("""
            SELECT 
                v.id as village_id,
                v.nom as village_nom,
                v.code as village_code,
                COUNT(l.id) as total_lots,
                COUNT(CASE WHEN l.statut = 'actif' THEN 1 END) as lots_actifs,
                COUNT(CASE WHEN l.statut = 'vendu' THEN 1 END) as lots_vendus,
                COUNT(CASE WHEN l.statut = 'litige' THEN 1 END) as lots_litiges,
                COUNT(CASE WHEN l.statut = 'reserve' THEN 1 END) as lots_reserves,
                COUNT(CASE WHEN l.statut = 'archive' THEN 1 END) as lots_archives,
                COALESCE(SUM(l.superficie), 0) as superficie_totale,
                COALESCE(SUM(CASE WHEN l.statut = 'vendu' THEN l.superficie ELSE 0 END), 0) as superficie_vendue,
                COUNT(a.id) as nb_attestations,
                COUNT(CASE WHEN a.statut = 'valide' THEN 1 END) as nb_attestations_validees,
                COALESCE(SUM(CASE WHEN l.statut = 'vendu' THEN l.prix_cession ELSE 0 END), 0) as ca_total
            FROM foncier_villages v
            LEFT JOIN foncier_lotissements ls ON ls.village_id = v.id
            LEFT JOIN foncier_ilots i ON i.lotissement_id = ls.id
            LEFT JOIN foncier_lots l ON l.ilot_id = i.id AND l.deleted_at IS NULL
            LEFT JOIN foncier_attestations a ON a.lot_id = l.id AND a.deleted_at IS NULL
            WHERE v.deleted_at IS NULL
            GROUP BY v.id, v.nom, v.code
            ORDER BY v.nom
        """)).fetchall()
        
        return [dict(row._mapping) for row in result]


# ============================================
# LOTISSEMENT REPOSITORY
# ============================================

class LotissementRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, FoncierLotissement)
    
    def get_by_village(self, village_id: UUID, include_deleted: bool = False) -> List[FoncierLotissement]:
        query = self.db.query(FoncierLotissement).filter(FoncierLotissement.village_id == village_id)
        if not include_deleted:
            # Note: lotissements n'ont pas deleted_at, on regarde le village
            query = query.join(FoncierVillage).filter(FoncierVillage.deleted_at.is_(None))
        return query.order_by(FoncierLotissement.nom).all()
    
    def search(self, village_id: UUID, params: LotSearchParams) -> Tuple[List[FoncierLotissement], int]:
        query = self.db.query(FoncierLotissement).filter(FoncierLotissement.village_id == village_id)
        
        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.filter(func.lower(FoncierLotissement.nom).like(search_term))
        
        total = query.count()
        items = query.offset(params.offset).limit(params.limit).all()
        return items, total


# ============================================
# ÎLOT REPOSITORY
# ============================================

class IlotRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, FoncierIlot)
    
    def get_by_lotissement(self, lotissement_id: UUID) -> List[FoncierIlot]:
        return self.db.query(FoncierIlot).filter(
            FoncierIlot.lotissement_id == lotissement_id
        ).order_by(FoncierIlot.numero).all()
    
    def search(self, lotissement_id: UUID, params: LotSearchParams) -> Tuple[List[FoncierIlot], int]:
        query = self.db.query(FoncierIlot).filter(FoncierIlot.lotissement_id == lotissement_id)
        
        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.filter(func.lower(FoncierIlot.numero).like(search_term))
        
        total = query.count()
        items = query.offset(params.offset).limit(params.limit).all()
        return items, total


# ============================================
# LOT REPOSITORY
# ============================================

class LotRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, FoncierLot)
    
    def get_by_reference(self, reference: str) -> Optional[FoncierLot]:
        return self.db.query(FoncierLot).filter(
            FoncierLot.reference == reference,
            FoncierLot.deleted_at.is_(None)
        ).first()
    
    def get_with_hierarchy(self, lot_id: UUID) -> Optional[Dict]:
        """Récupère un lot avec sa hiérarchie complète (village, lotissement, îlot)"""
        result = self.db.execute(text("""
            SELECT 
                l.*,
                i.numero as ilot_numero,
                i.id as ilot_id,
                ls.nom as lotissement_nom,
                ls.id as lotissement_id,
                ls.code as lotissement_code,
                v.nom as village_nom,
                v.id as village_id,
                v.code as village_code,
                p.nom as proprietaire_nom,
                p.prenom as proprietaire_prenom,
                p.telephone as proprietaire_telephone,
                p.email as proprietaire_email
            FROM foncier_lots l
            JOIN foncier_ilots i ON i.id = l.ilot_id
            JOIN foncier_lotissements ls ON ls.id = i.lotissement_id
            JOIN foncier_villages v ON v.id = ls.village_id
            LEFT JOIN parties p ON p.id = l.proprietaire_client_id
            WHERE l.id = :lot_id AND l.deleted_at IS NULL
        """), {"lot_id": str(lot_id)}).fetchone()
        
        if result:
            return dict(result._mapping)
        return None
    
    def search(self, params: LotSearchParams) -> Tuple[List[FoncierLot], int]:
        query = self.db.query(FoncierLot).filter(FoncierLot.deleted_at.is_(None))
        
        # Join pour filtrer par village/lotissement/îlot
        if params.village_id or params.lotissement_id:
            query = query.join(FoncierIlot).join(FoncierLotissement)
            if params.village_id:
                query = query.filter(FoncierLotissement.village_id == params.village_id)
            if params.lotissement_id:
                query = query.filter(FoncierIlot.lotissement_id == params.lotissement_id)
        
        if params.ilot_id:
            query = query.filter(FoncierLot.ilot_id == params.ilot_id)
        
        if params.statut:
            query = query.filter(FoncierLot.statut == params.statut)
        
        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(FoncierLot.reference).like(search_term),
                    func.lower(FoncierLot.numero_lot).like(search_term),
                    func.lower(FoncierLot.proprietaire_nom).like(search_term),
                    func.lower(FoncierLot.proprietaire_prenom).like(search_term),
                )
            )
        
        total = query.count()
        items = query.offset(params.offset).limit(params.limit).all()
        return items, total
    
    def check_duplicate(self, village_id: UUID, lotissement_id: UUID, 
                        ilot_id: UUID, numero_lot: str, exclude_id: Optional[UUID] = None) -> List[FoncierLot]:
        query = self.db.query(FoncierLot).filter(
            FoncierLot.deleted_at.is_(None),
            FoncierLot.numero_lot == numero_lot
        ).join(FoncierIlot).join(FoncierLotissement).filter(
            FoncierLotissement.village_id == village_id,
            FoncierIlot.lotissement_id == lotissement_id,
            FoncierIlot.id == ilot_id
        )
        
        if exclude_id:
            query = query.filter(FoncierLot.id != exclude_id)
        
        return query.all()
    
    def get_by_ilot(self, ilot_id: UUID, include_deleted: bool = False) -> List[FoncierLot]:
        query = self.db.query(FoncierLot).filter(FoncierLot.ilot_id == ilot_id)
        if not include_deleted:
            query = query.filter(FoncierLot.deleted_at.is_(None))
        return query.order_by(FoncierLot.numero_lot).all()
    
    def archive(self, lot_id: UUID, reason: str, user_id: UUID) -> Optional[FoncierLot]:
        obj = self.get(lot_id)
        if not obj or obj.deleted_at:
            return None
        obj.deleted_at = datetime.utcnow()
        obj.deleted_by = user_id
        obj.deleted_reason = reason
        obj.row_version += 1
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def restore(self, lot_id: UUID, user_id: UUID) -> Optional[FoncierLot]:
        obj = self.db.query(FoncierLot).filter(FoncierLot.id == lot_id).first()
        if not obj or not obj.deleted_at:
            return None
        obj.deleted_at = None
        obj.deleted_by = None
        obj.deleted_reason = None
        obj.row_version += 1
        self.db.commit()
        self.db.refresh(obj)
        return obj


# ============================================
# ATTESTATION REPOSITORY
# ============================================

class AttestationRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, FoncierAttestation)
    
    def get_by_reference(self, reference: str) -> Optional[FoncierAttestation]:
        return self.db.query(FoncierAttestation).filter(
            FoncierAttestation.reference == reference,
            FoncierAttestation.deleted_at.is_(None)
        ).first()
    
    def get_with_relations(self, attestation_id: UUID) -> Optional[Dict]:
        result = self.db.execute(text("""
            SELECT 
                a.*,
                l.reference as lot_reference,
                l.numero_lot,
                l.superficie,
                i.numero as ilot_numero,
                ls.nom as lotissement_nom,
                v.nom as village_nom,
                v.code as village_code,
                p.nom as proprietaire_nom,
                p.prenom as proprietaire_prenom,
                p.telephone as proprietaire_telephone,
                p.email as proprietaire_email
            FROM foncier_attestations a
            JOIN foncier_lots l ON l.id = a.lot_id
            JOIN foncier_ilots i ON i.id = l.ilot_id
            JOIN foncier_lotissements ls ON ls.id = i.lotissement_id
            JOIN foncier_villages v ON v.id = ls.village_id
            LEFT JOIN parties p ON p.id = a.proprietaire_client_id
            WHERE a.id = :attestation_id AND a.deleted_at IS NULL
        """), {"attestation_id": str(attestation_id)}).fetchone()
        
        if result:
            return dict(result._mapping)
        return None
    
    def get_by_lot(self, lot_id: UUID, include_deleted: bool = False) -> List[FoncierAttestation]:
        query = self.db.query(FoncierAttestation).filter(FoncierAttestation.lot_id == lot_id)
        if not include_deleted:
            query = query.filter(FoncierAttestation.deleted_at.is_(None))
        return query.order_by(desc(FoncierAttestation.version)).all()
    
    def get_latest_by_lot(self, lot_id: UUID) -> Optional[FoncierAttestation]:
        return self.db.query(FoncierAttestation).filter(
            FoncierAttestation.lot_id == lot_id,
            FoncierAttestation.deleted_at.is_(None)
        ).order_by(desc(FoncierAttestation.version)).first()
    
    def get_next_version(self, lot_id: UUID) -> int:
        latest = self.get_latest_by_lot(lot_id)
        return (latest.version + 1) if latest else 1
    
    def create_with_temoins(self, attestation_data: dict, temoins: List[dict], 
                            user_id: UUID, device_id: str) -> FoncierAttestation:
        attestation = FoncierAttestation(**attestation_data)
        attestation.created_by = user_id
        attestation.last_modified_device_id = device_id
        self.db.add(attestation)
        self.db.flush()
        
        for temoin_data in temoins:
            temoin = FoncierAttestationTemoin(**temoin_data, attestation_id=attestation.id)
            self.db.add(temoin)
        
        self.db.commit()
        self.db.refresh(attestation)
        return attestation
    
    def submit(self, attestation_id: UUID, agent_nom: str, user_id: UUID) -> Optional[FoncierAttestation]:
        attestation = self.get(attestation_id)
        if not attestation or attestation.statut != "brouillon":
            return None
        attestation.statut = "soumis"
        attestation.validation_agent_nom = agent_nom
        attestation.validation_agent_id = user_id
        attestation.validation_agent_date = datetime.utcnow()
        attestation.row_version += 1
        self.db.commit()
        self.db.refresh(attestation)
        return attestation
    
    def validate(self, attestation_id: UUID, chef_nom: str, signature_media_id: Optional[UUID],
                 empreinte_media_id: Optional[UUID], user_id: UUID) -> Optional[FoncierAttestation]:
        attestation = self.get(attestation_id)
        if not attestation or attestation.statut != "soumis":
            return None
        attestation.statut = "valide"
        attestation.validation_chef_nom = chef_nom
        attestation.validation_chef_id = user_id
        attestation.validation_chef_date = datetime.utcnow()
        attestation.chef_signature_media_id = signature_media_id
        attestation.chef_empreinte_media_id = empreinte_media_id
        attestation.row_version += 1
        self.db.commit()
        self.db.refresh(attestation)
        return attestation
    
    def scan_archive(self, attestation_id: UUID, media_id: UUID, user_id: UUID) -> Optional[FoncierAttestation]:
        attestation = self.get(attestation_id)
        if not attestation:
            return None
        # L'attestation doit être validée avant archivage
        if attestation.statut != "valide":
            return None
        attestation.statut = "archive"
        attestation.pdf_media_id = media_id
        attestation.pdf_generated_at = datetime.utcnow()
        attestation.printed_by = user_id
        attestation.row_version += 1
        self.db.commit()
        self.db.refresh(attestation)
        return attestation
    
    def revoke(self, attestation_id: UUID, reason: str, user_id: UUID) -> Optional[FoncierAttestation]:
        attestation = self.get(attestation_id)
        if not attestation or attestation.statut in ["archive", "revoque", "expire"]:
            return None
        attestation.statut = "revoque"
        attestation.revoke_reason = reason
        attestation.revoked_at = datetime.utcnow()
        attestation.revoked_by = user_id
        attestation.row_version += 1
        self.db.commit()
        self.db.refresh(attestation)
        return attestation
    
    def verify(self, reference: str) -> Optional[Dict]:
        result = self.db.execute(text("""
            SELECT 
                a.reference,
                a.statut,
                a.date_etablissement,
                a.date_expiration,
                l.reference as lot_reference,
                l.numero_lot,
                l.superficie,
                i.numero as ilot_numero,
                ls.nom as lotissement_nom,
                v.nom as village_nom,
                v.code as village_code,
                p.nom as proprietaire_nom,
                p.prenom as proprietaire_prenom,
                p.telephone as proprietaire_telephone,
                p.email as proprietaire_email
            FROM foncier_attestations a
            JOIN foncier_lots l ON l.id = a.lot_id
            JOIN foncier_ilots i ON i.id = l.ilot_id
            JOIN foncier_lotissements ls ON ls.id = i.lotissement_id
            JOIN foncier_villages v ON v.id = ls.village_id
            LEFT JOIN parties p ON p.id = a.proprietaire_client_id
            WHERE a.reference = :reference AND a.deleted_at IS NULL
        """), {"reference": reference}).fetchone()
        
        if result:
            return dict(result._mapping)
        return None
    
    def search(self, lot_id: Optional[UUID] = None, statut: Optional[str] = None,
               limit: int = 50, offset: int = 0) -> Tuple[List[FoncierAttestation], int]:
        query = self.db.query(FoncierAttestation).filter(FoncierAttestation.deleted_at.is_(None))
        
        if lot_id:
            query = query.filter(FoncierAttestation.lot_id == lot_id)
        if statut:
            query = query.filter(FoncierAttestation.statut == statut)
        
        total = query.count()
        items = query.order_by(desc(FoncierAttestation.created_at)).offset(offset).limit(limit).all()
        return items, total


# ============================================
# AUDIT REPOSITORY
# ============================================

class AuditRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, ActivityLog)
    
    def log(self, log_data: ActivityLogCreate) -> ActivityLog:
        log = ActivityLog(**log_data.model_dump())
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def get_timeline(self, entity_type: str, entity_id: UUID, 
                     limit: int = 100) -> List[ActivityLog]:
        return self.db.query(ActivityLog).filter(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id
        ).order_by(desc(ActivityLog.created_at)).limit(limit).all()
    
    def search(self, params: AuditSearchParams) -> Tuple[List[ActivityLog], int]:
        query = self.db.query(ActivityLog)
        
        if params.entity_type:
            query = query.filter(ActivityLog.entity_type == params.entity_type)
        if params.entity_id:
            query = query.filter(ActivityLog.entity_id == params.entity_id)
        if params.action:
            query = query.filter(ActivityLog.action == params.action)
        if params.user_id:
            query = query.filter(ActivityLog.user_id == params.user_id)
        if params.date_from:
            query = query.filter(ActivityLog.created_at >= params.date_from)
        if params.date_to:
            query = query.filter(ActivityLog.created_at <= params.date_to)
        
        total = query.count()
        items = query.order_by(desc(ActivityLog.created_at)).offset(params.offset).limit(params.limit).all()
        return items, total
    
    def get_entity_actions(self, entity_type: str, entity_id: UUID) -> List[str]:
        result = self.db.query(ActivityLog.action).filter(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id
        ).distinct().all()
        return [row[0] for row in result]


# ============================================
# USER VILLAGE ACCESS REPOSITORY
# ============================================

class UserVillageAccessRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, UserVillageAccess)
    
    def get_user_villages(self, user_id: UUID) -> List[UserVillageAccess]:
        return self.db.query(UserVillageAccess).filter(
            UserVillageAccess.user_id == user_id
        ).all()
    
    def get_village_users(self, village_id: UUID) -> List[UserVillageAccess]:
        return self.db.query(UserVillageAccess).filter(
            UserVillageAccess.village_id == village_id
        ).all()
    
    def has_access(self, user_id: UUID, village_id: UUID, required_level: str = None) -> bool:
        access = self.db.query(UserVillageAccess).filter(
            UserVillageAccess.user_id == user_id,
            UserVillageAccess.village_id == village_id
        ).first()
        
        if not access:
            return False
        
        if required_level:
            levels = ["lecteur", "agent", "validateur", "gestionnaire"]
            user_level_idx = levels.index(access.access_level) if access.access_level in levels else -1
            required_idx = levels.index(required_level) if required_level in levels else 999
            return user_level_idx >= required_idx
        
        return True
    
    def get_access_level(self, user_id: UUID, village_id: UUID) -> Optional[str]:
        access = self.db.query(UserVillageAccess).filter(
            UserVillageAccess.user_id == user_id,
            UserVillageAccess.village_id == village_id
        ).first()
        return access.access_level if access else None


# ============================================
# FACTORY
# ============================================

def get_village_repo(db: Session) -> VillageRepository:
    return VillageRepository(db)

def get_lotissement_repo(db: Session) -> LotissementRepository:
    return LotissementRepository(db)

def get_ilot_repo(db: Session) -> IlotRepository:
    return IlotRepository(db)

def get_lot_repo(db: Session) -> LotRepository:
    return LotRepository(db)

def get_attestation_repo(db: Session) -> AttestationRepository:
    return AttestationRepository(db)

def get_audit_repo(db: Session) -> AuditRepository:
    return AuditRepository(db)

def get_user_village_access_repo(db: Session) -> UserVillageAccessRepository:
    return UserVillageAccessRepository(db)