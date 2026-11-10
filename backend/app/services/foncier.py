# Foncier Service - Couche métier
# Logique métier pour le module Foncier

from fastapi.encoders import jsonable_encoder
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
import hashlib
import json

from sqlalchemy.orm import Session

from app.repositories.foncier import (
    get_village_repo, get_lotissement_repo, get_ilot_repo,
    get_lot_repo, get_attestation_repo, get_audit_repo,
    get_user_village_access_repo
)
from app.schemas.foncier import (
    VillageCreate, VillageUpdate, LotissementCreate, LotissementUpdate,
    IlotCreate, IlotUpdate, LotCreate, LotUpdate, LotSearchParams,
    AttestationCreate, AttestationUpdate, AttestationSubmitRequest,
    AttestationValidateRequest, AttestationScanRequest,
    TemoinCreate, DuplicateCheckParams, AuditSearchParams,
    VillageStats, TimelineResponse, ActivityLogCreate
)
from app.models.foncier import FoncierVillage, FoncierLotissement, FoncierIlot, FoncierLot, FoncierAttestation, ActivityLog, UserVillageAccess

# ============================================
# UTILITAIRES
# ============================================

def generate_reference(prefix: str, village_code: str, lotissement_code: str = None,
                      ilot_numero: str = None, lot_numero: str = None) -> str:
    """Génère une référence hiérarchique"""
    today = datetime.now().strftime("%Y%m%d")
    parts = [prefix, village_code]
    if lotissement_code:
        parts.append(lotissement_code)
    if ilot_numero:
        parts.append(ilot_numero)
    if lot_numero:
        parts.append(lot_numero)
    parts.append(today)
    return "-".join(parts).upper()

def generate_attestation_reference(village_code: str, lotissement_code: str,
                                   ilot_numero: str, lot_numero: str, version: int) -> str:
    """Génère une référence d'attestation"""
    today = datetime.now().strftime("%Y%m%d")
    base = f"{village_code}-{lotissement_code}-{ilot_numero}-{lot_numero}-{version:03d}"
    return f"ATT-{today}-{base}".upper()

def calculate_hash(data: dict) -> str:
    """Calcule le hash SHA256 d'un objet"""
    # Normaliser les données
    clean_data = {k: v for k, v in data.items() if k not in ['deleted_at', 'id', 'created_at', 'updated_at']}
    json_str = json.dumps(clean_data, sort_keys=True, default=str, ensure_ascii=False)
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()

def get_qr_payload(attestation: FoncierAttestation, lot, village, proprietor) -> str:
    """Génère le payload QR pour une attestation.

    Aucune donnée personnelle (nom, prénom, CNI, téléphone) — le QR
    encode uniquement des identifiants pour la vérification publique.
    """
    data = {
        "attestation": {
            "reference": attestation.reference,
            "type": attestation.type,
            "statut": attestation.statut,
            "date_etablissement": str(attestation.date_etablissement) if attestation.date_etablissement else None,
        },
        "lot": {
            "reference": lot.reference,
            "numero": lot.numero_lot,
        },
        "village": {
            "code": village.code,
        },
        "verifie_le": datetime.utcnow().isoformat(),
    }
    return json.dumps(data, ensure_ascii=False, separators=(',', ':'))

def generate_control_number() -> str:
    """Génère un numéro de contrôle unique"""
    import secrets
    return secrets.token_hex(5).upper()

# ============================================
# VILLAGE SERVICE
# ============================================

