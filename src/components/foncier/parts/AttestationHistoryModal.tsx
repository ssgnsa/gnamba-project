import { FC, useState, useEffect, useCallback } from "react";
import { FileText, Printer, ExternalLink } from "lucide-react";
import dbClient from "@/lib/dbClient.service";
import Badge from "@/components/ui/Badge";
import { formatDateLong } from "@/utils/reference";
import { printAttestationCoutumiere, printAttestationAnnex } from "@/utils/print";
import type { AttestationFull } from "../FoncierConstants";
import { getAttestationStatusInfo, buildAttestationVerificationUrl, FONCIER_ATTESTATION_WITH_TEMOINS_SELECT } from "../FoncierConstants";
import { getUsageForSlot } from "@/lib/mediaUtils";

interface AttestationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: {
    id: string;
    reference: string;
    numero_lot: string;
    village: string;
    statut?: string | null;
    deleted_at?: string | null;
  } | null;
  isLoading?: boolean;
  profile?: { id?: string | null; full_name?: string | null } | null;
  accessLevel?: string;
  canManage?: boolean;
  isOnline?: boolean;
  _isLoading?: boolean;
  _profile?: { id?: string | null; full_name?: string | null } | null;
  _accessLevel?: string;
  _canManage?: boolean;
  _isOnline?: boolean;
}

