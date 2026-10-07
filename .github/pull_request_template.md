# Titre

Epic X - PR NN - Description courte

## Objectif

Decrire le probleme traite et le resultat attendu.

## Perimetre

- Module concerne:
- Fichiers principaux:
- Hors perimetre:

## Criteres d'entree

- [ ] Epic identifie
- [ ] Perimetre limite
- [ ] Rollback possible
- [ ] Tests a executer listes
- [ ] Impact runtime compris

## Impact

- Frontend:
- Backend:
- PostgreSQL/Alembic:
- Docker/infra:
- Documentation:
- Supabase/legacy:

## Rollback

Decrire comment revenir a l'etat precedent.

## Tests executes

Frontend:

- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test`

Backend:

- [ ] `python -m compileall backend/app`
- [ ] `cd backend && pytest`

Infrastructure:

- [ ] `docker compose -f docker-compose.selfhosted.yml config`
- [ ] `docker compose -f backend/docker-compose.yml config`

Securite:

- [ ] secret scan
- [ ] dependency audit

## Resultat

Resumer les validations et les ecarts restants.

## Suppression legacy

Si cette PR supprime quelque chose:

- [ ] `rg "<nom>" .` retourne 0 consommateur runtime
- [ ] aucun import actif
- [ ] aucune route active
- [ ] aucun test dependant
- [ ] build vert
- [ ] tests verts
- [ ] rollback disponible

Sinon:

- [ ] aucune suppression legacy dans cette PR

## Dette restante

Lister ce qui doit etre traite dans la PR suivante.