class VillageService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_village_repo(db)
    
    def create(self, data: VillageCreate, user_id: UUID) -> FoncierVillage:
        # VérifierCode unique
        if self.repo.get_by_code(data.code):
            raise ValueError(f"Le code village '{data.code}' existe déjà")
        
        village_data = data.model_dump()
        village_data["created_by"] = user_id
        village_data["updated_by"] = user_id
        
        return self.repo.create(village_data)
    
    def update(self, village_id: UUID, data: VillageUpdate, user_id: UUID) -> Optional[FoncierVillage]:
        village = self.repo.get(village_id)
        if not village:
            return None
        
        # Vérifier code unique si modifié
        if data.code and data.code != village.code:
            if self.repo.get_by_code(data.code):
                raise ValueError(f"Le code village '{data.code}' existe déjà")
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = user_id
        
        return self.repo.update(village_id, update_data)
    
    def delete(self, village_id: UUID, user_id: UUID) -> bool:
        village = self.repo.get(village_id)
        if not village:
            return False
        # Le schéma Foncier utilise `actif` pour l'archivage des villages.
        # `deleted_at` n'existe pas sur ce modèle ni dans la table déployée.
        village.actif = False
        village.updated_by = user_id
        self.db.commit()
        return True
    
    def get_with_stats(self, village_id: UUID) -> Optional[Dict]:
        return self.repo.get_with_stats(village_id)
    
    def get_all_with_stats(self) -> List[Dict]:
        return self.repo.get_all_with_stats()
    
    def search(self, params: LotSearchParams) -> Tuple[List[FoncierVillage], int]:
        return self.repo.search(params)


# ============================================
# LOTISSEMENT SERVICE
# ============================================

class LotissementService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_lotissement_repo(db)
        self.village_repo = get_village_repo(db)
    
    def create(self, village_id: UUID, data: LotissementCreate, user_id: UUID) -> FoncierLotissement:
        # Vérifier village existe
        village = self.village_repo.get(village_id)
        if not village:
            raise ValueError("Village introuvable")
        
        lotissement_data = data.model_dump()
        lotissement_data["village_id"] = village_id
        lotissement_data["created_by"] = user_id
        lotissement_data["updated_by"] = user_id
        
        return self.repo.create(lotissement_data)
    
    def update(self, lotissement_id: UUID, data: LotissementUpdate, user_id: UUID) -> Optional[FoncierLotissement]:
        lotissement = self.repo.get(lotissement_id)
        if not lotissement:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = user_id
        
        return self.repo.update(lotissement_id, update_data)
    
    def delete(self, lotissement_id: UUID) -> bool:
        return self.repo.delete(lotissement_id)
    
    def get_by_village(self, village_id: UUID) -> List[FoncierLotissement]:
        return self.repo.get_by_village(village_id)
    
    def search(self, village_id: UUID, params: LotSearchParams) -> Tuple[List[FoncierLotissement], int]:
        return self.repo.search(village_id, params)


# ============================================
# ÎLOT SERVICE
# ============================================

class IlotService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_ilot_repo(db)
        self.lotissement_repo = get_lotissement_repo(db)
    
    def create(self, lotissement_id: UUID, data: IlotCreate, user_id: UUID) -> FoncierIlot:
        lotissement = self.lotissement_repo.get(lotissement_id)
        if not lotissement:
            raise ValueError("Lotissement introuvable")
        
        ilot_data = data.model_dump()
        ilot_data["lotissement_id"] = lotissement_id
        ilot_data["created_by"] = user_id
        ilot_data["updated_by"] = user_id
        
        return self.repo.create(ilot_data)
    
    def update(self, ilot_id: UUID, data: IlotUpdate, user_id: UUID) -> Optional[FoncierIlot]:
        ilot = self.repo.get(ilot_id)
        if not ilot:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = user_id
        
        return self.repo.update(ilot_id, update_data)
    
    def delete(self, ilot_id: UUID) -> bool:
        return self.repo.delete(ilot_id)
    
    def get_by_lotissement(self, lotissement_id: UUID) -> List[FoncierIlot]:
        return self.repo.get_by_lotissement(lotissement_id)
    
    def search(self, lotissement_id: UUID, params: LotSearchParams) -> Tuple[List[FoncierIlot], int]:
        return self.repo.search(lotissement_id, params)


# ============================================
# LOT SERVICE
# ============================================

