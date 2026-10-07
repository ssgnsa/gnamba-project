/**
 * DOMAIN LAYER — Foncier Rules
 * Source unique des règles métier foncières.
 * Aucune dépendance React, aucun appel réseau.
 * Testable indépendamment.
 */

export type LotStatut =
  | 'actif'
  | 'reserve'
  | 'vendu'
  | 'litige'
  | 'annule';

export type AttestationStatut =
  | 'brouillon'
  | 'valide'
  | 'signe'
  | 'revoque'
  | 'expire';

export interface LotForRules {
  statut: LotStatut;
  is_verified?: boolean;
  proprietaire_nom?: string | null;
  deleted_at?: string | null;
  attestation_statut?: AttestationStatut | null;
}

export const foncierRules = {
  /**
   * Un lot peut être vendu seulement s'il est actif, non archivé et vérifié
   */
  canSellLot(lot: LotForRules): boolean {
    return (
      lot.statut === 'actif' &&
      lot.deleted_at == null &&
      lot.is_verified === true
    );
  },

  /**
   * Un lot peut être archivé si non vendu
   */
  canArchiveLot(lot: LotForRules): boolean {
    return lot.statut !== 'vendu' && lot.deleted_at == null;
  },

  /**
   * Un lot peut recevoir une attestation si le propriétaire est renseigné
   */
  canIssueAttestation(lot: LotForRules): boolean {
    return (
      lot.statut !== 'annule' &&
      lot.deleted_at == null &&
      Boolean(lot.proprietaire_nom?.trim())
    );
  },

  /**
   * Une attestation peut être révoquée si elle est signée ou valide
   */
  canRevokeAttestation(statut: AttestationStatut): boolean {
    return statut === 'signe' || statut === 'valide';
  },

  /**
   * Transfert de propriété valide entre deux propriétaires différents
   */
  isValidTransfer(fromOwner: string, toOwner: string): boolean {
    return (
      fromOwner.trim().length > 0 &&
      toOwner.trim().length > 0 &&
      fromOwner.trim().toLowerCase() !== toOwner.trim().toLowerCase()
    );
  },

  /**
   * Superficie valide (entre 1 m² et 10 ha)
   */
  isValidSuperficie(superficieM2: number): boolean {
    return superficieM2 >= 1 && superficieM2 <= 100_000;
  },

  /**
   * Retourne le label lisible du statut
   */
  statutLabel(statut: LotStatut): string {
    const labels: Record<LotStatut, string> = {
      actif: 'Actif',
      reserve: 'Réservé',
      vendu: 'Vendu',
      litige: 'En litige',
      annule: 'Annulé',
    };
    return labels[statut] ?? statut;
  },

  /**
   * Couleur badge du statut pour l'UI (Tailwind classes)
   */
  statutBadgeClass(statut: LotStatut): string {
    const classes: Record<LotStatut, string> = {
      actif: 'bg-green-100 text-green-800',
      reserve: 'bg-yellow-100 text-yellow-800',
      vendu: 'bg-blue-100 text-blue-800',
      litige: 'bg-red-100 text-red-800',
      annule: 'bg-gray-200 text-gray-500',
    };
    return classes[statut] ?? 'bg-gray-100 text-gray-600';
  },
};
