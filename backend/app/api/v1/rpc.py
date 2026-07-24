from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import NAMESPACE_URL, uuid4, uuid5

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.repositories.generic_table_repository import GenericTableRepository

router = APIRouter(prefix="/api/v1/rpc", tags=["rpc"])


def _repo(db: Session, table: str) -> GenericTableRepository:
    return GenericTableRepository(db, table, {}, {})


def _optional_user_id(current_user: dict[str, Any] | None) -> str | None:
    if not current_user:
        return None
    user_id = current_user.get("id")
    return str(user_id) if user_id else None


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_key(value: Any) -> str:
    return _normalize_text(value).lower()


def _slugify(value: str, fallback: str = "ref") -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-")
    return slug.upper() or fallback.upper()


def _json_dumps(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )


def _parse_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            normalized = value.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(normalized)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _sort_value(row: dict[str, Any], key: str) -> tuple[int, Any]:
    value = row.get(key)
    dt_value = _parse_datetime(value)
    if dt_value is not None:
        return (0, dt_value)
    if isinstance(value, (int, float)):
        return (1, value)
    if value is None:
        return (3, "")
    return (2, str(value).lower())


def _searchable_haystack(row: dict[str, Any]) -> str:
    fields = [
        row.get("reference"),
        row.get("numero_lot"),
        row.get("numero_ilot"),
        row.get("nom_lotissement"),
        row.get("village"),
        row.get("proprietaire_nom"),
        row.get("proprietaire_prenom"),
        row.get("quartier"),
        row.get("statut"),
    ]
    return " ".join(_normalize_text(value).lower() for value in fields if value is not None)


