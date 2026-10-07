from app.schemas.entity import EntitySearchParams


def test_entity_search_params_accepts_phone_email_company_filter_fields():
    params = EntitySearchParams(
        search="dupont",
        type="client",
        subtype="particulier",
        status="active",
        has_phone=True,
        has_email=False,
        has_company=True,
        limit=10,
        offset=0,
    )

    assert params.has_phone is True
    assert params.has_email is False
    assert params.has_company is True
