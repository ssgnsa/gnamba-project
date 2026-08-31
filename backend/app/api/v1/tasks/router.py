from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


class TaskResponse(BaseModel):
    id: str
    titre: str
    description: str | None = None
    employee_id: str | None = None
    project_id: str | None = None
    statut: str | None = None
    priorite: str | None = None
    date_debut: Any | None = None
    date_echeance: Any | None = None
    created_at: Any | None = None
    updated_at: Any | None = None


class TaskCreateRequest(BaseModel):
    titre: str
    description: str | None = None
    employee_id: str | None = None
    project_id: str | None = None
    statut: str = "a_faire"
    priorite: str = "normale"
    date_debut: str | None = None
    date_echeance: str | None = None


class TaskUpdateRequest(BaseModel):
    titre: str | None = None
    description: str | None = None
    employee_id: str | None = None
    project_id: str | None = None
    statut: str | None = None
    priorite: str | None = None
    date_debut: str | None = None
    date_echeance: str | None = None


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    employee_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> list[TaskResponse]:
    """Liste les tâches"""
    query = """
        SELECT id, titre, description, employee_id, project_id, statut, priorite,
               date_debut, date_echeance, created_at, updated_at
        FROM tasks
        WHERE 1=1
    """
    params = {}

    if search:
        query += " AND (titre ILIKE :search OR description ILIKE :search)"
        params["search"] = f"%{search}%"
    if statut:
        query += " AND statut = :statut"
        params["statut"] = statut
    if employee_id:
        query += " AND employee_id = :employee_id"
        params["employee_id"] = employee_id

    query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset

    rows = db.execute(text(query), params).fetchall()
    return [
        TaskResponse(
            id=str(row[0]) if row[0] else None,
            titre=row[1],
            description=row[2],
            employee_id=str(row[3]) if row[3] else None,
            project_id=str(row[4]) if row[4] else None,
            statut=row[5],
            priorite=row[6],
            date_debut=row[7],
            date_echeance=row[8],
            created_at=row[9],
            updated_at=row[10],
        )
        for row in rows
    ]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)) -> TaskResponse:
    """Récupère une tâche par ID"""
    row = db.execute(
        text("""
            SELECT id, titre, description, employee_id, project_id, statut, priorite,
                   date_debut, date_echeance, created_at, updated_at
            FROM tasks
            WHERE id = :task_id
        """),
        {"task_id": task_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Tâche introuvable")

    return TaskResponse(
        id=str(row[0]) if row[0] else None,
        titre=row[1],
        description=row[2],
        employee_id=str(row[3]) if row[3] else None,
        project_id=str(row[4]) if row[4] else None,
        statut=row[5],
        priorite=row[6],
        date_debut=row[7],
        date_echeance=row[8],
        created_at=row[9],
        updated_at=row[10],
    )


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(payload: TaskCreateRequest, db: Session = Depends(get_db)) -> TaskResponse:
    """Crée une nouvelle tâche"""
    import uuid
    task_id = str(uuid.uuid4())

    db.execute(
        text("""
            INSERT INTO tasks (
                id, titre, description, employee_id, project_id, statut, priorite,
                date_debut, date_echeance, created_at, updated_at
            ) VALUES (
                :id, :titre, :description, :employee_id, :project_id, :statut, :priorite,
                :date_debut, :date_echeance, NOW(), NOW()
            )
            RETURNING id
        """),
        {
            "id": task_id,
            "titre": payload.titre,
            "description": payload.description,
            "employee_id": payload.employee_id,
            "project_id": payload.project_id,
            "statut": payload.statut,
            "priorite": payload.priorite,
            "date_debut": payload.date_debut,
            "date_echeance": payload.date_echeance,
        },
    )
    db.commit()

    return get_task(task_id, db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, payload: TaskUpdateRequest, db: Session = Depends(get_db)) -> TaskResponse:
    """Met à jour une tâche"""
    updates = []
    values = {"task_id": task_id}

    for field in ["titre", "description", "employee_id", "project_id", "statut", "priorite",
                  "date_debut", "date_echeance"]:
        value = getattr(payload, field)
        if value is not None:
            updates.append(f"{field} = :{field}")
            values[field] = value

    if not updates:
        return get_task(task_id, db)

    updates.append("updated_at = NOW()")
    query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = :task_id"

    result = db.execute(text(query), values)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tâche introuvable")

    return get_task(task_id, db)


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    """Supprime une tâche"""
    result = db.execute(
        text("DELETE FROM tasks WHERE id = :task_id"),
        {"task_id": task_id},
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tâche introuvable")

    return {"status": "ok", "message": "Tâche supprimée"}