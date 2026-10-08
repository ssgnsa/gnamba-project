import pytest
from pydantic import ValidationError

from app.schemas.immobilier import PropertyCreate, PropertyUpdate


def test_property_create_requires_structured_locality():
    with pytest.raises(ValidationError, match="commune ou la ville"):
        PropertyCreate(type_bien="villa", adresse="Rue 1")


@pytest.mark.parametrize("locality", [{"commune": " Cocody  "}, {"ville": "Abidjan"}])
def test_property_create_accepts_commune_or_fallback_city(locality):
    payload = PropertyCreate(type_bien="villa", adresse="Rue 1", **locality)
    assert payload.statut == "disponible"


@pytest.mark.parametrize("status", ["louee", "vendue", "en_vente", "retiree", "archivee"])
def test_property_create_rejects_non_initial_operational_status(status):
    with pytest.raises(ValidationError):
        PropertyCreate(
            type_bien="villa", adresse="Rue 1", commune="Cocody", statut=status
        )


@pytest.mark.parametrize("schema, payload", [
    (
        PropertyCreate,
        {
            "type_bien": "villa",
            "adresse": "Rue 1",
            "commune": "Cocody",
            "reference": "CLIENT-REFERENCE",
            "titre": "Titre client",
        },
    ),
    (
        PropertyUpdate,
        {"reference": "CLIENT-REFERENCE", "titre": "Titre client"},
    ),
])
def test_client_title_and_reference_are_rejected(schema, payload):
    with pytest.raises(ValidationError) as exc_info:
        schema.model_validate(payload)

    rejected_fields = {error["loc"][0] for error in exc_info.value.errors()}
    assert {"reference", "titre"} <= rejected_fields