class LotService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_lot_repo(db)
        self.village_repo = get_village_repo(db)
        self.lotissement_repo = get_lotissement_repo(db)
        self.ilot_repo = get_ilot_repo(db)
        self.audit_repo = get_audit_repo(db)
    
    def create(self, ilot_id: UUID, data: LotCreate, user_id: UUID, device_id: str = None) -> FoncierLot:
        try:
            ilot = self.ilot_repo.get(ilot_id)
            if not ilot:
                raise ValueError("Îlot introuvable")

            duplicates = self.repo.check_duplicate(
                ilot.lotissement.village_id,
                ilot.lotissement_id,
                ilot_id,
                data.numero_lot
            )
            if duplicates:
                raise ValueError(f"Un lot numéro '{data.numero_lot}' existe déjà dans cet îlot")

            village = self.village_repo.get(ilot.lotissement.village_id)
            lotissement = self.lotissement_repo.get(ilot.lotissement_id)
            reference = generate_reference(
                "LOT", village.code,
                lotissement.code, ilot.numero, data.numero_lot
            )

            lot_data = data.model_dump()
            lot_data["ilot_id"] = ilot_id
            lot_data["reference"] = reference
            # Conserver le code_barre fourni s'il est présent, sinon utiliser la reference (unique NOT NULL)
            provided_code = (lot_data.get("code_barre") or "").strip()
            if provided_code:
                lot_data["code_barre"] = provided_code[:64]
            else:
                lot_data["code_barre"] = reference[:64]
            lot_data["created_by"] = user_id
            lot_data["updated_by"] = user_id
            lot_data["client_updated_at"] = datetime.utcnow()
            lot_data["last_modified_device_id"] = device_id

            lot = self.repo.create(lot_data, commit=False)
            self._log_audit("foncier_lot", lot.id, lot.reference, "create", None, lot_data,
                            list(lot_data.keys()), user_id, commit=False)
            self.db.commit()
            self.db.refresh(lot)
            return lot
        except Exception:
            self.db.rollback()
            raise
    
    def update(self, lot_id: UUID, data: LotUpdate, user_id: UUID, device_id: str = None) -> Optional[FoncierLot]:
        lot = self.repo.get_by_id(lot_id)
        if not lot:
            return None
        
        # Vérifier doublon si numero_lot modifié
        if data.numero_lot and data.numero_lot != lot.numero_lot:
            ilot = self.ilot_repo.get(lot.ilot_id)
            duplicates = self.repo.check_duplicate(
                numero_lot=data.numero_lot,
                village_id=ilot.lotissement.village_id,
                lotissement_id=ilot.lotissement_id,
                ilot_id=lot.ilot_id,
                exclude_id=lot_id
            )
            if duplicates:
                raise ValueError(f"Un lot numéro '{data.numero_lot}' existe déjà dans cet îlot")
        
        old_values = {k: getattr(lot, k) for k in data.model_dump(exclude_unset=True).keys()}
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = user_id
        update_data["client_updated_at"] = datetime.utcnow()
        update_data["last_modified_device_id"] = device_id
        update_data["row_version"] = lot.row_version + 1
        
        try:
            updated_lot = self.repo.update(lot_id, update_data, commit=False)
            self._log_audit("foncier_lot", lot.id, lot.reference, "update", old_values, update_data,
                            list(update_data.keys()), user_id, commit=False)
            self.db.commit()
            self.db.refresh(updated_lot)
            return updated_lot
        except Exception:
            self.db.rollback()
            raise
    
    def archive(self, lot_id: UUID, reason: str, user_id: UUID) -> Optional[FoncierLot]:
        try:
            lot = self.repo.archive(lot_id, reason, user_id, commit=False)
            if lot:
                self._log_audit("foncier_lot", lot.id, lot.reference, "archive",
                                {"deleted_at": None}, {"deleted_at": lot.deleted_at, "deleted_reason": reason},
                                ["deleted_at", "deleted_reason"], user_id, commit=False)
                self.db.commit()
                self.db.refresh(lot)
            return lot
        except Exception:
            self.db.rollback()
            raise
    
    def restore(self, lot_id: UUID, user_id: UUID) -> Optional[FoncierLot]:
        try:
            lot = self.repo.restore(lot_id, user_id, commit=False)
            if lot:
                self._log_audit("foncier_lot", lot.id, lot.reference, "restore",
                                {"deleted_at": lot.deleted_at}, {"deleted_at": None},
                                ["deleted_at"], user_id, commit=False)
                self.db.commit()
                self.db.refresh(lot)
            return lot
        except Exception:
            self.db.rollback()
            raise
    
    def get_with_hierarchy(self, lot_id: UUID) -> Optional[Dict]:
        return self.repo.get_with_hierarchy(lot_id)
    
    def search(self, params: LotSearchParams) -> Tuple[List[FoncierLot], int]:
        return self.repo.search(params)
    
    def check_duplicate(self, params: DuplicateCheckParams) -> List[FoncierLot]:
        return self.repo.check_duplicate(
            params.village_id, params.lotissement_id, params.ilot_id,
            params.numero_lot, params.exclude_lot_id
        )
    
    def _log_audit(self, entity_type: str, entity_id: UUID, entity_ref: str,
                   action: str, old_values: dict, new_values: dict,
                   changed_fields: List[str], user_id: UUID,
                   user_role: Optional[str] = None, user_name: Optional[str] = None,
                   commit: bool = True):
        log = ActivityLogCreate(
            entity_type=entity_type,
            entity_id=str(entity_id),
            entity_reference=entity_ref,
            action=action,
            action_category="data",
            old_values=jsonable_encoder(old_values),
            new_values=jsonable_encoder(new_values),
            changed_fields=changed_fields,
            user_id=str(user_id),
            user_role=user_role,
            user_name=user_name,
        )
        self.audit_repo.log(log, commit=commit)


