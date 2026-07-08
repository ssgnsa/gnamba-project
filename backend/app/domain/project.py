from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Project:
    id: str
    nom: str
    description: str | None = None
    statut: str = "planifie"

    def to_payload(self) -> dict[str, object]:
        return {
            "id": self.id,
            "nom": self.nom,
            "description": self.description,
            "statut": self.statut,
        }
