from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, RequireAdminUser
from app.models.hr import MessageDirection

router = APIRouter(
    prefix="/api/v1/messages-direction",
    tags=["messages-direction"],
    dependencies=[Depends(RequireAdminUser)],
)


@router.patch("/{message_id}/publish", status_code=status.HTTP_200_OK)
def publish_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Publie un message direction (statut brouillon → envoyé). Réservé aux admins."""
    try:
        msg_uuid = UUID(message_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="ID de message invalide")

    message = db.get(MessageDirection, msg_uuid)
    if not message:
        raise HTTPException(status_code=404, detail="Message introuvable")

    if message.statut == "envoye":
        raise HTTPException(status_code=400, detail="Le message est déjà publié")

    message.statut = "envoye"
    message.date_publication = datetime.now(timezone.utc)
    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": str(message.id),
        "statut": message.statut,
        "date_publication": message.date_publication.isoformat() if message.date_publication else None,
    }
