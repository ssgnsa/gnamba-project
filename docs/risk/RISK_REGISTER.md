---
document: RISK_REGISTER.md
phase: "0"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - ss -tulpn
  - supabase status
  - systemctl --user status cloudflared
  - ~/.cloudflared/config.yml
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Risk Register

## Synthèse

Les risques dominants sont maintenant davantage opérationnels que structurels. Le risque principal n’est plus l’absence totale de tunnel, mais plutôt la dérive de configuration et la présence de ports/origines trop larges.

## Registre

| Risk ID    | Risque                                                                     | Probabilité | Impact | Mitigation                                                                                                       | Statut               |
| ---------- | -------------------------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------- | -------------------- |
| `RISK-001` | Tunnel Cloudflare référencé vers un ancien ID ou un ancien credential file | Moyen       | Élevé  | Garder un seul tunnel `gnamba-web`, vérifier `~/.cloudflared/config.yml`, supprimer les tunnels historiques      | Partiellement réduit |
| `RISK-002` | Page blanche causée par un mauvais origin local ou un proxy cassé          | Moyen       | Élevé  | Tester `localhost`, `REDACTED_LEGACY_HOST`, `https://gnambaservices.ci`, vérifier que `egs-web` écoute sur `:80` | Réduit               |
| `RISK-003` | Services Supabase inutiles encore actifs ou redémarrés par erreur          | Moyen       | Moyen  | Désactiver Studio, Pooler, ImgProxy, Analytics; conserver seulement le socle utile                               | Réduit               |
| `RISK-004` | Ports écoutés sur `0.0.0.0` et exposés au LAN ou à un WAN mal filtré       | Moyen       | Élevé  | Restreindre par firewall, valider qu’aucun port public n’est ouvert, documenter les ports nécessaires            | Ouvert               |
| `RISK-005` | Suppression accidentelle de données utiles lors du nettoyage SOMAGRO       | Faible      | Élevé  | Filtrer strictement les préfixes `somagro*`, backup préalable, rollback par volume/dump                          | Contrôlé             |
| `RISK-006` | Divergence entre runtime réel et documentation                             | Moyen       | Moyen  | Refaire un inventaire après chaque changement important, mettre à jour les docs au fil de l’eau                  | Actif                |

## Seuils d’alerte

- Passer en surveillance renforcée si `program_health_score < 70`
- Stopper immédiatement si `program_health_score < 50`
- Stopper immédiatement si une perte de données est suspectée

## Actions recommandées

1. Garder un seul chemin d’entrée Internet
2. Revalider les ports et les bindings après chaque redémarrage
3. Ne nettoyer que les composants dont le nom commence explicitement par `somagro`
4. Conserver des preuves écrites des suppressions réalisées
