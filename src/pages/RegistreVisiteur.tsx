import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import BrandLogo from "../components/BrandLogo";
import dbClient from '../lib/dbClient.service';
import {
  Visiteur,
  Visite,
  VisiteurFormData,
  VisiteFormData,
  UserProfile,
} from "../types";
import {
  type ManualSyncStatus,
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../lib/manualSyncStore";
import {
  UserPlus,
  Users,
  Search,
  Printer,
  X,
  Check,
  Phone,
  Building,
  FileText,
  Clock,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { FormulaireVisiteur } from "./registre/FormulaireVisiteur";
import SyncRemoteButton from "../components/ui/SyncRemoteButton";
import { apiClient } from "../api/client";
import { isSelfHostedMode } from "../lib/selfHosted";
import { generateUUID } from "../utils/reference";

// ============================================
// PAGE REGISTRE VISITEUR
// ============================================

const VISITEURS_CACHE_KEY = "egs.visiteurs.local_cache.v1";
const VISITES_CACHE_KEY = "egs.visites.local_cache.v1";

type LocalVisiteur = Visiteur & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};
type LocalVisite = Visite & {
  sync_status: ManualSyncStatus;
  sync_error: string | null;
  deleted_at: string | null;
};

function sortVisiteurs(items: LocalVisiteur[]): LocalVisiteur[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function sortVisites(items: LocalVisite[]): LocalVisite[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.date_arrivee).getTime() - new Date(a.date_arrivee).getTime(),
  );
}