# ============================================
# ATTESTATION SERVICE
# ============================================

class AttestationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_attestation_repo(db)
        self.lot_repo = get_lot_repo(db)
        self.village_repo = get_village_repo(db)
        self.lotissement_repo = get_lotissement_repo(db)
        self.ilot_repo = get_ilot_repo(db)
        self.audit_repo = get_audit_repo(db)
        self.access_service = get_user_access_service(db)
    
    def create(self, lot_id: UUID, data: AttestationCreate, user_id: UUID, 
               device_id: str = None) -> FoncierAttestation:
        try:
            lot = self.lot_repo.get_by_id(lot_id)
            if not lot:
                raise ValueError("Lot introuvable")

            lot_hierarchy = self.lot_repo.get_with_hierarchy(lot_id)
            if not lot_hierarchy:
                raise ValueError("Hiérarchie du lot introuvable")
            village = self.village_repo.get(lot_hierarchy["village_id"])
            lotissement = self.lotissement_repo.get(lot_hierarchy["lotissement_id"])
            ilot = self.ilot_repo.get(lot_hierarchy["ilot_id"])

            # Version
            version = self.repo.get_next_version(lot_id)

            # Référence
            reference = generate_attestation_reference(
                village.code, lotissement.code, ilot.numero, lot.numero_lot, version
            )

            # Numéro d'enregistrement
            numero_enregistrement = data.numero_enregistrement or reference

            # Contrôle
            control_number = generate_control_number()
            signature_nonce = hashlib.sha256(f"{reference}{datetime.utcnow().isoformat()}".encode()).hexdigest()

            # Dates
            date_etablissement = data.date_etablissement or date.today()
            date_expiration = data.date_expiration or (datetime.now(timezone.utc) + timedelta(days=365))

            attestation_data = data.model_dump(exclude={"temoins"})
            attestation_data.update({
                "lot_id": lot_id,
                "reference": reference,
                "version": version,
                "date_etablissement": date_etablissement,
                "date_expiration": date_expiration,
                "numero_enregistrement": numero_enregistrement,
                "control_number": control_number,
                "signature_nonce": signature_nonce,
                "signature_issued_at": datetime.utcnow(),
                "created_by": user_id,
                "last_modified_device_id": device_id,
                "client_updated_at": datetime.utcnow(),
            })

            # Témoins
            temoins = [t.model_dump() for t in data.temoins]

            attestation = self.repo.create_with_temoins(attestation_data, temoins, user_id, device_id, commit=False)

            # Hash et QR
            proprietor = None
            if lot_hierarchy.get("proprietaire_nom"):
                proprietor = {
                    "nom": lot_hierarchy["proprietaire_nom"],
                    "prenom": lot_hierarchy["proprietaire_prenom"],
                }

            hash_data = {
                **attestation_data,
                "temoins": temoins,
                "lot_reference": lot.reference,
                "lot_village": village.nom,
            }
            attestation.hash_sha256 = calculate_hash(hash_data)
            attestation.qr_payload = get_qr_payload(attestation, lot, village, proprietor)

            self.db.flush()

            self._log_audit("foncier_attestation", attestation.id, attestation.reference,
                            "create", None, attestation_data, list(attestation_data.keys()), user_id,
                            commit=False)
            self.db.commit()
            return attestation
        except Exception:
            self.db.rollback()
            raise

    def update_draft(self, attestation_id: UUID, data: AttestationUpdate, user_id: UUID) -> Optional[FoncierAttestation]:
        try:
            attestation = self.repo.get_by_id(attestation_id)
            if not attestation or attestation.statut != "brouillon":
                return None
            update_data = data.model_dump(exclude_unset=True, exclude={"temoins"})
            if data.date_etablissement and data.date_expiration and data.date_expiration.date() <= data.date_etablissement:
                raise ValueError("La date d’expiration doit être postérieure à la date d’établissement")
            old_values = {key: getattr(attestation, key) for key in update_data}
            temoins = None if data.temoins is None else [item.model_dump() for item in data.temoins]
            updated = self.repo.update_draft(attestation_id, update_data, temoins, user_id, commit=False)
            if not updated:
                return None
            self._log_audit("foncier_attestation", updated.id, updated.reference, "update", old_values, update_data, list(update_data), user_id, commit=False)
            self.db.commit()
            self.db.refresh(updated)
            return updated
        except Exception:
            self.db.rollback()
            raise

    def sign(self, attestation_id: UUID, signature: str, user_id: UUID) -> Optional[FoncierAttestation]:
        try:
            attestation = self.repo.sign(attestation_id, signature, user_id, commit=False)
            if not attestation:
                return None
            self._log_audit("foncier_attestation", attestation.id, attestation.reference, "sign", {"signature_numerique": None}, {"signature_numerique": "[présente]"}, ["signature_numerique"], user_id, commit=False)
            self.db.commit()
            return attestation
        except Exception:
            self.db.rollback()
            raise

    def submit(self, attestation_id: UUID, data: AttestationSubmitRequest, 
               user_id: UUID) -> Optional[FoncierAttestation]:
        try:
            attestation = self.repo.submit(attestation_id, data.agent_nom, user_id, commit=False)
            if attestation:
                self._log_audit("foncier_attestation", attestation.id, attestation.reference,
                                "submit", {"statut": "brouillon"}, {"statut": "soumis"},
                                ["statut", "validation_agent_nom", "validation_agent_id", "validation_agent_date"],
                                user_id, commit=False)
                self.db.commit()
                self.db.refresh(attestation)
            return attestation
        except Exception:
            self.db.rollback()
            raise
    
    def validate(self, attestation_id: UUID, data: AttestationValidateRequest,
                 user_id: UUID, user_role: str | None = None) -> Optional[FoncierAttestation]:
        try:
            # Verrouillage transactionnel de l'attestation pour écriture.
            attestation = self.repo.get_for_update(attestation_id)
            if not attestation or attestation.statut != "soumis":
                return None
            # Seul le chef du village (niveau validateur sur le village de l'attestation)
            # peut valider une attestation de son village.
            lot_hierarchy = self.lot_repo.get_with_hierarchy(attestation.lot_id)
            village_id = lot_hierarchy.get("village_id") if lot_hierarchy else None
            if not village_id or not self.access_service.check_access(user_id, village_id, "validateur", user_role=user_role, exact=True):
                return None
            attestation = self.repo.validate(attestation_id, data.chef_nom,
                                             data.signature_media_id, data.empreinte_media_id,
                                             user_id, commit=False)
            if attestation:
                # Re-vérifier l'accès territorial juste avant le commit pour éviter
                # qu'une révocation d'accès entre-temps ne soit contournée.
                if not village_id or not self.access_service.check_access(user_id, village_id, "validateur", user_role=user_role, exact=True):
                    self.db.rollback()
                    return None
                self._log_audit("foncier_attestation", attestation.id, attestation.reference,
                                "validate", {"statut": "soumis"}, {"statut": "valide"},
                                ["statut", "validation_chef_nom", "validation_chef_id", "validation_chef_date"],
                                user_id, commit=False)
                self.db.commit()
                self.db.refresh(attestation)
            return attestation
        except Exception:
            self.db.rollback()
            raise
    
    def scan(self, attestation_id: UUID, data: AttestationScanRequest,
             user_id: UUID, user_role: str | None = None) -> Optional[FoncierAttestation]:
        try:
            # Verrouillage transactionnel de l'attestation pour écriture.
            attestation = self.repo.get_for_update(attestation_id)
            if not attestation or attestation.statut != "valide":
                return None
            # Seul l'agent foncier (niveau agent sur le village de l'attestation)
            # peut archiver une attestation de son village.
            lot_hierarchy = self.lot_repo.get_with_hierarchy(attestation.lot_id)
            village_id = lot_hierarchy.get("village_id") if lot_hierarchy else None
            if not village_id or not self.access_service.check_access(user_id, village_id, "agent", user_role=user_role):
                return None
            attestation = self.repo.scan_archive(attestation_id, data.media_id, user_id, commit=False)
            if attestation:
                # Re-vérifier l'accès territorial juste avant le commit.
                if not village_id or not self.access_service.check_access(user_id, village_id, "agent", user_role=user_role):
                    self.db.rollback()
                    return None
                self._log_audit("foncier_attestation", attestation.id, attestation.reference,
                                "archive", {"statut": "valide"}, {"statut": "archive"},
                                ["statut", "pdf_media_id", "pdf_generated_at", "printed_by"],
                                user_id, commit=False)
                self.db.commit()
                self.db.refresh(attestation)
            return attestation
        except Exception:
            self.db.rollback()
            raise

    def print(self, attestation_id: UUID, reason: Optional[str], user_id: UUID) -> Optional[FoncierAttestation]:
        """Imprime physiquement l'attestation (préparation avant signature du chef).

        Exige un statut "valide". Incrémente le compteur d'impression et
        enregistre qui a imprimé. Ne délivre pas l'attestation.
        """
        try:
            attestation = self.repo.get_by_id(attestation_id)
            if not attestation or attestation.statut != "valide":
                return None
            attestation.print_count = (attestation.print_count or 0) + 1
            attestation.printed_by = user_id
            attestation.printed_at = datetime.utcnow()
            attestation.row_version += 1
            self._log_audit("foncier_attestation", attestation_id, attestation.reference,
                            "print", {"print_count": attestation.print_count - 1},
                            {"print_count": attestation.print_count},
                            ["print_count", "printed_by", "printed_at"], user_id, commit=False)
            self.db.commit()
            return attestation
        except Exception:
            self.db.rollback()
            raise

    def deliver(self, attestation_id: UUID, reason: Optional[str], user_id: UUID,
                user_role: str | None = None) -> Optional[FoncierAttestation]:
        """Confirme la délivrance finale après contrôle de concordance du scan signé.

        Refuse si aucun scan signé n'a été déposé (pdf_media_id absent).
        L'attestation doit être archivée (scan signé déjà déposé via scan()).
        L'état de délivrance est écrit de manière transactionnelle avec l'audit.
        Une attestation déjà délivrée est rejetée (idempotence négative).
        Le contrôle de périmètre village est obligatoire : l'utilisateur doit
        posséder un accès au village auquel appartient le lot de l'attestation.
        """
        try:
            # Verrouillage transactionnel de l'attestation pour écriture.
            attestation = self.repo.get_for_update(attestation_id)
            if not attestation:
                return None
            # Contrôle de concordance : pas de scan signé = pas de délivrance.
            if attestation.statut != "archive" or not attestation.pdf_media_id:
                return None
            # Idempotence : une attestation déjà délivrée ne peut pas être re-délivrée.
            if attestation.delivre:
                return None
            # Contrôle de périmètre : l'utilisateur doit avoir un accès gestionnaire
            # sur le village du lot concerné. Un rattachement manquant ou incohérent
            # entraîne un refus. Le rôle général ne remplace jamais l'autorisation
            # territoriale, sauf pour l'administrateur global (dérogation server-side).
            lot_hierarchy = self.lot_repo.get_with_hierarchy(attestation.lot_id)
            village_id = lot_hierarchy.get("village_id") if lot_hierarchy else None
            if not village_id or not self.access_service.check_access(user_id, village_id, "gestionnaire", user_role=user_role):
                return None
            # Écriture transactionnelle : état métier + audit dans la même transaction.
            attestation.delivre = True
            attestation.delivre_par = user_id
            attestation.delivre_le = datetime.utcnow()
            self._log_audit("foncier_attestation", attestation_id, attestation.reference,
                            "deliver", {"statut": "archive", "delivre": False},
                            {"statut": "archive", "delivre": True},
                            ["delivre", "delivre_par", "delivre_le"], user_id, commit=False)
            # Re-vérifier l'accès territorial juste avant le commit.
            if not village_id or not self.access_service.check_access(user_id, village_id, "gestionnaire", user_role=user_role):
                self.db.rollback()
                return None
            self.db.commit()
            return attestation
        except Exception:
            self.db.rollback()
            raise

    def revoke(self, attestation_id: UUID, reason: str, user_id: UUID,
               user_role: str | None = None) -> Optional[FoncierAttestation]:
        try:
            # Verrouillage transactionnel de l'attestation pour écriture.
            attestation = self.repo.get_for_update(attestation_id)
            if not attestation:
                return None
            old_status = attestation.statut
            was_delivre = attestation.delivre
            # Seul le chef du village (niveau validateur sur le village de l'attestation)
            # peut révoquer une attestation de son village.
            lot_hierarchy = self.lot_repo.get_with_hierarchy(attestation.lot_id)
            village_id = lot_hierarchy.get("village_id") if lot_hierarchy else None
            if not village_id or not self.access_service.check_access(user_id, village_id, "validateur", user_role=user_role, exact=True):
                return None
            attestation = self.repo.revoke(attestation_id, reason, user_id, commit=False)
            if attestation:
                # Re-vérifier l'accès territorial juste avant le commit.
                if not village_id or not self.access_service.check_access(user_id, village_id, "validateur", user_role=user_role, exact=True):
                    self.db.rollback()
                    return None
                # Une attestation révoquée n'est plus délivrée, même si elle l'était.
                if was_delivre:
                    attestation.delivre = False
                self._log_audit("foncier_attestation", attestation_id, attestation.reference,
                                "revoke", {"statut": old_status, "delivre": was_delivre},
                                {"statut": "revoque", "delivre": False},
                                ["statut", "delivre", "revoke_reason", "revoked_at", "revoked_by"],
                                user_id, commit=False)
                self.db.commit()
                self.db.refresh(attestation)
            return attestation
        except Exception:
            self.db.rollback()
            raise
    
    def verify(self, reference: str) -> Optional[Dict]:
        return self.repo.verify(reference)
    
    def get_with_relations(self, attestation_id: UUID) -> Optional[Dict]:
        return self.repo.get_with_relations(attestation_id)
    
    def get_by_lot(self, lot_id: UUID) -> List[FoncierAttestation]:
        return self.repo.get_by_lot(lot_id)
    
    def search(self, lot_id: Optional[UUID] = None, statut: Optional[str] = None,
               limit: int = 50, offset: int = 0, exclude_revoked: bool = True) -> Tuple[List[FoncierAttestation], int]:
        return self.repo.search(lot_id, statut, limit, offset, exclude_revoked=exclude_revoked)
    
    def _log_audit(self, entity_type: str, entity_id: UUID, entity_ref: str,
                   action: str, old_values: dict, new_values: dict,
                   changed_fields: List[str], user_id: UUID,
                   user_role: Optional[str] = None, user_name: Optional[str] = None,
                   commit: bool = True):
        log = ActivityLogCreate(
            entity_type=entity_type,
            entity_id=str(entity_id),
            entity_reference=entity_ref,
            action=action,
            action_category="workflow",
            old_values=jsonable_encoder(old_values),
            new_values=jsonable_encoder(new_values),
            changed_fields=changed_fields,
            user_id=str(user_id),
            user_role=user_role,
            user_name=user_name,
        )
        self.audit_repo.log(log, commit=commit)


