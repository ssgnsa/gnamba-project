#!/usr/bin/env python3
"""
Script de migration Phase 2: Copie `parties` → `entities` (1:1, mêmes UUID)

Ce script :
1. Lit toutes les lignes de la table `parties`
2. Les transforme en format `entities` (type='client', subtype=parties.type)
3. Les insère dans `entities` en conservant les MÊMES UUID
4. Génère un rapport de migration (succès, erreurs, doublons potentiels)

Usage:
    python scripts/migrate_parties_to_entities.py [--dry-run] [--batch-size 100]
"""

import sys
import argparse
import json
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Dict, Any, Tuple, Set
from sqlalchemy import text
from sqlalchemy.orm import Session

# Ajouter le backend au path
sys.path.insert(0, '/home/soma/gnamba-project/backend')

from app.core.database import SessionLocal, engine
from app.models.entity import Entity
from app.models.party import Party


def migrate_parties_to_entities(
    db: Session,
    dry_run: bool = False,
    batch_size: int = 100
) -> Dict[str, Any]:
    """
    Migre les données de `parties` vers `entities`.

    Mapping des champs :
    - parties.id → entities.id (MÊME UUID)
    - parties.type → entities.subtype
    - parties.actif → entities.status ('active'/'inactive')
    - parties.nom/prenom/nom_entreprise → entities.last_name/first_name/company_name
    - parties.telephone/email/adresse → entities.phone/email/address
    - parties.profession/employeur → entities.profession/employer
    - parties.naissance_date/naissance_lieu → entities.birth_date/birth_place
    - parties.nationalite → entities.nationality
    - parties.cni_* → entities.id_document_* (type='cni')
    - parties.created_at/updated_at/created_by/updated_by → conservés
    - entities.type = 'client' (fixe pour migration parties)
    - entities.metadata = { "migrated_from": "parties", "original_party_id": "...", "migrated_at": "..." }
    """

    report = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "total_parties": 0,
        "migrated": 0,
        "skipped_existing": 0,
        "errors": [],
        "duplicates": [],
        "batch_size": batch_size,
        "dry_run": dry_run,
    }

    # 1. Compter les parties
    total_parties = db.execute(text("SELECT COUNT(*) FROM parties")).scalar()
    report["total_parties"] = total_parties
    print(f"Total parties à migrer: {total_parties}")

    if total_parties == 0:
        print("Aucune partie à migrer.")
        return report

    # 2. Vérifier les entités existantes (pour skip)
    existing_ids: Set[str] = set()
    if not dry_run:
        existing = db.execute(text("SELECT id::text FROM entities WHERE type = 'client'")).fetchall()
        existing_ids = {row[0] for row in existing}
        print(f"Entités 'client' déjà existantes: {len(existing_ids)}")

    # 3. Migration par lots
    offset = 0
    while True:
        parties = db.execute(text("""
            SELECT
                id, type, nom, prenom, nom_entreprise,
                cni_numero, cni_date, cni_lieu,
                telephone, email, adresse,
                profession, employeur,
                naissance_date, naissance_lieu, nationalite,
                actif, created_at, updated_at, created_by, updated_by
            FROM parties
            ORDER BY created_at
            LIMIT :limit OFFSET :offset
        """), {"limit": batch_size, "offset": offset}).fetchall()

        if not parties:
            break

        print(f"  Traitement lot {offset//batch_size + 1}: {len(parties)} parties...")

        entities_to_create = []
        for party in parties:
            party_id = str(party[0])

            # Skip si déjà migré
            if party_id in existing_ids:
                report["skipped_existing"] += 1
                continue

            # Mapper les données
            entity_data = {
                "id": party_id,  # MÊME UUID (en string pour psycopg2)
                "type": "client",
                "subtype": party[1] or "particulier",  # type
                "status": "active" if party[16] else "inactive",  # actif
                "display_name": None,  # sera calculé
                "first_name": party[3],  # prenom
                "last_name": party[2],   # nom
                "company_name": party[4], # nom_entreprise
                "phone": party[8],       # telephone
                "email": party[9].lower() if party[9] else None,  # email
                "address": party[10],    # adresse
                "profession": party[11], # profession
                "employer": party[12],   # employeur
                "birth_date": party[13], # naissance_date
                "birth_place": party[14], # naissance_lieu
                "nationality": party[15], # nationalite
                "id_document_type": "cni",
                "id_document_number": party[5],  # cni_numero
                "id_document_date": party[6],    # cni_date
                "id_document_place": party[7],   # cni_lieu
                "metadata": json.dumps({  # JSON string pour psycopg2
                    "migrated_from": "parties",
                    "original_party_id": party_id,
                    "migrated_at": datetime.now(timezone.utc).isoformat(),
                }),
                "created_at": party[17],  # created_at
                "updated_at": party[18],  # updated_at
                "created_by": str(party[19]) if party[19] else None,  # created_by
                "updated_by": str(party[20]) if party[20] else None,  # updated_by
            }

            # Calculer display_name
            entity_data["display_name"] = compute_display_name(entity_data)

            # Vérifier doublons potentiels (même CNI, email, téléphone)
            duplicates = check_duplicates(db, entity_data, party_id)
            if duplicates:
                report["duplicates"].append({
                    "party_id": party_id,
                    "duplicates": [str(d) for d in duplicates]
                })

            entities_to_create.append(entity_data)

        # Insertion en lot
        if entities_to_create and not dry_run:
            try:
                # Utiliser INSERT ... ON CONFLICT DO NOTHING pour gérer les races
                insert_sql = """
                    INSERT INTO entities (
                        id, type, subtype, status, display_name,
                        first_name, last_name, company_name,
                        phone, email, address,
                        profession, employer,
                        birth_date, birth_place, nationality,
                        id_document_type, id_document_number,
                        id_document_date, id_document_place,
                        metadata,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        :id, :type, :subtype, :status, :display_name,
                        :first_name, :last_name, :company_name,
                        :phone, :email, :address,
                        :profession, :employer,
                        :birth_date, :birth_place, :nationality,
                        :id_document_type, :id_document_number,
                        :id_document_date, :id_document_place,
                        :metadata,
                        :created_at, :updated_at, :created_by, :updated_by
                    )
                    ON CONFLICT (id) DO NOTHING
                """
                db.execute(text(insert_sql), entities_to_create)
                db.commit()
                migrated_count = len(entities_to_create)
                report["migrated"] += migrated_count
                print(f"    → {migrated_count} entités créées")
            except Exception as e:
                db.rollback()
                for entity_data in entities_to_create:
                    report["errors"].append({
                        "party_id": entity_data["id"],
                        "error": str(e)
                    })
                print(f"    → ERREUR: {e}")

        offset += batch_size

    report["finished_at"] = datetime.now(timezone.utc).isoformat()
    return report


