from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Employee:
    id: str
    nom: str
    prenom: str
    poste: str | None = None
    email: str | None = None

    def to_payload(self) -> dict[str, object]:
        return {
            "id": self.id,
            "nom": self.nom,
            "prenom": self.prenom,
            "poste": self.poste,
            "email": self.email,
        }
