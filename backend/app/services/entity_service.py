# Entity Service - Couche métier pour la gestion unifiée des entités
# Remplace l'accès direct à `parties` par une API unifiée

from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4

from sqlalchemy import select, func, and_, or_, desc, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.entity import Entity
from app.repositories.entity_repository import EntityRepository
from app.schemas.entity import EntityCreate, EntityUpdate, EntitySearchParams, EntityResponse, EntitySummary, PaginatedEntityResponse


class EntityService:
    """
    Service centralisé pour la gestion des entités.
    Remplace l'accès direct à la table `parties` et fournit une API unifiée
    pour tous les types d'entités (clients, employés, fournisseurs, etc.)
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = EntityRepository(db)

    # ============================================
    # CRUD BASIQUE
    # ============================================

    def create(self, data: EntityCreate, user_id: Optional[UUID] = None) -> Entity:
        """Crée une nouvelle entité"""
        entity_data = data.model_dump(exclude_unset=True)
        entity_data["created_by"] = user_id
        entity_data["updated_by"] = user_id

        # Calculer display_name si non fourni
        if not entity_data.get("display_name"):
            entity_data["display_name"] = self._compute_display_name(entity_data)

        entity = Entity(**entity_data)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def get(self, entity_id: UUID, include_deleted: bool = False) -> Optional[Entity]:
        """Récupère une entité par ID"""
        return self.repo.get_by_id(entity_id, include_deleted=include_deleted)

    def get_by_document(self, doc_type: str, doc_number: str) -> Optional[Entity]:
        """Récupère une entité par son document d'identité"""
        return self.repo.get_by_document(doc_type, doc_number)

    def get_by_email(self, email: str) -> Optional[Entity]:
        """Récupère une entité par email"""
        return self.repo.get_by_email(email)

    def get_by_phone(self, phone: str) -> Optional[Entity]:
        """Récupère une entité par téléphone"""
        return self.repo.get_by_phone(phone)

    def update(self, entity_id: UUID, data: EntityUpdate, user_id: Optional[UUID] = None) -> Optional[Entity]:
        """Met à jour une entité"""
        entity = self.get(entity_id)
        if not entity:
            return None

        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = user_id
        update_data["updated_at"] = datetime.utcnow()

        # Recalculer display_name si les champs d'identité changent
        identity_fields = {"first_name", "last_name", "company_name", "display_name"}
        if any(f in update_data for f in identity_fields):
            # Fusionner avec les données existantes pour calcul
            current = {
                "first_name": entity.first_name,
                "last_name": entity.last_name,
                "company_name": entity.company_name,
                "display_name": entity.display_name,
            }
            current.update(update_data)
            if not update_data.get("display_name"):  # Seulement si pas explicite
                update_data["display_name"] = self._compute_display_name(current)

        for key, value in update_data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)

        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: UUID, user_id: Optional[UUID] = None, soft: bool = True) -> bool:
        """Supprime (soft delete) une entité"""
        entity = self.get(entity_id)
        if not entity:
            return False

        if soft:
            entity.deleted_at = datetime.utcnow()
            entity.deleted_by = user_id
            self.db.commit()
            return True
        else:
            self.db.delete(entity)
            self.db.commit()
            return True

    def restore(self, entity_id: UUID) -> Optional[Entity]:
        """Restaure une entité soft-deleted"""
        entity = self.repo.get_by_id(entity_id, include_deleted=True)
        if not entity or not entity.deleted_at:
            return None
        entity.deleted_at = None
        entity.deleted_by = None
        self.db.commit()
        self.db.refresh(entity)
        return entity

    # ============================================
    # RECHERCHE ET LISTING
    # ============================================

    def search(self, params: EntitySearchParams) -> PaginatedEntityResponse:
        """Recherche paginée avec filtres"""
        items, total = self.repo.search(params)

        return PaginatedEntityResponse(
            items=[self._to_response(e) for e in items],
            total=total,
            limit=params.limit,
            offset=params.offset,
            has_more=(params.offset + params.limit) < total,
        )

    def list_by_type(self, entity_type: str, limit: int = 50, offset: int = 0,
                     include_deleted: bool = False) -> List[EntityResponse]:
        """Liste les entités par type"""
        entities = self.repo.get_by_type(entity_type, include_deleted, limit, offset)
        return [self._to_response(e) for e in entities]

    def count_by_type(self, entity_type: str, include_deleted: bool = False) -> int:
        """Compte les entités par type"""
        return self.repo.count_by_type(entity_type, include_deleted)

    def get_all_types_count(self) -> Dict[str, int]:
        """Retourne le comptage par type et statut"""
        return self.repo.get_stats()

    def search_suggest(self, search_term: str, entity_type: Optional[str] = None, limit: int = 10) -> List[Entity]:
        """Recherche suggérée pour autocomplétion"""
        return self.repo.search_suggest(search_term, entity_type, limit)

    # ============================================
    # RESOLUTION - API PRINCIPALE REMPLACANT parties
    # ============================================

    def resolve(self, entity_id: UUID, include_relations: bool = False) -> Optional[Dict[str, Any]]:
        """
        Résout une entité par son ID et retourne toutes les infos utiles.
        REMPLACE : requêtes directes sur `parties` + JOINs manuels.
        """
        entity = self.get(entity_id)
        if not entity:
            return None

        result = self._to_full_dict(entity)

        if include_relations:
            # Ajouter les relations selon le type
            result["relations"] = self._get_relations(entity_id, entity.type)

        return result

    def resolve_or_create_from_party(self, party_id: UUID, party_data: Dict) -> Entity:
        """
        Trouve l'entité correspondante à un party_id (migration 1:1)
        ou la crée si elle n'existe pas.
        Utilisé pendant la Phase 2 de migration.
        """
        # Chercher par ID (migration conserve les mêmes UUID)
        entity = self.get(party_id)
        if entity:
            return entity

        # Créer depuis les données de la partie
        return self.create_from_party_data(party_id, party_data)

    def create_from_party_data(self, party_id: UUID, party_data: Dict) -> Entity:
        """Crée une entité depuis les données brutes d'une partie (migration)"""
        entity_data = {
            "id": party_id,  # Conserver le même UUID
            "type": "client",
            "subtype": party_data.get("type", "particulier"),
            "status": "active" if party_data.get("actif", True) else "inactive",
            "first_name": party_data.get("prenom"),
            "last_name": party_data.get("nom"),
            "company_name": party_data.get("nom_entreprise"),
            "phone": party_data.get("telephone"),
            "email": party_data.get("email"),
            "address": party_data.get("adresse"),
            "profession": party_data.get("profession"),
            "employer": party_data.get("employeur"),
            "birth_date": party_data.get("naissance_date"),
            "birth_place": party_data.get("naissance_lieu"),
            "nationality": party_data.get("nationalite"),
            "id_document_type": "cni",
            "id_document_number": party_data.get("cni_numero"),
            "id_document_date": party_data.get("cni_date"),
            "id_document_place": party_data.get("cni_lieu"),
            "metadata": {
                "migrated_from": "parties",
                "original_party_id": str(party_id),
            },
            "created_at": party_data.get("created_at", datetime.utcnow()),
            "updated_at": party_data.get("updated_at", datetime.utcnow()),
            "created_by": party_data.get("created_by"),
            "updated_by": party_data.get("updated_by"),
        }

        entity_data["display_name"] = self._compute_display_name(entity_data)

        entity = Entity(**entity_data)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def migrate_parties_batch(self, parties: List[Dict]) -> Tuple[int, List[Dict]]:
        """
        Migre un lot de parties vers entities.
        Retourne (nombre_crées, erreurs).
        """
        created = 0
        errors = []

        for party in parties:
            try:
                party_id = UUID(party["id"]) if isinstance(party["id"], str) else party["id"]
                self.create_from_party_data(party_id, party)
                created += 1
            except Exception as e:
                errors.append({"party_id": party.get("id"), "error": str(e)})

        return created, errors

    # ============================================
    # HELPERS PRIVÉS
    # ============================================

    def _compute_display_name(self, data: Dict) -> str:
        """Calcule le nom d'affichage standard"""
        if data.get("display_name"):
            return data["display_name"]
        if data.get("company_name"):
            return data["company_name"]
        parts = []
        if data.get("first_name"):
            parts.append(data["first_name"])
        if data.get("last_name"):
            parts.append(data["last_name"].upper())
        return " ".join(parts) if parts else "Sans nom"

    def _to_response(self, entity: Entity) -> EntityResponse:
        """Convertit en EntityResponse avec propriétés calculées"""
        return EntityResponse(
            id=entity.id,
            type=entity.type,
            subtype=entity.subtype,
            status=entity.status,
            display_name=entity.display_name,
            first_name=entity.first_name,
            last_name=entity.last_name,
            company_name=entity.company_name,
            phone=entity.phone,
            email=entity.email,
            address=entity.address,
            profession=entity.profession,
            employer=entity.employer,
            birth_date=entity.birth_date,
            birth_place=entity.birth_place,
            nationality=entity.nationality,
            id_document_type=entity.id_document_type,
            id_document_number=entity.id_document_number,
            id_document_date=entity.id_document_date,
            id_document_place=entity.id_document_place,
            metadata=entity.entity_metadata or {},  # Use entity_metadata property
            created_at=entity.created_at.isoformat() if isinstance(entity.created_at, datetime) else str(entity.created_at or ''),
            updated_at=entity.updated_at.isoformat() if isinstance(entity.updated_at, datetime) else str(entity.updated_at or ''),
            created_by=entity.created_by,
            updated_by=entity.updated_by,
            deleted_at=entity.deleted_at,
            deleted_by=entity.deleted_by,
            computed_display_name=entity.computed_display_name,
            primary_contact=entity.primary_contact,
            identity_document=entity.identity_document,
        )

    def _to_full_dict(self, entity: Entity) -> Dict[str, Any]:
        """Convertit en dictionnaire complet pour API"""
        base = self._to_response(entity).model_dump()
        # Ajouter des champs utiles pour les consommateurs
        base["is_company"] = bool(entity.company_name)
        base["has_contact"] = bool(entity.phone or entity.email)
        base["has_identity_doc"] = bool(entity.id_document_number)
        return base

    def _get_relations(self, entity_id: UUID, entity_type: str) -> Dict[str, Any]:
        """Récupère les relations selon le type d'entité"""
        relations = {}

        if entity_type == "client":
            # Lots fonciers dont ce client est propriétaire
            lots = self.db.execute(text("""
                SELECT id, reference, numero_lot, statut, prix_cession
                FROM foncier_lots
                WHERE proprietaire_client_id = :eid AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 20
            """), {"eid": str(entity_id)}).fetchall()
            relations["foncier_lots"] = [dict(r._mapping) for r in lots]

            # Attestations
            attestations = self.db.execute(text("""
                SELECT id, reference, version, statut, date_etablissement
                FROM foncier_attestations
                WHERE proprietaire_client_id = :eid AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 20
            """), {"eid": str(entity_id)}).fetchall()
            relations["attestations"] = [dict(r._mapping) for r in attestations]

            # Propriétés immobilières
            properties = self.db.execute(text("""
                SELECT id, reference, titre, type_bien, statut, ville
                FROM properties
                WHERE proprietaire_client_id = :eid AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 20
            """), {"eid": str(entity_id)}).fetchall()
            relations["properties"] = [dict(r._mapping) for r in properties]

            # Contrats de location (en tant que locataire)
            contracts = self.db.execute(text("""
                SELECT id, reference, property_id, statut, date_debut, date_fin, loyer_mensuel
                FROM lease_contracts
                WHERE locataire_client_id = :eid AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 20
            """), {"eid": str(entity_id)}).fetchall()
            relations["lease_contracts"] = [dict(r._mapping) for r in contracts]

        elif entity_type == "supplier":
            # Produits fournis
            products = self.db.execute(text("""
                SELECT id, reference, nom, categorie, prix_unitaire, stock_actuel
                FROM products
                WHERE fournisseur_principal_id = :eid
                ORDER BY nom
                LIMIT 50
            """), {"eid": str(entity_id)}).fetchall()
            relations["products"] = [dict(r._mapping) for r in products]

        elif entity_type == "employee":
            # Tâches assignées
            tasks = self.db.execute(text("""
                SELECT id, titre, statut, priorite, date_echeance
                FROM tasks
                WHERE employee_id = :eid
                ORDER BY date_echeance NULLS LAST
                LIMIT 20
            """), {"eid": str(entity_id)}).fetchall()
            relations["tasks"] = [dict(r._mapping) for r in tasks]

        return relations

    # ============================================
    # MÉTHODES DE COMPATIBILITÉ (Phase 4+)
    # ============================================

    def get_client_by_id(self, client_id: UUID) -> Optional[EntityResponse]:
        """Compatibilité API clients - redirige vers resolve"""
        entity = self.get(client_id)
        if not entity or entity.type != "client":
            return None
        return self._to_response(entity)

    def list_clients(self, search: Optional[str] = None, type_filter: Optional[str] = None,
                     actif: Optional[bool] = None, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Compatibilité API clients/list - redirige vers search"""
        params = EntitySearchParams(
            search=search,
            subtype=type_filter,
            status="active" if actif else ("inactive" if actif is False else None),
            limit=limit,
            offset=offset,
        )
        # Forcer type=client
        params.type = "client"
        result = self.search(params)
        return [item.model_dump() for item in result.items]

    def create_client(self, payload: Dict, user_id: Optional[UUID] = None) -> EntityResponse:
        """Compatibilité API clients/create"""
        # Mapper les anciens champs vers les nouveaux
        entity_data = EntityCreate(
            type="client",
            subtype=payload.get("type", "particulier"),
            first_name=payload.get("prenom"),
            last_name=payload.get("nom"),
            company_name=payload.get("nom_entreprise"),
            phone=payload.get("telephone"),
            email=payload.get("email"),
            address=payload.get("adresse"),
            profession=payload.get("profession"),
            employer=payload.get("employeur"),
            birth_date=payload.get("naissance_date"),
            birth_place=payload.get("naissance_lieu"),
            nationality=payload.get("nationalite"),
            id_document_type="cni",
            id_document_number=payload.get("cni_numero"),
            id_document_date=payload.get("cni_date"),
            id_document_place=payload.get("cni_lieu"),
            status="active" if payload.get("actif", True) else "inactive",
            metadata={},
        )
        entity = self.create(entity_data, user_id)
        return self._to_response(entity)

    def update_client(self, client_id: UUID, payload: Dict, user_id: Optional[UUID] = None) -> Optional[EntityResponse]:
        """Compatibilité API clients/update"""
        entity = self.get(client_id)
        if not entity or entity.type != "client":
            return None

        # Mapper les champs
        update_data = EntityUpdate(
            subtype=payload.get("type"),
            first_name=payload.get("prenom"),
            last_name=payload.get("nom"),
            company_name=payload.get("nom_entreprise"),
            phone=payload.get("telephone"),
            email=payload.get("email"),
            address=payload.get("adresse"),
            profession=payload.get("profession"),
            employer=payload.get("employeur"),
            birth_date=payload.get("naissance_date"),
            birth_place=payload.get("naissance_lieu"),
            nationality=payload.get("nationalite"),
            id_document_number=payload.get("cni_numero"),
            id_document_date=payload.get("cni_date"),
            id_document_place=payload.get("cni_lieu"),
            status="active" if payload.get("actif") else "inactive" if payload.get("actif") is False else None,
        )
        entity = self.update(client_id, update_data, user_id)
        return self._to_response(entity) if entity else None


# ============================================
# FACTORY
# ============================================

def get_entity_service(db: Session) -> EntityService:
    return EntityService(db)