def compute_display_name(data: Dict[str, Any]) -> str:
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


def check_duplicates(db: Session, entity_data: Dict[str, Any], exclude_id: str) -> List[str]:
    """Vérifie les doublons potentiels dans entities (CNI, email, téléphone)"""
    conditions = []
    params = {"exclude_id": exclude_id}

    if entity_data.get("id_document_number"):
        conditions.append("(id_document_type = 'cni' AND id_document_number = :cni)")
        params["cni"] = entity_data["id_document_number"]

    if entity_data.get("email"):
        conditions.append("(email = :email)")
        params["email"] = entity_data["email"]

    if entity_data.get("phone"):
        conditions.append("(phone = :phone)")
        params["phone"] = entity_data["phone"]

    if not conditions:
        return []

    sql = f"""
        SELECT id::text FROM entities
        WHERE id::text != :exclude_id
        AND deleted_at IS NULL
        AND ({' OR '.join(conditions)})
        LIMIT 10
    """
    result = db.execute(text(sql), params).fetchall()
    return [row[0] for row in result]


def verify_migration(db: Session) -> Dict[str, Any]:
    """Vérifie la cohérence de la migration"""
    print("\n=== VÉRIFICATION DE LA MIGRATION ===")

    verification = {
        "parties_count": 0,
        "entities_client_count": 0,
        "matched_uuids": 0,
        "missing_in_entities": [],
        "extra_in_entities": [],
        "field_mismatches": [],
    }

    # Compter
    parties_count = db.execute(text("SELECT COUNT(*) FROM parties")).scalar()
    entities_count = db.execute(text("SELECT COUNT(*) FROM entities WHERE type = 'client'")).scalar()
    verification["parties_count"] = parties_count
    verification["entities_client_count"] = entities_count

    print(f"Parties: {parties_count}")
    print(f"Entities (type=client): {entities_count}")

    # Vérifier UUIDs correspondants - cast UUID to text for comparison
    matched = db.execute(text("""
        SELECT COUNT(*) FROM parties p
        JOIN entities e ON e.id::text = p.id::text AND e.type = 'client'
    """)).scalar()
    verification["matched_uuids"] = matched
    print(f"UUIDs correspondants: {matched}")

    # Parties sans entity correspondante
    missing = db.execute(text("""
        SELECT p.id, p.nom, p.prenom, p.nom_entreprise, p.cni_numero
        FROM parties p
        LEFT JOIN entities e ON e.id::text = p.id::text AND e.type = 'client'
        WHERE e.id IS NULL
    """)).fetchall()
    verification["missing_in_entities"] = [dict(row._mapping) for row in missing]
    if missing:
        print(f"⚠️  {len(missing)} parties SANS entity correspondante:")
        for m in missing[:5]:
            nom = m['nom'] or ''
            prenom = m['prenom'] or ''
            entreprise = m['nom_entreprise'] or "pas d'entreprise"
            cni = m['cni_numero'] or ''
            print(f"   - {m['id']}: {nom} {prenom} ({entreprise}) CNI: {cni}")

    # Entities client sans party (ne devrait pas arriver en migration 1:1)
    extra = db.execute(text("""
        SELECT e.id, e.first_name, e.last_name, e.company_name, e.id_document_number
        FROM entities e
        LEFT JOIN parties p ON p.id::text = e.id::text
        WHERE e.type = 'client' AND p.id IS NULL
    """)).fetchall()
    verification["extra_in_entities"] = [dict(row._mapping) for row in extra]
    if extra:
        print(f"⚠️  {len(extra)} entities client SANS party d'origine:")
        for x in extra[:5]:
            fn = x['first_name'] or ''
            ln = x['last_name'] or ''
            comp = x['company_name'] or "pas d'entreprise"
            cni = x['id_document_number'] or ''
            print(f"   - {x['id']}: {fn} {ln} ({comp}) CNI: {cni}")

    # Vérifier cohérence champs clés
    mismatches = db.execute(text("""
        SELECT
            p.id,
            p.nom as p_nom, e.last_name as e_last_name,
            p.prenom as p_prenom, e.first_name as e_first_name,
            p.nom_entreprise as p_entreprise, e.company_name as e_entreprise,
            p.telephone as p_tel, e.phone as e_tel,
            p.email as p_email, e.email as e_email,
            p.cni_numero as p_cni, e.id_document_number as e_cni,
            p.actif as p_actif, e.status as e_status
        FROM parties p
        JOIN entities e ON e.id::text = p.id::text AND e.type = 'client'
        WHERE
            COALESCE(p.nom, '') != COALESCE(e.last_name, '')
            OR COALESCE(p.prenom, '') != COALESCE(e.first_name, '')
            OR COALESCE(p.nom_entreprise, '') != COALESCE(e.company_name, '')
            OR COALESCE(p.telephone, '') != COALESCE(e.phone, '')
            OR LOWER(COALESCE(p.email, '')) != LOWER(COALESCE(e.email, ''))
            OR COALESCE(p.cni_numero, '') != COALESCE(e.id_document_number, '')
            OR (p.actif = true AND e.status != 'active')
            OR (p.actif = false AND e.status != 'inactive')
        LIMIT 20
    """)).mappings().all()
    verification["field_mismatches"] = [dict(row) for row in mismatches]
    if mismatches:
        print(f"⚠️  {len(mismatches)} différences de champs détectées:")
        for m in mismatches[:5]:
            diffs = []
            if m['p_nom'] != m['e_last_name']:
                diffs.append(f"nom: '{m['p_nom']}' vs '{m['e_last_name']}'")
            if m['p_prenom'] != m['e_first_name']:
                diffs.append(f"prenom: '{m['p_prenom']}' vs '{m['e_first_name']}'")
            if m['p_entreprise'] != m['e_entreprise']:
                diffs.append(f"entreprise: '{m['p_entreprise']}' vs '{m['e_entreprise']}'")
            if m['p_tel'] != m['e_tel']:
                diffs.append(f"tel: '{m['p_tel']}' vs '{m['e_tel']}'")
            if m['p_email'].lower() != m['e_email'].lower():
                diffs.append(f"email: '{m['p_email']}' vs '{m['e_email']}'")
            if m['p_cni'] != m['e_cni']:
                diffs.append(f"cni: '{m['p_cni']}' vs '{m['e_cni']}'")
            if (m['p_actif'] and m['e_status'] != 'active') or (not m['p_actif'] and m['e_status'] != 'inactive'):
                diffs.append(f"status: actif={m['p_actif']} vs status={m['e_status']}")
            print(f"   - {m['id']}: {', '.join(diffs)}")
    else:
        print("✅ Tous les champs correspondent parfaitement")

    return verification


