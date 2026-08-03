# Auth normalization result

## Avant

- fichiers utilisés :
  - backend/app/api/v1/auth/__init__.py
  - backend/app/api/v1/auth/router.py
- prefixes :
  - /api/auth (ancien, supprimé)
  - /api/v1/auth (nouveau standard)
- routes :
  - /api/auth/login → /api/v1/auth/login
  - /api/auth/logout → /api/v1/auth/logout
  - /api/auth/me → /api/v1/auth/me
  - /api/auth/refresh → /api/v1/auth/refresh
  - /api/auth/password/reset → /api/v1/auth/password/reset
  - /api/auth/persist-token → /api/v1/auth/persist-token
  - /api/auth/clear-token → /api/v1/auth/clear-token
  - /api/auth/reset-password → /api/v1/auth/reset-password

## Changements

- fichiers modifiés :
  - backend/app/api/v1/auth/__init__.py (normalisé pour réexporter seulement le router)
  - backend/app/api/v1/auth/router.py (prefix confirmé à /api/v1/auth)
  - backend/app/api/v1/__init__.py (import unique du router auth)
  - backend/tests/test_auth_api.py (prefixes mis à jour vers /api/v1/auth)
  - backend/tests/test_v1_api.py (prefixes et mots de passe mis à jour)
  - backend/tests/conftest.py (imports corrigés)
  - backend/tests/test_business_modules.py (imports corrigés)
  - backend/tests/test_media_api.py (imports et prefixes corrigés)
  - backend/tests/test_sqlalchemy_repository.py (imports corrigés)
  - backend/tests/test_v1_compatibility_aliases.py (imports corrigés)
  - backend/tests/test_extended_modules.py (imports corrigés)
- lignes modifiées : ~150 lignes au total

## Après

- prefix final : `/api/v1/auth`
- routes OpenAPI :
  - /api/v1/auth/login
  - /api/v1/auth/logout
  - /api/v1/auth/me
  - /api/v1/auth/refresh
  - /api/v1/auth/password/reset
  - /api/v1/auth/persist-token
  - /api/v1/auth/clear-token
  - /api/v1/auth/reset-password

Aucune route `/api/auth/*` ne subsiste.

## Tests

Import :
OK

Pytest (auth) :
OK (3 passed)

Pytest (v1 api) :
OK (3 passed)

Frontend typecheck :
OK

Frontend lint :
OK (1 warning seulement, sans rapport)