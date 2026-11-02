/**
 * DATA LAYER — Foncier Repository
 * Réexport du repository canonique défini dans lib/dbClient.service.
 * Conservé pour rétrocompatibilité avec les 12 importateurs existants.
 * Aucune logique de délégation dupliquée : foncierRepository est l'unique source.
 */
export { foncierRepository } from "../lib/dbClient.service";