def print_report(report: Dict[str, Any]):
    """Affiche le rapport de migration"""
    print("\n=== RAPPORT DE MIGRATION ===")
    print(f"Début: {report['started_at']}")
    print(f"Fin: {report.get('finished_at', 'en cours')}")
    print(f"Total parties: {report['total_parties']}")
    print(f"Migrées: {report['migrated']}")
    print(f"Déjà existantes (skippées): {report['skipped_existing']}")
    print(f"Erreurs: {len(report['errors'])}")
    print(f"Doublons potentiels détectés: {len(report['duplicates'])}")

    if report['errors']:
        print("\nErreurs:")
        for err in report['errors'][:10]:
            print(f"  - {err['party_id']}: {err['error']}")

    if report['duplicates']:
        print("\nDoublons potentiels (attention: même CNI/email/téléphone):")
        for dup in report['duplicates'][:10]:
            print(f"  - Party {dup['party_id']} → Entities existantes: {', '.join(dup['duplicates'])}")


def main():
    parser = argparse.ArgumentParser(description="Migration parties → entities")
    parser.add_argument("--dry-run", action="store_true", help="Simulation sans écriture")
    parser.add_argument("--batch-size", type=int, default=100, help="Taille des lots")
    parser.add_argument("--verify-only", action="store_true", help="Ne faire que la vérification")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.verify_only:
            verification = verify_migration(db)
            return 0 if len(verification["missing_in_entities"]) == 0 and len(verification["field_mismatches"]) == 0 else 1

        print(f"{'[DRY RUN] ' if args.dry_run else ''}Migration parties → entities")
        print(f"Batch size: {args.batch_size}")

        report = migrate_parties_to_entities(db, dry_run=args.dry_run, batch_size=args.batch_size)
        print_report(report)

        # Vérification post-migration (sauf dry-run)
        if not args.dry_run:
            verification = verify_migration(db)

        return 0 if len(report['errors']) == 0 else 1

    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())