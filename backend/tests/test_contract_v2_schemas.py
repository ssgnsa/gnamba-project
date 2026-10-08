from datetime import date

import pytest
from pydantic import ValidationError

from app.api.v1.finance.router import FinanceCreateRequest, _normalize
from app.api.v1.products.router import ProductCreateRequest


def test_product_reference_is_server_owned():
    payload = ProductCreateRequest.model_validate({"nom": "Ciment"})
    assert payload.nom == "Ciment"
    with pytest.raises(ValidationError):
        ProductCreateRequest.model_validate({"nom": "Ciment", "reference": "PRD-2026-000001"})


@pytest.mark.parametrize(
    ("operation", "legacy", "expected"),
    [
        ("ENCAISSEMENT", None, "ENCAISSEMENT"),
        ("DECAISSEMENT", None, "DECAISSEMENT"),
        (None, "recette", "ENCAISSEMENT"),
        (None, "depense", "DECAISSEMENT"),
    ],
)
def test_finance_types_normalize_to_canonical(operation, legacy, expected):
    payload = {
        "reference": "FIN-TEST-1",
        "montant": "120.50",
        "date_operation": "2026-10-02",
    }
    if operation:
        payload["type_operation"] = operation
    if legacy:
        payload["type_transaction"] = legacy

    validated = FinanceCreateRequest.model_validate(payload)
    normalized = _normalize(validated.model_dump(exclude_unset=True))
    assert normalized["type_operation"] == expected
    assert normalized["date_operation"] == date(2026, 10, 2)
    assert "type_transaction" not in normalized


def test_finance_legacy_fields_are_readable_but_derived_amount_is_rejected():
    validated = FinanceCreateRequest.model_validate({
        "reference": "FIN-TEST-2",
        "montant": "1.00",
        "type_transaction": "recette",
        "date_transaction": "2026-10-02",
    })
    assert validated.type_operation == "ENCAISSEMENT"
    assert validated.date_operation == date(2026, 10, 2)
    with pytest.raises(ValidationError):
        FinanceCreateRequest.model_validate({
            "reference": "FIN-TEST-3",
            "montant": "1.00",
            "type_operation": "ENCAISSEMENT",
            "date_operation": "2026-10-02",
            "montant_xof": "1.00",
        })


@pytest.mark.parametrize(
    "overrides",
    [
        {"type_operation": "VIREMENT"},
        {"type_transaction": "entree"},
        {"montant": "0"},
        {"devise": "xof"},
        {"date_operation": None},
    ],
)
def test_finance_invalid_contract_is_rejected(overrides):
    payload = {
        "reference": "FIN-TEST-4",
        "montant": "20.00",
        "type_operation": "ENCAISSEMENT",
        "date_operation": "2026-10-02",
        "devise": "XOF",
    }
    payload.update(overrides)
    with pytest.raises(ValidationError):
        FinanceCreateRequest.model_validate(payload)