# ============================================
# AUDIT SERVICE
# ============================================

class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_audit_repo(db)
    
    def get_timeline(self, entity_type: str, entity_id: UUID) -> TimelineResponse:
        events = self.repo.get_timeline(entity_type, entity_id)
        # Récupérer la référence de l'entité
        entity_ref = ""
        if entity_type == "foncier_lot":
            lot = self.db.query(FoncierLot).filter(FoncierLot.id == entity_id).first()
            entity_ref = lot.reference if lot else str(entity_id)
        elif entity_type == "foncier_attestation":
            att = self.db.query(FoncierAttestation).filter(FoncierAttestation.id == entity_id).first()
            entity_ref = att.reference if att else str(entity_id)
        elif entity_type == "foncier_village":
            v = self.db.query(FoncierVillage).filter(FoncierVillage.id == entity_id).first()
            entity_ref = v.nom if v else str(entity_id)
        
        return TimelineResponse(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_reference=entity_ref,
            events=events
        )
    
    def search(self, params: AuditSearchParams) -> Tuple[List[ActivityLog], int]:
        return self.repo.search(params)


# ============================================
# USER ACCESS SERVICE
# ============================================

class UserAccessService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = get_user_village_access_repo(db)
    
    def grant_access(self, user_id: UUID, village_id: UUID, access_level: str,
                     granted_by: UUID) -> UserVillageAccess:
        # Vérifier si existe déjà
        existing = self.repo.db.query(UserVillageAccess).filter(
            UserVillageAccess.user_id == user_id,
            UserVillageAccess.village_id == village_id
        ).first()
        
        if existing:
            existing.access_level = access_level
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        access = UserVillageAccess(
            user_id=user_id,
            village_id=village_id,
            access_level=access_level
        )
        self.db.add(access)
        self.db.commit()
        self.db.refresh(access)
        return access
    
    def revoke_access(self, user_id: UUID, village_id: UUID) -> bool:
        return self.repo.delete_by_user_village(user_id, village_id)
    
    def get_user_villages(self, user_id: UUID) -> List[UserVillageAccess]:
        return self.repo.get_user_villages(user_id)
    
    def get_village_users(self, village_id: UUID) -> List[UserVillageAccess]:
        return self.repo.get_village_users(village_id)
    
    def check_access(
        self,
        user_id: UUID,
        village_id: UUID,
        required_level: str = None,
        user_role: str | None = None,
        exact: bool = False,
    ) -> bool:
        # L'administrateur global dispose d'une dérogation territoriale sur tous les villages,
        # sans inscription individuelle dans UserVillageAccess. Le rôle est vérifié côté serveur
        # depuis le contexte authentifié, jamais accepté depuis le client.
        if user_role == "admin":
            return True
        if exact:
            # Correspondance exacte du niveau : seul le niveau requis est accepté,
            # pas les niveaux supérieurs (ex: un gestionnaire n'est pas un validateur).
            access = self.repo.get_access_level(user_id, village_id)
            return access == required_level
        return self.repo.has_access(user_id, village_id, required_level)


# ============================================
# FACTORY
# ============================================

def get_village_service(db: Session) -> VillageService:
    return VillageService(db)

def get_lotissement_service(db: Session) -> LotissementService:
    return LotissementService(db)

def get_ilot_service(db: Session) -> IlotService:
    return IlotService(db)

def get_lot_service(db: Session) -> LotService:
    return LotService(db)

def get_attestation_service(db: Session) -> AttestationService:
    return AttestationService(db)

def get_audit_service(db: Session) -> AuditService:
    return AuditService(db)

def get_user_access_service(db: Session) -> UserAccessService:
    return UserAccessService(db)
