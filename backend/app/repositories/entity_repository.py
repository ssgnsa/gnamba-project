# Entity Repository - SQLAlchemy
# Couche d'accès aux données pour la table entities

from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
from sqlalchemy import select, func, and_, or_, desc, asc, text, delete, update
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.entity import Entity
from app.schemas.entity import EntityCreate, EntityUpdate, EntitySearchParams


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
# ENTITY REPOSITORY
# ============================================

class EntityRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db, Entity)

    def get_by_document(self, doc_type: str, doc_number: str, include_deleted: bool = False) -> Optional[Entity]:
        """Récupère une entité par son document d'identité"""
        query = self.db.query(Entity).filter(
            Entity.id_document_type == doc_type,
            Entity.id_document_number == doc_number
        )
        if not include_deleted:
            query = query.filter(Entity.deleted_at.is_(None))
        return query.first()

    def get_by_email(self, email: str, include_deleted: bool = False) -> Optional[Entity]:
        """Récupère une entité par email"""
        query = self.db.query(Entity).filter(Entity.email == email.lower())
        if not include_deleted:
            query = query.filter(Entity.deleted_at.is_(None))
        return query.first()

    def get_by_phone(self, phone: str, include_deleted: bool = False) -> Optional[Entity]:
        """Récupère une entité par téléphone"""
        query = self.db.query(Entity).filter(Entity.phone == phone)
        if not include_deleted:
            query = query.filter(Entity.deleted_at.is_(None))
        return query.first()

    def get_by_type(self, entity_type: str, include_deleted: bool = False,
                    limit: int = 100, offset: int = 0) -> List[Entity]:
        """Récupère les entités par type"""
        query = self.db.query(Entity).filter(Entity.type == entity_type)
        if not include_deleted:
            query = query.filter(Entity.deleted_at.is_(None))
        return query.order_by(desc(Entity.created_at)).offset(offset).limit(limit).all()

    def search(self, params: EntitySearchParams) -> Tuple[List[Entity], int]:
        """Recherche avancée avec filtres multiples"""
        query = self.db.query(Entity).filter(Entity.deleted_at.is_(None))

        # Recherche textuelle
        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Entity.first_name).like(search_term),
                    func.lower(Entity.last_name).like(search_term),
                    func.lower(Entity.company_name).like(search_term),
                    func.lower(Entity.phone).like(search_term),
                    func.lower(Entity.email).like(search_term),
                    func.lower(Entity.id_document_number).like(search_term),
                )
            )

        # Filtres exacts
        if params.type:
            query = query.filter(Entity.type == params.type)
        if params.subtype:
            query = query.filter(Entity.subtype == params.subtype)
        if params.status:
            query = query.filter(Entity.status == params.status)

        # Filtres booléens
        if params.has_phone is True:
            query = query.filter(Entity.phone.isnot(None), Entity.phone != '')
        elif params.has_phone is False:
            query = query.filter(or_(Entity.phone.is_(None), Entity.phone == ''))

        if params.has_email is True:
            query = query.filter(Entity.email.isnot(None), Entity.email != '')
        elif params.has_email is False:
            query = query.filter(or_(Entity.email.is_(None), Entity.email == ''))

        if params.has_company is True:
            query = query.filter(Entity.company_name.isnot(None), Entity.company_name != '')
        elif params.has_company is False:
            query = query.filter(or_(Entity.company_name.is_(None), Entity.company_name == ''))

        if params.id_document_type:
            query = query.filter(Entity.id_document_type == params.id_document_type)
        if params.id_document_number:
            query = query.filter(Entity.id_document_number == params.id_document_number)

        # Tri
        order_col = getattr(Entity, params.order_by, Entity.created_at)
        if params.descending:
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))

        total = query.count()
        items = query.offset(params.offset).limit(params.limit).all()
        return items, total

    def count_by_type(self, entity_type: str, include_deleted: bool = False) -> int:
        """Compte les entités par type"""
        query = self.db.query(func.count(Entity.id)).filter(Entity.type == entity_type)
        if not include_deleted:
            query = query.filter(Entity.deleted_at.is_(None))
        return query.scalar()

    def get_stats(self) -> Dict[str, int]:
        """Retourne les statistiques par type"""
        result = self.db.execute(text("""
            SELECT type, status, COUNT(*) as count
            FROM entities
            WHERE deleted_at IS NULL
            GROUP BY type, status
        """)).fetchall()

        stats = {}
        for row in result:
            key = f"{row.type}_{row.status}"
            stats[key] = row.count
        return stats

    def create_from_party(self, party_data: dict) -> Entity:
        """Crée une entité depuis les données d'une partie (migration)"""
        entity = Entity(**party_data)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def bulk_create_from_parties(self, parties_data: List[dict]) -> List[Entity]:
        """Crée plusieurs entités depuis des parties (migration en lot)"""
        entities = [Entity(**data) for data in parties_data]
        self.db.add_all(entities)
        self.db.commit()
        for entity in entities:
            self.db.refresh(entity)
        return entities

    def find_duplicates(self, entity: Entity, exclude_id: Optional[UUID] = None) -> List[Entity]:
        """Trouve les doublons potentiels (même document, email ou téléphone)"""
        conditions = []

        if entity.id_document_type and entity.id_document_number:
            conditions.append(
                and_(
                    Entity.id_document_type == entity.id_document_type,
                    Entity.id_document_number == entity.id_document_number
                )
            )

        if entity.email:
            conditions.append(Entity.email == entity.email)

        if entity.phone:
            conditions.append(Entity.phone == entity.phone)

        if not conditions:
            return []

        query = self.db.query(Entity).filter(
            or_(*conditions),
            Entity.deleted_at.is_(None)
        )

        if exclude_id:
            query = query.filter(Entity.id != exclude_id)

        return query.all()

    def search_suggest(self, search_term: str, entity_type: Optional[str] = None, limit: int = 10) -> List[Entity]:
        """Recherche légère pour suggestions d'autocomplétion"""
        q = f"%{search_term.lower()}%"
        query = (
            self.db.query(Entity)
            .filter(Entity.deleted_at.is_(None))
            .filter(
                or_(
                    func.lower(Entity.first_name).like(q),
                    func.lower(Entity.last_name).like(q),
                    func.lower(Entity.company_name).like(q),
                    func.lower(Entity.phone).like(q),
                    func.lower(Entity.email).like(q),
                )
            )
        )
        if entity_type:
            query = query.filter(Entity.type == entity_type)
        return query.limit(limit).all()


# ============================================
# FACTORY
# ============================================

def get_entity_repo(db: Session) -> EntityRepository:
    return EntityRepository(db)