export const AttestationHistoryModal: FC<AttestationHistoryModalProps> = ({
  isOpen,
  onClose,
  lot,
  profile,
  _profile,
  isLoading,
}) => {
  const [records, setRecords] = useState<AttestationFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<Record<string, { url: string; original_name: string }>>({});
  const effectiveLoading = isLoading || loading;

  const fetchHistory = useCallback(async () => {
    if (!lot) return;
    setLoading(true);
    setError(null);
    
    try {
      // Use the specialized select with witnesses
      const baseQuery = dbClient
        .from("foncier_attestations")
        .select(FONCIER_ATTESTATION_WITH_TEMOINS_SELECT)
        .eq("lot_id", lot.id)
        .order("created_at", { ascending: false });

      let result = await baseQuery.is("deleted_at", null);
      
      if (result.error && result.error.code === "42703") {
        result = await baseQuery;
      }

      if (result.error) throw result.error;
      
      const data = result.data || [];
      setRecords(data);
      
      // Fetch scans for each attestation
      const scanPromises = data.map(async (att: AttestationFull) => {
        try {
          const scan = await getUsageForSlot("foncier_attestation", att.id, "attestation_scan");
          return { id: att.id, scan };
        } catch {
          return { id: att.id, scan: null };
        }
      });
      
      const scanResults = await Promise.all(scanPromises);
      const scanMap: Record<string, { url: string; original_name: string }> = {};
      scanResults.forEach(({ id, scan }) => {
        if (scan) scanMap[id] = { url: scan.url, original_name: scan.original_name };
      });
      setScans(scanMap);
    } catch (err: any) {
      console.error("Error fetching attestation history:", err);
      setError(err.message || "Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  }, [lot]);

  useEffect(() => {
    if (isOpen && lot) {
      fetchHistory();
    } else {
      setRecords([]);
      setScans({});
    }
  }, [isOpen, lot, fetchHistory]);

  const handlePrint = async (record: AttestationFull) => {
    const currentProfile = profile ?? _profile;
    if (!lot || !currentProfile) return;
    try {
      // Build data for printing
      const attestationData = {
        reference: record.reference,
        numero_enregistrement: record.numero_enregistrement,
        date_etablissement: record.date_etablissement,
        original: record.original,
        statut: record.statut,
        mode_acquisition: record.mode_acquisition,
        historique_possession: record.historique_possession,
        domicile: record.domicile,
        limites_nord: record.limites_nord,
        limites_sud: record.limites_sud,
        limites_est: record.limites_est,
        limites_ouest: record.limites_ouest,
        gps_lat: record.gps_lat,
        gps_lng: record.gps_lng,
        gps_precision: record.gps_precision,
        gps_points: record.gps_points,
        registre_volume: record.registre_volume,
        registre_page: record.registre_page,
        registre_ligne: record.registre_ligne,
        control_number: record.control_number,
        qr_payload: record.qr_payload,
        hash_sha256: record.hash_sha256,
        validation_agent_nom: record.validation_agent_nom,
        validation_chef_nom: record.validation_chef_nom,
        type: record.type,
        chef_empreinte_url: record.chef_empreinte_url,
        cedant_nom: record.cedant_nom,
        cedant_prenom: record.cedant_prenom,
        cedant_cni_numero: record.cedant_cni_numero,
        cedant_telephone: record.cedant_telephone,
        cedant_domicile: record.cedant_domicile,
      };
      
      await printAttestationCoutumiere({ ...attestationData, lot: lot as any, config: {} as any, temoins: record.foncier_attestation_temoins || [], signatureUrl: undefined, cachetUrl: [], logoUrl: "" } as unknown as import("@/utils/print").AttestationCoutumiereData);
    } catch (err) {
      console.error("Print error:", err);
    }
  };

  const handlePrintAnnex = async (record: AttestationFull) => {
    if (!lot) return;
    try {
      const attestationData = {
        reference: record.reference,
        numero_enregistrement: record.numero_enregistrement,
        date_etablissement: record.date_etablissement,
        original: record.original,
        statut: record.statut,
        mode_acquisition: record.mode_acquisition,
        historique_possession: record.historique_possession,
        domicile: record.domicile,
        limites_nord: record.limites_nord,
        limites_sud: record.limites_sud,
        limites_est: record.limites_est,
        limites_ouest: record.limites_ouest,
        gps_lat: record.gps_lat,
        gps_lng: record.gps_lng,
        gps_precision: record.gps_precision,
        gps_points: record.gps_points,
        registre_volume: record.registre_volume,
        registre_page: record.registre_page,
        registre_ligne: record.registre_ligne,
        control_number: record.control_number,
        qr_payload: record.qr_payload,
        hash_sha256: record.hash_sha256,
        validation_agent_nom: record.validation_agent_nom,
        validation_chef_nom: record.validation_chef_nom,
        type: record.type,
        chef_empreinte_url: record.chef_empreinte_url,
        cedant_nom: record.cedant_nom,
        cedant_prenom: record.cedant_prenom,
        cedant_cni_numero: record.cedant_cni_numero,
        cedant_telephone: record.cedant_telephone,
        cedant_domicile: record.cedant_domicile,
      };
      
      await printAttestationAnnex({ ...attestationData, lot: lot as any, config: {} as any, temoins: record.foncier_attestation_temoins || [], signatureUrl: undefined, cachetUrl: [], logoUrl: "" } as unknown as import("@/utils/print").AttestationCoutumiereData);
    } catch (err) {
      console.error("Print annex error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">Historique des attestations</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {lot && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <span className="font-semibold">Lot:</span> {lot.numero_lot} · {lot.village}
                <span className="mx-2 text-gray-400">|</span>
                <span className="font-semibold">Réf parcelle:</span> {lot.reference}
                <span className="mx-2 text-gray-400">|</span>
                <span className="font-semibold">Statut:</span> {lot.statut || "actif"}
              </div>
            )}

            {effectiveLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FileText size={48} className="mb-2 opacity-50" />
                <p className="text-sm">Aucune attestation disponible pour ce lot.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full egs-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Version</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Référence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Enregistrement</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Scan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record) => {
                      const statusInfo = getAttestationStatusInfo(record);
                      const scan = scans[record.id];
                      const dateLabel = record.date_etablissement || record.created_at;

                      return (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700">V{record.version || 1}</td>
                          <td className="px-4 py-3 table-key">{record.reference}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDateLong(dateLabel)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{record.type || "standard"}</td>
                          <td className="px-4 py-3">
                            <Badge label={statusInfo.label} color={statusInfo.color} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.numero_enregistrement || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {scan ? (
                              <a href={scan.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                {scan.original_name || "Ouvrir"}
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => handlePrint(record)}
                                title="Imprimer attestation"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <Printer size={15} />
                              </button>
                              <button
                                onClick={() => handlePrintAnnex(record)}
                                title="Imprimer annexe technique"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                <FileText size={15} />
                              </button>
                              <a
                                href={buildAttestationVerificationUrl({
                                  reference: record.reference,
                                  control_number: record.control_number,
                                  hash_sha256: record.hash_sha256,
                                })}
                                target="_blank"
                                rel="noreferrer"
                                title="Vérification publique"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <ExternalLink size={15} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}