def _attach_total_count(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    total_count = len(rows)
    return [{**row, "total_count": total_count} for row in rows]


def _ensure_foncier_reference(lot: dict[str, Any], version: int) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    base_parts = [
        _slugify(_normalize_text(lot.get("reference")) or _normalize_text(lot.get("numero_lot"))),
        _slugify(_normalize_text(lot.get("village")) or "LOT"),
        str(version),
    ]
    return f"ATT-{today}-{'-'.join(base_parts)}"


@router.post("/{name}")
async def invoke_rpc(
    name: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
) -> Any:
    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload RPC invalide")

    if name == "check_foncier_duplicate":
        lot_repo = _repo(db, "foncier_lots")
        rows = lot_repo.list(order_by="created_at", descending=True)
        village = _normalize_key(payload.get("p_village"))
        lotissement = _normalize_key(payload.get("p_lotissement"))
        ilot = _normalize_key(payload.get("p_ilot"))
        lot_number = _normalize_key(payload.get("p_lot"))
        exclude_id = _normalize_key(payload.get("p_exclude_lot_id"))

        matches = []
        for row in rows:
            if exclude_id and _normalize_key(row.get("id")) == exclude_id:
                continue
            if row.get("deleted_at"):
                continue
            if village and _normalize_key(row.get("village")) != village:
                continue
            if lotissement and _normalize_key(row.get("nom_lotissement")) != lotissement:
                continue
            if ilot and _normalize_key(row.get("numero_ilot")) != ilot:
                continue
            if lot_number and _normalize_key(row.get("numero_lot")) != lot_number:
                continue
            matches.append(row)
        return matches

    if name == "search_foncier_lots":
        lot_repo = _repo(db, "foncier_lots")
        rows = lot_repo.list(order_by="created_at", descending=True)
        search = _normalize_text(payload.get("p_search")).lower()
        statut = _normalize_key(payload.get("p_statut"))
        village = _normalize_key(payload.get("p_village"))
        quartier = _normalize_text(payload.get("p_quartier")).lower()
        lotissement = _normalize_text(payload.get("p_lotissement")).lower()
        sort = _normalize_text(payload.get("p_sort")) or "created_at"
        direction = _normalize_text(payload.get("p_dir")).lower() or "desc"
        page = max(int(payload.get("p_page") or 1), 1)
        limit = max(int(payload.get("p_limit") or 20), 1)
        include_archived = bool(payload.get("p_include_archived"))

        filtered: list[dict[str, Any]] = []
        for row in rows:
            if not include_archived and row.get("deleted_at"):
                continue
            if search and search not in _searchable_haystack(row):
                continue
            if statut and _normalize_key(row.get("statut")) != statut:
                continue
            if village and _normalize_key(row.get("village")) != village:
                continue
            if quartier and quartier not in _normalize_text(row.get("quartier")).lower():
                continue
            if lotissement and lotissement not in _normalize_text(row.get("nom_lotissement")).lower():
                continue
            filtered.append(row)

        reverse = direction != "asc"
        filtered.sort(key=lambda row: _sort_value(row, sort), reverse=reverse)
        sliced = filtered[(page - 1) * limit : (page - 1) * limit + limit]
        return _attach_total_count(sliced)

    if name == "foncier_stats_by_village":
        lot_repo = _repo(db, "foncier_lots")
        rows = lot_repo.list(order_by="created_at", descending=True)
        include_archived = bool(payload.get("p_include_archived"))
        stats: dict[str, dict[str, Any]] = {}
        for row in rows:
            if not include_archived and row.get("deleted_at"):
                continue
            village = _normalize_text(row.get("village")) or "—"
            entry = stats.setdefault(
                village,
                {"village": village, "total_superficie": 0, "lots_count": 0},
            )
            entry["total_superficie"] += float(row.get("superficie") or 0)
            entry["lots_count"] += 1
        result = sorted(
            stats.values(),
            key=lambda item: item["total_superficie"],
            reverse=True,
        )
        return result

    if name == "soft_delete_foncier_lot":
        lot_id = _normalize_text(payload.get("p_lot_id"))
        if not lot_id:
            raise HTTPException(status_code=400, detail="p_lot_id requis")
        lot_repo = _repo(db, "foncier_lots")
        row = lot_repo.get(lot_id)
        if not row:
            raise HTTPException(status_code=404, detail="Lot introuvable")
        updated = lot_repo.update(
            lot_id,
            {
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "deleted_reason": _normalize_text(payload.get("p_reason"))
                or "archivage",
                "deleted_by": _optional_user_id(current_user),
            },
        )
        audit_repo = _repo(db, "foncier_audit")
        audit_repo.create(
            {
                "lot_id": lot_id,
                "action": "soft_delete",
                "performed_by": _optional_user_id(current_user),
                "new_values": {
                    "deleted_at": updated.get("deleted_at") if updated else None,
                },
            }
        )
        return updated

    if name == "restore_foncier_lot":
        lot_id = _normalize_text(payload.get("p_lot_id"))
        if not lot_id:
            raise HTTPException(status_code=400, detail="p_lot_id requis")
        lot_repo = _repo(db, "foncier_lots")
        row = lot_repo.get(lot_id)
        if not row:
            raise HTTPException(status_code=404, detail="Lot introuvable")
        updated = lot_repo.update(
            lot_id,
            {
                "deleted_at": None,
                "deleted_reason": None,
                "deleted_by": None,
            },
        )
        audit_repo = _repo(db, "foncier_audit")
        audit_repo.create(
            {
                "lot_id": lot_id,
                "action": "restore",
                "performed_by": _optional_user_id(current_user),
                "new_values": {"deleted_at": None},
            }
        )
        return updated

    if name == "ensure_foncier_hierarchy":
        village = _normalize_text(payload.get("p_village"))
        lotissement = _normalize_text(
            payload.get("p_lotissement") or payload.get("p_nom_lotissement")
        )
        ilot = _normalize_text(payload.get("p_ilot") or payload.get("p_numero_ilot"))
        lot_number = _normalize_text(payload.get("p_lot") or payload.get("p_numero_lot"))

        hierarchy_seed = "|".join([village, lotissement, ilot, lot_number])
        village_id = str(uuid5(NAMESPACE_URL, f"egs:village:{village or 'default'}"))
        lotissement_id = str(
            uuid5(NAMESPACE_URL, f"egs:lotissement:{hierarchy_seed or 'default'}")
        )
        ilot_id = str(uuid5(NAMESPACE_URL, f"egs:ilot:{hierarchy_seed or 'default'}"))
        reference = f"{_slugify(village or 'FONCIER')}-{_slugify(lotissement or 'LOT')}-{_slugify(ilot or 'ILOT')}-{_slugify(lot_number or 'LOT')}"
        return {
            "village_id": village_id,
            "lotissement_id": lotissement_id,
            "ilot_id": ilot_id,
            "reference": reference,
        }

    if name == "log_foncier_audit":
        lot_id = _normalize_text(payload.get("p_lot_id") or payload.get("p_parcelle_id"))
        action = _normalize_text(payload.get("p_action"))
        if not lot_id or not action:
            raise HTTPException(status_code=400, detail="p_lot_id et p_action requis")
        audit_repo = _repo(db, "foncier_audit")
        created = audit_repo.create(
            {
                "lot_id": lot_id,
                "action": action,
                "old_values": payload.get("p_old_values") or payload.get("p_old_value"),
                "new_values": payload.get("p_new_values")
                or payload.get("p_details")
                or payload.get("details"),
                "performed_by": _optional_user_id(current_user),
            }
        )
        return created

    if name == "create_foncier_attestation_atomic":
        lot_id = _normalize_text(payload.get("p_lot_id"))
        if not lot_id:
            raise HTTPException(status_code=400, detail="p_lot_id requis")

        lot_repo = _repo(db, "foncier_lots")
        lot = lot_repo.get(lot_id)
        if not lot:
            raise HTTPException(status_code=404, detail="Lot foncier introuvable")

        attestation_repo = _repo(db, "foncier_attestations")
        existing_rows = attestation_repo.list(order_by="created_at", descending=True)
        lot_attestations = [
            row for row in existing_rows if _normalize_text(row.get("lot_id")) == lot_id
        ]

        previous_attestation_id = _normalize_text(payload.get("p_previous_attestation_id"))
        base_attestation = None
        if previous_attestation_id:
            base_attestation = attestation_repo.get(previous_attestation_id)

        current_version = 0
        if base_attestation and base_attestation.get("version") is not None:
            current_version = int(base_attestation.get("version") or 0)
        elif lot_attestations:
            current_version = max(int(row.get("version") or 0) for row in lot_attestations)
        version = current_version + 1

        reference = _ensure_foncier_reference(lot, version)
        numero_enregistrement = _normalize_text(payload.get("p_numero_enregistrement")) or reference
        control_number = _normalize_text(payload.get("p_control_number")) or uuid4().hex[:10].upper()
        signature_nonce = _normalize_text(payload.get("p_signature_nonce")) or uuid4().hex
        signature_issued_at = (
            _normalize_text(payload.get("p_signature_issued_at"))
            or datetime.now(timezone.utc).isoformat()
        )
        date_etablissement = datetime.now(timezone.utc).date().isoformat()
        date_expiration = (datetime.now(timezone.utc) + timedelta(days=180)).isoformat()
        attestation_type = _normalize_text(payload.get("p_attestation_type")) or "standard"
        statut = "soumis" if payload.get("p_original", True) else "brouillon"

        temoin_payload = payload.get("p_temoins") or []
        if not isinstance(temoin_payload, list):
            temoin_payload = []

        attestation_payload = {
            "id": str(uuid4()),
            "lot_id": lot_id,
            "reference": reference,
            "version": version,
            "type": attestation_type,
            "statut": statut,
            "date_etablissement": date_etablissement,
            "date_expiration": date_expiration,
            "mode_acquisition": payload.get("p_mode_acquisition"),
            "historique_possession": payload.get("p_historique_possession"),
            "domicile": payload.get("p_domicile"),
            "cedant_nom": payload.get("p_cedant_nom"),
            "cedant_prenom": payload.get("p_cedant_prenom"),
            "cedant_cni_numero": payload.get("p_cedant_cni_numero"),
            "cedant_telephone": payload.get("p_cedant_telephone"),
            "cedant_domicile": payload.get("p_cedant_domicile"),
            "limites_nord": payload.get("p_limites_nord"),
            "limites_sud": payload.get("p_limites_sud"),
            "limites_est": payload.get("p_limites_est"),
            "limites_ouest": payload.get("p_limites_ouest"),
            "gps_lat": payload.get("p_gps_lat"),
            "gps_lng": payload.get("p_gps_lng"),
            "gps_precision": payload.get("p_gps_precision"),
            "gps_points": payload.get("p_gps_points") or [],
            "registre_volume": payload.get("p_registre_volume"),
            "registre_page": payload.get("p_registre_page"),
            "registre_ligne": payload.get("p_registre_ligne"),
            "numero_enregistrement": numero_enregistrement,
            "signature_nonce": signature_nonce,
            "signature_issued_at": signature_issued_at,
            "validation_agent_nom": payload.get("p_validation_agent_nom"),
            "validation_chef_nom": payload.get("p_validation_chef_nom"),
            "created_by": _optional_user_id(current_user),
            "client_updated_at": datetime.now(timezone.utc).isoformat(),
            "last_modified_device_id": payload.get("p_last_modified_device_id"),
            "deleted_at": None,
            "reference_sequence": version,
            "control_number": control_number,
        }

        payload_for_hash = {
            **attestation_payload,
            "p_original": payload.get("p_original"),
            "lot_reference": lot.get("reference"),
            "lot_village": lot.get("village"),
        }
        payload_for_hash.pop("deleted_at", None)
        hash_sha256 = hashlib.sha256(_json_dumps(payload_for_hash).encode("utf-8")).hexdigest()
        attestation_payload["hash_sha256"] = hash_sha256
        attestation_payload["qr_payload"] = _json_dumps(
            {**payload_for_hash, "hash_sha256": hash_sha256}
        )

        created_attestation = attestation_repo.create(attestation_payload)
        attestation_id = _normalize_text(created_attestation.get("id"))

        temoin_repo = _repo(db, "foncier_attestation_temoins")
        for witness in temoin_payload:
            if not isinstance(witness, dict):
                continue
            temoin_repo.create(
                {
                    "attestation_id": attestation_id,
                    "nom": witness.get("nom"),
                    "prenom": witness.get("prenom"),
                    "profession": witness.get("profession"),
                    "telephone": witness.get("telephone"),
                    "cni": witness.get("cni"),
                }
            )

        if base_attestation and base_attestation.get("id"):
            attestation_repo.update(
                _normalize_text(base_attestation["id"]),
                {
                    "deleted_at": datetime.now(timezone.utc).isoformat(),
                },
            )

        return [created_attestation]

    if name == "attach_foncier_attestation_pdf_metadata":
        attestation_id = _normalize_text(payload.get("p_attestation_id"))
        if not attestation_id:
            raise HTTPException(status_code=400, detail="p_attestation_id requis")
        attestation_repo = _repo(db, "foncier_attestations")
        row = attestation_repo.get(attestation_id)
        if not row:
            raise HTTPException(status_code=404, detail="Attestation introuvable")

        pdf_generated_at = payload.get("p_pdf_generated_at")
        updated = attestation_repo.update(
            attestation_id,
            {
                "hash_sha256": payload.get("p_hash_sha256") or row.get("hash_sha256"),
                "verify_url": payload.get("p_verify_url") or row.get("verify_url"),
                "pdf_path": payload.get("p_pdf_path") or row.get("pdf_path"),
                "pdf_generated_at": pdf_generated_at or row.get("pdf_generated_at"),
                "printed_by": payload.get("p_printed_by") or row.get("printed_by"),
                "printed_at": pdf_generated_at or row.get("printed_at"),
                "print_count": int(row.get("print_count") or 0) + 1,
            },
        )
        return updated

    if name == "get_funnel_stats":
        start_value = payload.get("start_date")
        end_value = payload.get("end_date")
        start_date = _parse_datetime(start_value) or datetime.now(timezone.utc) - timedelta(days=30)
        end_date = _parse_datetime(end_value) or datetime.now(timezone.utc)

        def _within(row_value: Any) -> bool:
            parsed = _parse_datetime(row_value)
            return bool(parsed and start_date <= parsed <= end_date)

        leads = _repo(db, "leads").list(order_by="created_at", descending=True)
        visites = _repo(db, "visites_terrain").list(order_by="created_at", descending=True)
        ventes = _repo(db, "ventes_foncieres").list(order_by="created_at", descending=True)

        lead_total = sum(1 for row in leads if _within(row.get("created_at")))
        qualify_total = sum(
            1
            for row in leads
            if _within(row.get("created_at"))
            and _normalize_text(row.get("statut")) in {"qualifie", "chaud"}
        )
        visite_total = sum(1 for row in visites if _within(row.get("date_visite") or row.get("created_at")))
        vente_total = sum(
            1
            for row in ventes
            if _within(row.get("created_at"))
            and _normalize_text(row.get("statut")) in {"finalise", "acte_signe"}
        )

        stats = [
            {"etape": "leads", "total": lead_total, "taux_conversion": 100.0},
            {
                "etape": "qualifies",
                "total": qualify_total,
                "taux_conversion": (qualify_total / lead_total * 100.0) if lead_total else 0.0,
            },
            {
                "etape": "visites",
                "total": visite_total,
                "taux_conversion": (visite_total / qualify_total * 100.0) if qualify_total else 0.0,
            },
            {
                "etape": "ventes",
                "total": vente_total,
                "taux_conversion": (vente_total / visite_total * 100.0) if visite_total else 0.0,
            },
        ]
        return stats

    raise HTTPException(status_code=404, detail=f"Fonction RPC inconnue: {name}")
