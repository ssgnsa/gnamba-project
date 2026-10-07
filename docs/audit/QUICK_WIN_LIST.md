---
document: QUICK_WIN_LIST.md
phase: "0ter"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - PROGRESS_STATE.json
  - docker ps -a
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

# Quick Win List

## Objectif

Conserver uniquement les actions à fort effet de levier, réalisables rapidement et réduisant le risque immédiat.

## Liste

| ID      | Action                                                                                         | Statut  | Durée | Risque réduit                                                | Validation                       |
| ------- | ---------------------------------------------------------------------------------------------- | ------- | ----- | ------------------------------------------------------------ | -------------------------------- |
| `QW-01` | Garder un seul tunnel Cloudflare `gnamba-web` et supprimer les références historiques          | Fait    | < 1h  | Réduit les erreurs de routage et les vieux credentials       | `cloudflared tunnel list`        |
| `QW-02` | Servir EGS Studio sur `:80` et tester `localhost`, `REDACTED_LEGACY_HOST` et le domaine public | Fait    | < 1h  | Élimine le doute sur le reverse proxy et le port cible       | `curl` retourne `200`            |
| `QW-03` | Désactiver les sidecars Supabase non nécessaires (`studio`, `pooler`, `imgproxy`, `analytics`) | Fait    | < 1h  | Réduit la surface d’attaque et la consommation de ressources | `supabase status`                |
| `QW-04` | Capturer l’état de base dans les docs d’audit et de sécurité                                   | Fait    | < 2h  | Évite les décisions prises à partir d’une mémoire floue      | Présence des fichiers de cadrage |
| `QW-05` | Ajouter un smoke test automatisé pour `80`, `54321`, `54322`, `54324`, `8081`                  | À faire | < 2h  | Détecte vite les régressions de port ou de proxy             | Script + exécution réussie       |

## Commentaire

Les quick wins déjà réalisés ont surtout supprimé l’ambiguïté. Le prochain gain utile est un test de santé automatisé pour figer l’état fonctionnel.