export default function RegistreVisiteur() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const goToAccueil = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("egs:navigate", { detail: "accueil" }),
    );
  }, []);

  // Raccourci clavier (Alt + ← pour retour)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goToAccueil();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToAccueil]);

  // États principaux
  const registreTabs = [
    { id: "enregistrement", label: "Nouvelle Visite", icon: UserPlus },
    { id: "en-cours", label: "En Cours", icon: Clock },
    { id: "liste", label: "Historique", icon: FileText },
  ] as const;
  type RegistreTab = (typeof registreTabs)[number]["id"];

  const [activeTab, setActiveTab] = useState<RegistreTab>("enregistrement");
  const [visiteurs, setVisiteurs] = useState<LocalVisiteur[]>([]);
  const [visites, setVisites] = useState<LocalVisite[]>([]);
  const [visitesEnCours, setVisitesEnCours] = useState<LocalVisite[]>([]);
  const [employes, setEmployes] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  // États pour validation en temps réel
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  // Handlers stabilisés pour éviter les re-renders inutiles
  const handleVisiteurFormChange = useCallback(
    (field: keyof VisiteurFormData, value: string) => {
      setVisiteurForm((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [formErrors],
  );

  const handleFieldBlur = useCallback((field: keyof VisiteurFormData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const [photoUploading, setPhotoUploading] = useState(false);

  const uploadPhotoToStorage = async (file: File): Promise<string | null> => {
    setPhotoUploading(true);
    try {
      if (isSelfHostedMode()) {
        const result = await apiClient.media.upload(file, {
          category: "autre",
        });
        if (result.error || !result.data)
          throw new Error(result.error || "Échec de l'upload");
        return result.data.url;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `visiteurs/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await dbClient.storage
        .from("media")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = dbClient.storage.from("media").getPublicUrl(filename);
      await dbClient.from("media_files").insert({
        filename,
        original_name: file.name,
        url: publicUrl,
        category: "autre",
        uploaded_by: user?.id ?? null,
        size: file.size,
        type: file.type,
        alt_text: "",
        description: "",
        tags: [],
      });
      return publicUrl;
    } catch (err) {
      if (import.meta.env.DEV) console.error("Photo upload error:", err);
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  // Formulaire visiteur
  const [visiteurForm, setVisiteurForm] = useState<VisiteurFormData>({
    nom_complet: "",
    type_piece: "CNI",
    numero_piece: "",
    telephone: "",
    email: "",
    societe: "",
    photo_base64: null,
    photo_url: null,
  });

  // Formulaire visite
  const [visiteForm, setVisiteForm] = useState<VisiteFormData>({
    visiteur_id: "",
    motif: "",
    motif_autre: "",
    personne_rencontree_id: "",
    personne_rencontree_nom: "",
    service: "",
    type_visite: "PHYSIQUE",
    observations: "",
  });

  // Webcam
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modal badge
  const [showBadgePreview, setShowBadgePreview] = useState(false);
  const [derniereVisite, setDerniereVisite] = useState<Visite | null>(null);

  // Étape formulaire
  const [etape, setEtape] = useState<1 | 2>(1);

  // Détection doublon
  const [duplicateVisiteur, setDuplicateVisiteur] = useState<Visiteur | null>(
    null,
  );
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [_pendingVisiteCreation, _setPendingVisiteCreation] = useState(false);

  // Charger les données
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cachedVisiteurs = sortVisiteurs(
        readManualCache<LocalVisiteur>(VISITEURS_CACHE_KEY).map((item) => ({
          ...item,
          sync_status: normalizeManualStatus(item.sync_status),
          sync_error: item.sync_error ?? null,
          deleted_at: item.deleted_at ?? null,
        })),
      );
      const cachedVisites = sortVisites(
        readManualCache<LocalVisite>(VISITES_CACHE_KEY).map((item) => ({
          ...item,
          sync_status: normalizeManualStatus(item.sync_status),
          sync_error: item.sync_error ?? null,
          deleted_at: item.deleted_at ?? null,
        })),
      );

      if (cachedVisiteurs.length > 0 || cachedVisites.length > 0) {
        setVisiteurs(cachedVisiteurs);
        setVisites(cachedVisites);
        setVisitesEnCours(
          cachedVisites.filter((visite) => visite.statut === "EN_COURS"),
        );
      } else {
        // Visiteurs existants
        const { data: visData } = await dbClient
          .from("visiteurs")
          .select("*")
          .is("deleted_at", null)
          .order("created_at")
          .limit(100);
        const seededVisiteurs = sortVisiteurs(
          ((visData || []) as Visiteur[]).map((item) => ({
            ...item,
            sync_status: "synced" as const,
            sync_error: null,
            deleted_at: null,
          })),
        );
        if (visData) setVisiteurs(seededVisiteurs);

        // Visites du jour
        const { data: visitesData } = await dbClient
          .from("visites_du_jour")
          .select("*")
          .order("date_arrivee", { ascending: false });
        const seededVisites = sortVisites(
          ((visitesData || []) as Visite[]).map((item) => ({
            ...item,
            sync_status: "synced" as const,
            sync_error: null,
            deleted_at: null,
          })),
        );
        if (visitesData) setVisites(seededVisites);

        // Visites en cours
        const { data: enCoursData } = await dbClient
          .from("visites_en_cours")
          .select("*")
          .order("date_arrivee", { ascending: false });
        const seededEnCours = sortVisites(
          ((enCoursData || []) as Visite[]).map((item) => ({
            ...item,
            sync_status: "synced" as const,
            sync_error: null,
            deleted_at: null,
          })),
        );
        if (enCoursData) setVisitesEnCours(seededEnCours);

        writeManualCache(VISITEURS_CACHE_KEY, seededVisiteurs);
        writeManualCache(VISITES_CACHE_KEY, seededVisites);
      }

      // Employés
      const { data: empData } = await dbClient
        .from("user_profiles")
        .select("*")
        .not("role", "eq", "admin")
        .order("full_name");
      if (empData) setEmployes(empData);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingSyncCount = [
    ...readManualCache<{ sync_status?: string }>(VISITEURS_CACHE_KEY),
    ...readManualCache<{ sync_status?: string }>(VISITES_CACHE_KEY),
  ].filter(
    (item) => normalizeManualStatus(item.sync_status) !== "synced",
  ).length;

  const handleSyncToRemote = async () => {
    if (!user) {
      alert("Vous devez être connecté pour synchroniser.");
      return;
    }

    setSyncing(true);
    try {
      const cachedVisitors = readManualCache<LocalVisiteur>(
        VISITEURS_CACHE_KEY,
      ).map((item) => ({
        ...item,
        sync_status: normalizeManualStatus(item.sync_status),
        sync_error: item.sync_error ?? null,
        deleted_at: item.deleted_at ?? null,
      }));
      const cachedVisits = readManualCache<LocalVisite>(VISITES_CACHE_KEY).map(
        (item) => ({
          ...item,
          sync_status: normalizeManualStatus(item.sync_status),
          sync_error: item.sync_error ?? null,
          deleted_at: item.deleted_at ?? null,
        }),
      );

      const nextVisitors = [...cachedVisitors];
      const nextVisits = [...cachedVisits];

      for (const visitor of cachedVisitors) {
        if (visitor.sync_status === "synced") continue;
        if (visitor.sync_status === "deleted") {
          const { error } = await dbClient
            .from("visiteurs")
            .delete()
            .eq("id", visitor.id);
          if (error) {
            const index = nextVisitors.findIndex(
              (item) => item.id === visitor.id,
            );
            if (index >= 0)
              nextVisitors[index] = {
                ...nextVisitors[index],
                sync_error: error.message,
              };
            continue;
          }
          const index = nextVisitors.findIndex(
            (item) => item.id === visitor.id,
          );
          if (index >= 0) nextVisitors.splice(index, 1);
          continue;
        }

        const payload = {
          id: visitor.id,
          nom_complet: visitor.nom_complet,
          type_piece: visitor.type_piece,
          numero_piece: visitor.numero_piece,
          telephone: visitor.telephone,
          email: visitor.email,
          societe: visitor.societe,
          photo_url: visitor.photo_url || visitor.photo_base64,
          photo_base64: visitor.photo_base64,
          nb_visites: visitor.nb_visites,
          derniere_visite: visitor.derniere_visite,
          created_at: visitor.created_at,
          updated_at: visitor.updated_at,
          created_by: visitor.created_by,
          deleted_at: visitor.deleted_at ?? null,
        };

        const { error } = await dbClient.from("visiteurs").upsert(payload, {
          onConflict: "id",
        });
        if (error) {
          const index = nextVisitors.findIndex(
            (item) => item.id === visitor.id,
          );
          if (index >= 0)
            nextVisitors[index] = {
              ...nextVisitors[index],
              sync_error: error.message,
            };
          continue;
        }
        const index = nextVisitors.findIndex((item) => item.id === visitor.id);
        if (index >= 0) {
          nextVisitors[index] = {
            ...nextVisitors[index],
            sync_status: "synced",
            sync_error: null,
            deleted_at: null,
          };
        }
      }

      for (const visite of cachedVisits) {
        if (visite.sync_status === "synced") continue;
        if (visite.sync_status === "deleted") {
          const { error } = await dbClient
            .from("visites")
            .delete()
            .eq("id", visite.id);
          if (error) {
            const index = nextVisits.findIndex((item) => item.id === visite.id);
            if (index >= 0)
              nextVisits[index] = {
                ...nextVisits[index],
                sync_error: error.message,
              };
            continue;
          }
          const index = nextVisits.findIndex((item) => item.id === visite.id);
          if (index >= 0) nextVisits.splice(index, 1);
          continue;
        }

        const payload = {
          id: visite.id,
          visiteur_id: visite.visiteur_id,
          date_arrivee: visite.date_arrivee,
          date_depart: visite.date_depart,
          motif: visite.motif,
          motif_autre: visite.motif_autre,
          personne_rencontree_id: visite.personne_rencontree_id,
          personne_rencontree_nom: visite.personne_rencontree_nom,
          service: visite.service,
          badge_imprime: visite.badge_imprime,
          badge_imprime_at: visite.badge_imprime_at,
          statut: visite.statut,
          observations: visite.observations,
          signature_numerique: visite.signature_numerique,
          qr_code: visite.qr_code,
          type_visite: visite.type_visite,
          created_at: visite.created_at,
          updated_at: visite.updated_at,
          created_by: visite.created_by,
        };

        const { error } = await dbClient.from("visites").upsert(payload, {
          onConflict: "id",
        });
        if (error) {
          const index = nextVisits.findIndex((item) => item.id === visite.id);
          if (index >= 0)
            nextVisits[index] = {
              ...nextVisits[index],
              sync_error: error.message,
            };
          continue;
        }
        const index = nextVisits.findIndex((item) => item.id === visite.id);
        if (index >= 0) {
          nextVisits[index] = {
            ...nextVisits[index],
            sync_status: "synced",
            sync_error: null,
            deleted_at: null,
          };
        }
      }

      writeManualCache(VISITEURS_CACHE_KEY, sortVisiteurs(nextVisitors));
      writeManualCache(VISITES_CACHE_KEY, sortVisites(nextVisits));
      await fetchData();
      alert("Synchronisation terminée.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la synchronisation.",
      );
    } finally {
      setSyncing(false);
    }
  };

  // Gestion webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      setWebcamStream(stream);
      setShowWebcam(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Impossible d'accéder à la webcam. Vérifiez les permissions.");
      if (import.meta.env.DEV) console.error(err);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        stopWebcam();
        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            const file = new File([blob], `webcam-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const url = await uploadPhotoToStorage(file);
            if (url)
              setVisiteurForm((prev) => ({
                ...prev,
                photo_url: url,
                photo_base64: null,
              }));
          },
          "image/jpeg",
          0.8,
        );
      }
    }
  };

  // Vérifier doublon par numéro de pièce
  const checkDoublon = async (
    numeroPiece: string,
  ): Promise<Visiteur | null> => {
    const localMatch = visiteurs.find(
      (visiteur) =>
        visiteur.numero_piece === numeroPiece &&
        normalizeManualStatus(visiteur.sync_status) !== "deleted",
    );
    return localMatch || null;
  };

  // Sauvegarder visiteur + visite
  const handleEnregistrer = async () => {
    // Validation étape 1 - Visiteur
    if (
      !visiteurForm.nom_complet ||
      !visiteurForm.numero_piece ||
      !visiteurForm.telephone ||
      !visiteurForm.email
    ) {
      alert(
        "Veuillez remplir tous les champs obligatoires (nom, pièce, téléphone, email)",
      );
      return;
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visiteurForm.email)) {
      alert("Veuillez saisir une adresse email valide");
      return;
    }

    // Validation étape 2 - Visite
    if (!visiteForm.motif || !visiteForm.service) {
      alert("Veuillez remplir le motif et le service");
      return;
    }

    // Vérification doublon
    const existing = await checkDoublon(visiteurForm.numero_piece);
    if (existing) {
      setDuplicateVisiteur(existing);
      setShowDuplicateModal(true);
      return;
    }

    // Pas de doublon, créer normalement
    await creerVisiteurEtVisite();
  };

  // Créer un nouveau visiteur et sa visite
  const creerVisiteurEtVisite = async (visiteurId?: string) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      let visiteurData: LocalVisiteur;

      if (visiteurId) {
        // Réutiliser un visiteur existant
        const foundVisiteur = visiteurs.find((v) => v.id === visiteurId);
        if (!foundVisiteur) throw new Error("Visiteur existant introuvable");
        visiteurData = foundVisiteur;
      } else {
        // 1. Créer le visiteur localement
        visiteurData = {
          id: generateUUID(),
          nom_complet: visiteurForm.nom_complet,
          type_piece: visiteurForm.type_piece,
          numero_piece: visiteurForm.numero_piece,
          telephone: visiteurForm.telephone,
          email: visiteurForm.email || null,
          societe: visiteurForm.societe || null,
          photo_url: visiteurForm.photo_url || null,
          photo_base64: visiteurForm.photo_url?.startsWith("data:")
            ? visiteurForm.photo_url
            : null,
          nb_visites: 0,
          derniere_visite: null,
          created_by: user?.id ?? null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          sync_status: "pending",
          sync_error: null,
        };
        const cachedVisitors =
          readManualCache<LocalVisiteur>(VISITEURS_CACHE_KEY);
        writeManualCache(
          VISITEURS_CACHE_KEY,
          sortVisiteurs(cachedVisitors.concat(visiteurData)),
        );
        setVisiteurs((prev) => sortVisiteurs(prev.concat(visiteurData)));
      }

      // 2. Créer la visite localement
      const visiteData: LocalVisite = {
        id: generateUUID(),
        visiteur_id: visiteurData.id,
        date_arrivee: now,
        date_depart: null,
        motif: visiteForm.motif,
        motif_autre: visiteForm.motif_autre || null,
        personne_rencontree_id: visiteForm.personne_rencontree_id || null,
        personne_rencontree_nom: visiteForm.personne_rencontree_nom || null,
        service: visiteForm.service,
        badge_imprime: false,
        badge_imprime_at: null,
        statut: "EN_COURS",
        observations: visiteForm.observations || null,
        signature_numerique: null,
        qr_code: null,
        type_visite: visiteForm.type_visite,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        visiteurs: {
          nom_complet: visiteurData.nom_complet,
          telephone: visiteurData.telephone,
          photo_url: visiteurData.photo_url,
          photo_base64: visiteurData.photo_base64,
        },
        sync_status: "pending",
        sync_error: null,
        deleted_at: null,
      };

      const cachedVisits = readManualCache<LocalVisite>(VISITES_CACHE_KEY);
      writeManualCache(
        VISITES_CACHE_KEY,
        sortVisites(cachedVisits.concat(visiteData)),
      );
      setVisites((prev) => sortVisites(prev.concat(visiteData)));
      setVisitesEnCours((prev) => sortVisites(prev.concat(visiteData)));

      const updatedVisitors = visiteurs.map((item) =>
        item.id === visiteurData.id
          ? {
              ...item,
              nb_visites: (item.nb_visites || 0) + 1,
              derniere_visite: now,
              updated_at: now,
              sync_status:
                normalizeManualStatus(item.sync_status) === "synced"
                  ? "pending"
                  : normalizeManualStatus(item.sync_status),
            }
          : item,
      );
      setVisiteurs(sortVisiteurs(updatedVisitors));
      writeManualCache(VISITEURS_CACHE_KEY, sortVisiteurs(updatedVisitors));

      setDerniereVisite(visiteData);
      setShowBadgePreview(true);

      // Reset form
      setVisiteurForm({
        nom_complet: "",
        type_piece: "CNI",
        numero_piece: "",
        telephone: "",
        email: "",
        societe: "",
        photo_base64: null,
        photo_url: null,
      });
      setVisiteForm({
        visiteur_id: "",
        motif: "",
        motif_autre: "",
        personne_rencontree_id: "",
        personne_rencontree_nom: "",
        service: "",
        type_visite: "PHYSIQUE",
        observations: "",
      });
      setEtape(1);

      // Rafraîchir les données
      fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      if (import.meta.env.DEV) console.error("Erreur enregistrement:", error);
      alert("Erreur lors de l'enregistrement: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Gérer le choix du doublon
  const handleDuplicateChoice = async (choice: "reuse" | "create_new") => {
    setShowDuplicateModal(false);

    if (choice === "reuse") {
      // Réutiliser le visiteur existant
      if (duplicateVisiteur) {
        await creerVisiteurEtVisite(duplicateVisiteur.id);
      }
    } else {
      // Créer un nouveau visiteur malgré le doublon
      await creerVisiteurEtVisite();
    }

    setDuplicateVisiteur(null);
  };

  // Imprimer badge
  const imprimerBadge = (visite: Visite) => {
    const badgeWindow = window.open("", "_blank", "width=400,height=600");
    if (!badgeWindow) {
      alert("Veuillez autoriser les fenêtres popup");
      return;
    }

    const visiteur = visiteurs.find((v) => v.id === visite.visiteur_id);
    const photoSrc = visiteur?.photo_base64 || visiteur?.photo_url;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Badge Visiteur - ${visiteur?.nom_complet || "Visiteur"}</title>
  <style>
    @page { size: 105mm 148mm; margin: 0; }
    body { 
      font-family: Arial, sans-serif; 
      width: 105mm; 
      height: 148mm; 
      margin: 0; 
      padding: 5mm;
      box-sizing: border-box;
      border: 2px solid #2C3E50;
    }
    .header { 
      text-align: center; 
      border-bottom: 2px solid #3498DB; 
      padding-bottom: 3mm; 
      margin-bottom: 3mm;
    }
    .header h1 { 
      font-size: 16pt; 
      margin: 0; 
      color: #2C3E50;
    }
    .header p { 
      font-size: 10pt; 
      margin: 2px 0; 
      color: #7f8c8d;
    }
    .photo-section { 
      text-align: center; 
      margin: 3mm 0;
    }
    .photo { 
      width: 30mm; 
      height: 40mm; 
      border: 2px solid #3498DB; 
      border-radius: 5px;
      object-fit: cover;
      background: #ecf0f1;
    }
    .info { 
      font-size: 10pt; 
      line-height: 1.6; 
      margin: 3mm 0;
    }
    .info strong { 
      color: #2C3E50;
    }
    .footer { 
      margin-top: 5mm; 
      border-top: 1px dashed #ccc; 
      padding-top: 3mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .qr-code {
      width: 20mm;
      height: 20mm;
      background: #2C3E50;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 8pt;
    }
    .validite { 
      font-size: 8pt; 
      text-align: right; 
      color: #7f8c8d;
    }
    .disclaimer {
      position: absolute;
      bottom: 3mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 7pt;
      color: #95a5a6;
      font-style: italic;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GNAMBA SERVICES</h1>
    <p>RÉGION AGNÉBY-TIASSA</p>
    <p style="font-size: 12pt; font-weight: bold; color: #3498DB;">VISITEUR</p>
  </div>
  
  <div class="photo-section">
    ${
      photoSrc
        ? `<img src="${photoSrc}" class="photo" alt="Photo">`
        : `<div class="photo" style="display:flex;align-items:center;justify-content:center;color:#95a5a6;">Photo</div>`
    }
  </div>
  
  <div class="info">
    <p><strong>${visiteur?.nom_complet || "Visiteur"}</strong></p>
    ${visiteur?.societe ? `<p>Société: ${visiteur.societe}</p>` : ""}
    <p>Rencontre: ${visite.personne_rencontree_nom || visite.service}</p>
    <p>Service: <strong>${visite.service}</strong></p>
    <p>Motif: ${visite.motif}</p>
    <p>Date: ${new Date(visite.date_arrivee).toLocaleString("fr-FR")}</p>
    <p>Réf: ${visite.id.substring(0, 8).toUpperCase()}</p>
  </div>
  
  <div class="footer">
    <div class="qr-code">QR CODE</div>
    <div class="validite">
      <p>Valable le: ${new Date().toLocaleDateString("fr-FR")}</p>
      <p>Signature:</p>
    </div>
  </div>
  
  <div class="disclaimer">À porter visiblement. À restituer à la sortie.</div>
  
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    badgeWindow.document.write(html);
    badgeWindow.document.close();
  };

  // Enregistrer départ
  const enregistrerDepart = async (visiteId: string) => {
    if (!confirm("Confirmer le départ du visiteur ?")) return;
    const now = new Date().toISOString();
    const nextVisits = visites.map((visite) =>
      visite.id === visiteId
        ? {
            ...visite,
            statut: "TERMINEE" as const,
            date_depart: now,
            updated_at: now,
            sync_status:
              normalizeManualStatus(visite.sync_status) === "synced"
                ? "pending"
                : normalizeManualStatus(visite.sync_status),
          }
        : visite,
    );
    writeManualCache(VISITES_CACHE_KEY, sortVisites(nextVisits));
    setVisites(sortVisites(nextVisits));
    setVisitesEnCours(
      nextVisits.filter((visite) => visite.statut === "EN_COURS"),
    );
  };

  // Filtrer les visites
  const filteredVisites = visites.filter((v) => {
    const matchSearch =
      !searchTerm ||
      v.visiteurs?.nom_complet
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      v.personne_rencontree_nom
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || v.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const motifsOptions = useMemo(
    () => [
      { value: "RENDEZ_VOUS", label: "Rendez-vous" },
      { value: "DEMARCHE_ADMIN", label: "Démarche administrative" },
      { value: "LIVRAISON", label: "Livraison" },
      { value: "PRESTATION", label: "Prestation de service" },
      { value: "VISITE_COURTOISIE", label: "Visite de courtoisie" },
      { value: "ENTRETIEN", label: "Entretien professionnel" },
      { value: "AUTRE", label: "Autre" },
    ],
    [],
  );

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const logoInitials = useMemo(
    () => (settings.app_title || "EG").slice(0, 2).toUpperCase(),
    [settings.app_title],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du registre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToAccueil}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Retour à l'accueil employé (Alt + ←)"
              >
                <ChevronLeft size={18} className="text-gray-600" />
                <span className="hidden sm:inline text-sm">Accueil</span>
              </button>

              {/* Logo */}
              <BrandLogo
                tone="light"
                alt="Logo"
                className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                fallback={
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {logoInitials}
                    </span>
                  </div>
                }
              />

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Registre Visiteur
                </h1>
                <p className="text-sm text-gray-500">
                  Gestion des visites et badges
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {visitesEnCours.length > 0 && (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {visitesEnCours.length} visite(s) en cours
                </div>
              )}
              <SyncRemoteButton
                pendingCount={pendingSyncCount}
                syncing={syncing}
                onClick={() => void handleSyncToRemote()}
                size="compact"
              />
            </div>
          </div>
        </div>
      </div>

      {pendingSyncCount > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {pendingSyncCount} élément{pendingSyncCount > 1 ? "s" : ""} en
            attente de synchronisation.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          {registreTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto">
        {/* ENREGISTREMENT */}
        {activeTab === "enregistrement" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Étape 1: Informations Visiteur */}
              {etape === 1 && (
                <FormulaireVisiteur
                  visitorForm={visiteurForm}
                  onFormChange={handleVisiteurFormChange}
                  photoUploading={photoUploading}
                  onPhotoDelete={() =>
                    setVisiteurForm((prev) => ({
                      ...prev,
                      photo_url: null,
                      photo_base64: null,
                    }))
                  }
                  onPhotoUpload={async (file: File) => {
                    const url = await uploadPhotoToStorage(file);
                    if (url)
                      setVisiteurForm((prev) => ({
                        ...prev,
                        photo_url: url,
                        photo_base64: null,
                      }));
                  }}
                  onStartWebcam={startWebcam}
                  onNext={() => setEtape(2)}
                  errors={formErrors}
                  touched={touchedFields}
                  onFieldBlur={handleFieldBlur}
                />
              )}

              {/* Étape 2: Informations Visite */}
              {etape === 2 && (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <FileText size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Détails de la Visite
                      </h2>
                      <p className="text-xs text-gray-500">Étape 2 sur 2</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Type de visite */}
                    <div>
                      <label className={labelClass}>Type de visite</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            "PHYSIQUE",
                            "TELEPHONE",
                          ] as VisiteFormData["type_visite"][]
                        ).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setVisiteForm((prev) => ({
                                ...prev,
                                type_visite: type,
                              }))
                            }
                            className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                              visiteForm.type_visite === type
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            aria-label={
                              type === "PHYSIQUE"
                                ? "Visite physique"
                                : "Appel téléphonique"
                            }
                          >
                            {type === "PHYSIQUE" ? (
                              <>
                                <Building size={18} aria-hidden="true" />
                                <span>Visite physique</span>
                              </>
                            ) : (
                              <>
                                <Phone size={18} aria-hidden="true" />
                                <span>Appel téléphonique</span>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motif */}
                    <div>
                      <label className={labelClass}>Motif de la visite *</label>
                      <select
                        value={visiteForm.motif}
                        onChange={(e) =>
                          setVisiteForm((prev) => ({
                            ...prev,
                            motif: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="">Sélectionner un motif</option>
                        {motifsOptions.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {visiteForm.motif === "AUTRE" && (
                      <div>
                        <label className={labelClass}>Préciser le motif</label>
                        <input
                          type="text"
                          value={visiteForm.motif_autre}
                          onChange={(e) =>
                            setVisiteForm((prev) => ({
                              ...prev,
                              motif_autre: e.target.value,
                            }))
                          }
                          className={inputClass}
                          placeholder="Décrivez le motif..."
                        />
                      </div>
                    )}

                    {/* Service */}
                    <div>
                      <label className={labelClass}>Service à visiter *</label>
                      <select
                        value={visiteForm.service}
                        onChange={(e) =>
                          setVisiteForm((prev) => ({
                            ...prev,
                            service: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="">Sélectionner un service</option>
                        <option value="DIRECTION">Direction Générale</option>
                        <option value="FONCIER">Service Foncier</option>
                        <option value="IMMOBILIER">Service Immobilier</option>
                        <option value="FINANCES">Service Finances</option>
                        <option value="BTP">Service BTP / Projets</option>
                        <option value="RH">Ressources Humaines</option>
                        <option value="ACCUEIL">Accueil / Standard</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>

                    {/* Personne rencontrée */}
                    <div>
                      <label className={labelClass}>Personne rencontrée</label>
                      <select
                        value={visiteForm.personne_rencontree_id}
                        onChange={(e) => {
                          const emp = employes.find(
                            (emp) => emp.id === e.target.value,
                          );
                          setVisiteForm((prev) => ({
                            ...prev,
                            personne_rencontree_id: e.target.value,
                            personne_rencontree_nom: emp?.full_name || "",
                          }));
                        }}
                        className={inputClass}
                      >
                        <option value="">Sélectionner (optionnel)</option>
                        {employes.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Observations */}
                    <div>
                      <label className={labelClass}>Observations</label>
                      <textarea
                        value={visiteForm.observations}
                        onChange={(e) =>
                          setVisiteForm((prev) => ({
                            ...prev,
                            observations: e.target.value,
                          }))
                        }
                        className={`${inputClass} resize-none`}
                        rows={3}
                        placeholder="Informations complémentaires..."
                      />
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEtape(1)}
                        className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft size={18} />
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={handleEnregistrer}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Enregistrer la visite
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Visites en cours */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  Visites en cours
                </h3>

                {visitesEnCours.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune visite en cours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visitesEnCours.map((visite) => (
                      <div
                        key={visite.id}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-gray-900 text-sm">
                            {visite.visiteurs?.nom_complet}
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {visite.service} •{" "}
                          {new Date(visite.date_arrivee).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => enregistrerDepart(visite.id)}
                          className="w-full px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          Enregistrer départ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats rapides */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-md p-5 text-white">
                <h3 className="font-bold mb-4">Statistiques du jour</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Total visiteurs</span>
                    <span className="text-2xl font-bold">{visites.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">En cours</span>
                    <span className="text-2xl font-bold">
                      {visitesEnCours.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Terminées</span>
                    <span className="text-2xl font-bold">
                      {visites.filter((v) => v.statut === "TERMINEE").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISITES EN COURS */}
        {activeTab === "en-cours" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Visites en cours
              </h2>
              <p className="text-sm text-gray-500">Gérez les visites actives</p>
            </div>

            {visitesEnCours.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p>Aucune visite en cours</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visitesEnCours.map((visite) => {
                  const photoUrl =
                    visite.visiteurs?.photo_base64 ||
                    visite.visiteurs?.photo_url;
                  return (
                    <div
                      key={visite.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={visite.visiteurs?.nom_complet}
                              crossOrigin="anonymous"
                              className="w-16 h-20 object-cover rounded-xl border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Users size={24} className="text-gray-400" />
                            </div>
                          )}

                          <div>
                            <h3 className="font-bold text-gray-900">
                              {visite.visiteurs?.nom_complet}
                            </h3>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-2">
                                <Phone size={14} />
                                {visite.visiteurs?.telephone}
                              </span>
                            </div>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building size={12} />
                                {visite.service}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(visite.date_arrivee).toLocaleString(
                                  "fr-FR",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDerniereVisite(visite);
                              setShowBadgePreview(true);
                            }}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                          >
                            <Printer size={16} />
                            Badge
                          </button>
                          <button
                            type="button"
                            onClick={() => enregistrerDepart(visite.id)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <Check size={16} />
                            Départ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORIQUE */}
        {activeTab === "liste" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Historique des visites
                  </h2>
                  <p className="text-sm text-gray-500">
                    Consultez toutes les visites enregistrées
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
                  >
                    <option value="">Tous statuts</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINEE">Terminée</option>
                    <option value="ANNULEE">Annulée</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredVisites.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p>Aucune visite trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full egs-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Visiteur
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Service
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Motif
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Arrivée
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Statut
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVisites.map((visite) => {
                      const photoUrl =
                        visite.visiteurs?.photo_base64 ||
                        visite.visiteurs?.photo_url;
                      return (
                        <tr
                          key={visite.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt=""
                                  crossOrigin="anonymous"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Users size={18} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {visite.visiteurs?.nom_complet}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {visite.visiteurs?.telephone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {visite.service}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {visite.motif}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(visite.date_arrivee).toLocaleString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                visite.statut === "EN_COURS"
                                  ? "bg-green-100 text-green-700"
                                  : visite.statut === "TERMINEE"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {visite.statut === "EN_COURS"
                                ? "En cours"
                                : visite.statut === "TERMINEE"
                                  ? "Terminée"
                                  : "Annulée"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              {visite.statut === "EN_COURS" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDerniereVisite(visite);
                                      setShowBadgePreview(true);
                                    }}
                                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                    title="Imprimer badge"
                                  >
                                    <Printer size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => enregistrerDepart(visite.id)}
                                    className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                                    title="Enregistrer départ"
                                  >
                                    <Check size={16} />
                                  </button>
                                </>
                              )}
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
        )}
      </div>

      {/* Modal Webcam */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Prendre une photo</h3>
              <button
                type="button"
                onClick={stopWebcam}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-xl bg-gray-900"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={stopWebcam}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
              >
                Capturer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détection Doublon */}
      {showDuplicateModal && duplicateVisiteur && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                <AlertTriangle size={22} className="text-amber-600" />
                Visiteur existant détecté
              </h3>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 mb-3">
                Un visiteur avec le même numéro de pièce (
                <strong>{duplicateVisiteur.numero_piece}</strong>) existe déjà :
              </p>

              <div className="flex items-start gap-4">
                {duplicateVisiteur.photo_base64 ||
                duplicateVisiteur.photo_url ? (
                  <img
                    src={
                      duplicateVisiteur.photo_base64 ||
                      duplicateVisiteur.photo_url ||
                      ""
                    }
                    alt={duplicateVisiteur.nom_complet}
                    className="w-16 h-20 object-cover rounded-xl border-2 border-amber-300"
                  />
                ) : (
                  <div className="w-16 h-20 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-amber-400" />
                  </div>
                )}

                <div className="text-sm text-amber-900">
                  <p className="font-bold text-base mb-1">
                    {duplicateVisiteur.nom_complet}
                  </p>
                  <p className="text-amber-700">
                    Tél : {duplicateVisiteur.telephone}
                  </p>
                  {duplicateVisiteur.email && (
                    <p className="text-amber-700">
                      Email : {duplicateVisiteur.email}
                    </p>
                  )}
                  {duplicateVisiteur.societe && (
                    <p className="text-amber-700">
                      Société : {duplicateVisiteur.societe}
                    </p>
                  )}
                  {duplicateVisiteur.derniere_visite && (
                    <p className="text-amber-600 mt-1 text-xs">
                      Dernière visite :{" "}
                      {new Date(
                        duplicateVisiteur.derniere_visite,
                      ).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <p className="text-amber-600 text-xs">
                    Nombre de visites : {duplicateVisiteur.nb_visites || 0}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Que souhaitez-vous faire ?
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDuplicateChoice("reuse")}
                disabled={saving}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Utiliser ce visiteur existant
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("create_new")}
                disabled={saving}
                className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Créer un nouveau visiteur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Badge Preview */}
      {showBadgePreview && derniereVisite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Visite enregistrée !</h3>
              <button
                type="button"
                onClick={() => setShowBadgePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={32} className="text-green-600" />
              </div>
              <p className="text-gray-700">
                La visite de{" "}
                <strong>{derniereVisite.visiteurs?.nom_complet}</strong> a été
                enregistrée avec succès.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBadgePreview(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => imprimerBadge(derniereVisite)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimer badge
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
