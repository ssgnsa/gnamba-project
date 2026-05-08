import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  File,
  Copy,
  Check,
  ExternalLink,
  Edit,
  Printer,
  Share2,
  Mail,
  MessageCircle,
  QrCode,
  AlertTriangle,
  Upload,
  FolderOpen,
  Folder,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Document, Client, Project } from "../types";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import FileBrowserIntegration from "../components/filebrowser/FileBrowserIntegration";

const typeConfig: Record<
  string,
  {
    label: string;
    color: "blue" | "green" | "orange" | "gray" | "yellow" | "red";
  }
> = {
  contrat: { label: "Contrat", color: "blue" },
  devis: { label: "Devis", color: "orange" },
  facture: { label: "Facture", color: "green" },
  photo_chantier: { label: "Photo Chantier", color: "yellow" },
  dossier_foncier: { label: "Dossier Foncier", color: "gray" },
  autre: { label: "Autre", color: "gray" },
};

const emptyForm = {
  nom: "",
  type_document: "autre" as Document["type_document"],
  url: "",
  description: "",
  client_id: "",
  project_id: "",
};

const sharedInputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

const getDocumentHref = (rawValue: string) => {
  const value = rawValue.trim();

  if (!value) return null;

  // URL absolue (http:// ou https://)
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // URL Supabase Storage
  if (value.includes("supabase.co/storage/v1/object/public/")) {
    return value;
  }

  // Chemin fichier local (\\\\ ou file://)
  if (/^\\\\/.test(value)) {
    return `file://${encodeURI(value.replace(/^\\\\+/, "").replace(/\\/g, "/"))}`;
  }

  if (/^[a-z]:\\/i.test(value)) {
    return `file:///${encodeURI(value.replace(/\\/g, "/"))}`;
  }

  if (value.startsWith("/")) {
    return `file://${encodeURI(value)}`;
  }

  return null;
};

export default function Documents() {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<"documents" | "partage">(
    "documents",
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [storageFiles, setStorageFiles] = useState<
    Array<{ name: string; url: string; size: number; created_at: string }>
  >([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFileBrowserAdvanced, setShowFileBrowserAdvanced] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileBrowserUrl = import.meta.env.VITE_FILEBROWSER_URL || "";

  // Vérifier les droits
  const canEdit =
    profile?.role === "admin" ||
    profile?.role === "gestionnaire" ||
    profile?.access_level === "admin" ||
    profile?.access_level === "gerant" ||
    profile?.access_level === "secretaire";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [docRes, cliRes, projRes] = await Promise.all([
      supabase
        .from("documents")
        .select("*, clients(nom, prenom), projects(nom)")
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom, prenom").order("nom"),
      supabase.from("projects").select("id, nom").order("nom"),
    ]);
    setDocuments(docRes.data || []);
    setClients((cliRes.data as Client[]) || []);
    setProjects((projRes.data as Project[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setFormErrors({});
    setCopiedKey(null);
  }, []);

  const openEdit = useCallback((d: Document) => {
    setForm({
      nom: d.nom,
      type_document: d.type_document,
      url: d.url,
      description: d.description,
      client_id: d.client_id || "",
      project_id: d.project_id || "",
    });
    setEditingId(d.id);
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!form.nom.trim()) {
      errors.nom = "Le nom est obligatoire";
    } else if (form.nom.length < 3) {
      errors.nom = "Le nom doit contenir au moins 3 caractères";
    }

    if (form.url) {
      const urlPattern = /^(https?:\/\/|file:\/\/|\\\\)[^\s]+$/;
      if (!urlPattern.test(form.url)) {
        errors.url = "URL invalide (http://, file://, ou \\\\)";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const showCopiedState = useCallback((key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 2000);
  }, []);

  const copyValue = useCallback(
    async (value: string, key: string) => {
      const trimmedValue = value.trim();
      if (!trimmedValue) return;

      try {
        await navigator.clipboard.writeText(trimmedValue);
        showCopiedState(key);
        setPageNotice("✅ Lien copié dans le presse-papier");
        setTimeout(() => setPageNotice(null), 2000);
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("Impossible de copier le lien du document.", error);
        setFormErrors({ url: "Impossible de copier le lien" });
      }
    },
    [showCopiedState],
  );

  // Impression
  const printDocument = useCallback(
    (d: Document) => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setPageNotice("❌ Veuillez autoriser les pop-ups pour imprimer");
        setTimeout(() => setPageNotice(null), 3000);
        return;
      }

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${d.nom} - Gnamba Services</title>
        <style>
          @media print {
            body { font-family: Arial, sans-serif; margin: 20mm; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: ${settings.primary_color}; }
            .content { margin: 20px 0; line-height: 1.8; }
            .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          }
          @page { margin: 15mm; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.app_title || "Gnamba Services"}</h1>
          <p>${settings.app_company || "Entreprise Gnamba Services"}</p>
          <p>${d.type_document.toUpperCase()} - ${d.nom}</p>
          <p>Date: ${new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
        
        <div class="content">
          <p><strong>Type:</strong> ${typeConfig[d.type_document]?.label || d.type_document}</p>
          <p><strong>Client:</strong> ${d.clients ? `${d.clients.prenom} ${d.clients.nom}` : "—"}</p>
          <p><strong>Projet:</strong> ${d.projects ? d.projects.nom : "—"}</p>
          ${d.description ? `<p><strong>Description:</strong> ${d.description}</p>` : ""}
          ${d.url ? `<p><strong>Lien:</strong> ${d.url}</p>` : ""}
        </div>
        
        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          <p>${settings.app_title || "Gnamba Services"} - Tous droits réservés</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);

      printWindow.document.close();
    },
    [settings],
  );

  // Partager par email
  const shareByEmail = useCallback(
    (d: Document) => {
      const subject = encodeURIComponent(
        `${d.type_document.toUpperCase()} - ${d.nom}`,
      );
      const body = encodeURIComponent(
        `Bonjour,\n\nVeuillez trouver ci-joint le document suivant :\n\n` +
          `📄 ${d.nom}\n` +
          `📋 Type: ${typeConfig[d.type_document]?.label || d.type_document}\n` +
          `👤 Client: ${d.clients ? `${d.clients.prenom} ${d.clients.nom}` : "—"}\n` +
          `📁 Projet: ${d.projects ? d.projects.nom : "—"}\n` +
          `${d.description ? `📝 Description: ${d.description}\n` : ""}` +
          `🔗 Lien: ${d.url}\n\n` +
          `Cordialement,\n${settings.app_title || "Gnamba Services"}`,
      );

      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    },
    [settings],
  );

  // Partager par WhatsApp
  const shareByWhatsApp = useCallback((d: Document) => {
    const text = encodeURIComponent(
      `📄 ${d.type_document.toUpperCase()} - ${d.nom}\n\n` +
        `${d.clients ? `👤 ${d.clients.prenom} ${d.clients.nom}\n` : ""}` +
        `🔗 ${d.url}\n\n` +
        `${d.description ? `📝 ${d.description}\n` : ""}`,
    );

    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, []);

  // Générer QR Code
  const generateQRCode = useCallback(async (d: Document) => {
    try {
      const QRCode = await import("qrcode");
      const qrDataUrl = await QRCode.toDataURL(d.url, {
        errorCorrectionLevel: "H",
        width: 250,
        margin: 2,
      });
      setQrCode(qrDataUrl);
      setQrModalOpen(true);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Erreur génération QR Code:", error);
      setPageNotice("❌ Impossible de générer le QR Code");
      setTimeout(() => setPageNotice(null), 3000);
    }
  }, []);

  // Ouvrir la modale de partage
  const openShareModal = useCallback((d: Document) => {
    setSelectedDoc(d);
    setShareModalOpen(true);
  }, []);

  // Ouvrir le file picker
  const openFilePicker = useCallback(async () => {
    setLoadingFiles(true);
    setFilePickerOpen(true);

    try {
      // Récupérer les fichiers du bucket documents
      const { data, error } = await supabase.storage
        .from("documents")
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      // Transformer les données
      const files = (data || []).map((file) => ({
        name: file.name,
        url: supabase.storage.from("documents").getPublicUrl(file.name).data
          .publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at || "",
      }));

      setStorageFiles(files);
    } catch (error: any) {
      if (import.meta.env.DEV)
        console.error("Erreur chargement fichiers:", error);
      setPageNotice("❌ Impossible de charger les fichiers");
      setTimeout(() => setPageNotice(null), 3000);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Sélectionner un fichier depuis le picker
  const selectFile = useCallback((fileUrl: string, fileName: string) => {
    setForm((prev) => ({ ...prev, url: fileUrl }));
    setFilePickerOpen(false);
    urlInputRef.current?.focus();
    setPageNotice(`✅ Fichier sélectionné : ${fileName}`);
    setTimeout(() => setPageNotice(null), 2000);
  }, []);

  // Upload d'un fichier
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validation
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        setPageNotice("❌ Fichier trop volumineux (max 10 MB)");
        setTimeout(() => setPageNotice(null), 3000);
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        setPageNotice("❌ Type de fichier non autorisé");
        setTimeout(() => setPageNotice(null), 3000);
        return;
      }

      setUploading(true);

      try {
        // Nom unique avec timestamp
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload vers Supabase Storage
        const { error } = await supabase.storage
          .from("documents")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        // Mettre à jour le formulaire
        setForm((prev) => ({ ...prev, url: urlData.publicUrl }));
        setPageNotice("✅ Fichier uploadé avec succès");
        setTimeout(() => setPageNotice(null), 3000);

        // Recharger la liste des fichiers
        openFilePicker();
      } catch (error: any) {
        if (import.meta.env.DEV) console.error("Erreur upload:", error);
        setPageNotice(error.message || "❌ Échec de l'upload");
      } finally {
        setUploading(false);
      }
    },
    [openFilePicker],
  );

  const handleSave = async () => {
    // Validation complète
    if (!validateForm()) {
      setPageNotice("❌ Veuillez corriger les erreurs ci-dessous");
      return;
    }

    setSaving(true);
    setPageNotice(null);

    try {
      const payload = {
        nom: form.nom.trim(),
        type_document: form.type_document,
        url: form.url.trim(),
        description: form.description.trim(),
        client_id: form.client_id || null,
        project_id: form.project_id || null,
      };

      if (editingId) {
        // UPDATE - Modification d'un document existant
        const { error } = await supabase
          .from("documents")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setPageNotice("✅ Document modifié avec succès");
      } else {
        // INSERT - Création d'un nouveau document
        const { error } = await supabase.from("documents").insert(payload);
        if (error) throw error;
        setPageNotice("✅ Document créé avec succès");
      }

      setSaving(false);
      handleCloseModal();
      setForm(emptyForm);
      fetchData();

      // Clear notice after 3 seconds
      setTimeout(() => setPageNotice(null), 3000);
    } catch (error: any) {
      setSaving(false);
      setPageNotice(error.message || "❌ Une erreur est survenue. Réessayez.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.from("documents").delete().eq("id", id);
    fetchData();
  };

  const filtered = documents.filter((d) => {
    const matchSearch = `${d.nom} ${d.description}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchType = !filterType || d.type_document === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "documents"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText size={18} />
          Documents EGS
        </button>
        <button
          onClick={() => setActiveTab("partage")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "partage"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Folder size={18} />
          Partage de Fichiers
        </button>
      </div>

      {/* Contenu conditionnel */}
      {activeTab === "documents" ? (
        <>
          {/* Notification */}
          {pageNotice && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                pageNotice.includes("✅")
                  ? "bg-green-50 border-green-200 text-green-700"
                  : pageNotice.includes("❌")
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              {pageNotice.includes("✅") ? (
                <Check size={18} />
              ) : pageNotice.includes("❌") ? (
                <AlertTriangle size={18} />
              ) : (
                <FileText size={18} />
              )}
              <span className="text-sm font-medium">{pageNotice}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher un document..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white w-full sm:w-auto"
              >
                <option value="">Tous les types</option>
                {Object.entries(typeConfig).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setForm(emptyForm);
                setCopiedKey(null);
                setModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              <Plus size={16} /> Ajouter Document
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: settings.primary_color }}
                ></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FileText size={40} className="mb-2 opacity-30" />
                <p className="text-sm">Aucun document</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full egs-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Document
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                        Client / Projet
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                        Date
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((d) => {
                      const tc = typeConfig[d.type_document];
                      const documentHref = getDocumentHref(d.url);
                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-gray-100">
                                <File size={14} className="text-gray-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {d.nom}
                                </div>
                                {d.url && (
                                  <div
                                    className="text-xs text-blue-600 truncate max-w-[240px] select-all"
                                    title={d.url}
                                  >
                                    {d.url}
                                  </div>
                                )}
                                {d.description && (
                                  <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {d.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge label={tc.label} color={tc.color} />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                            {d.clients
                              ? `${d.clients.prenom} ${d.clients.nom}`
                              : d.projects
                                ? d.projects.nom
                                : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                            {new Date(d.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {canEdit && (
                                <button
                                  onClick={() => openEdit(d)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Modifier le document"
                                >
                                  <Edit size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => printDocument(d)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                title="Imprimer le document"
                              >
                                <Printer size={15} />
                              </button>
                              <button
                                onClick={() => openShareModal(d)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Partager le document"
                              >
                                <Share2 size={15} />
                              </button>
                              {d.url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyValue(d.url, `document-${d.id}`)
                                  }
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Copier le lien"
                                >
                                  {copiedKey === `document-${d.id}` ? (
                                    <Check size={15} />
                                  ) : (
                                    <Copy size={15} />
                                  )}
                                </button>
                              )}
                              {documentHref && (
                                <a
                                  href={documentHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Ouvrir le lien"
                                >
                                  <ExternalLink size={15} />
                                </a>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => handleDelete(d.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
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

          <Modal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            title="Ajouter un Document"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nom du Document *
                </label>
                <input
                  data-autofocus="true"
                  type="text"
                  value={form.nom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  className={sharedInputClass}
                />
                {formErrors.nom && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.nom}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type
                </label>
                <select
                  value={form.type_document}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type_document: e.target
                        .value as Document["type_document"],
                    }))
                  }
                  className={sharedInputClass}
                >
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  URL / Lien du Document
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={urlInputRef}
                      type="text"
                      value={form.url}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, url: e.target.value }))
                      }
                      placeholder="https://... ou sélectionnez depuis le stockage"
                      className={sharedInputClass}
                      readOnly={uploading}
                    />
                    <button
                      type="button"
                      onClick={openFilePicker}
                      disabled={uploading}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      title="Choisir depuis le stockage"
                    >
                      <FolderOpen size={15} />
                      <span className="hidden sm:inline">Choisir</span>
                    </button>
                  </div>

                  {/* Upload de fichier */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Upload...</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Formats acceptés : PDF, Word, Excel, Images (JPG, PNG, GIF),
                    Texte. Max 10 MB.
                  </p>
                  {formErrors.url && (
                    <p className="text-xs text-red-600">{formErrors.url}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Client
                  </label>
                  <select
                    value={form.client_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_id: e.target.value,
                      }))
                    }
                    className={sharedInputClass}
                  >
                    <option value="">Sélectionner...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Projet
                  </label>
                  <select
                    value={form.project_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                      }))
                    }
                    className={sharedInputClass}
                  >
                    <option value="">Sélectionner...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className={`${sharedInputClass} resize-none`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nom.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: "var(--color-on-primary)",
                  }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </Modal>

          {/* Modale de Partage */}
          <Modal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title="Partager le Document"
          >
            {selectedDoc && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedDoc.nom}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeConfig[selectedDoc.type_document]?.label ||
                      selectedDoc.type_document}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => shareByEmail(selectedDoc)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Mail size={24} className="text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Email
                    </span>
                  </button>

                  <button
                    onClick={() => shareByWhatsApp(selectedDoc)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <MessageCircle size={24} className="text-green-600" />
                    <span className="text-xs font-medium text-gray-700">
                      WhatsApp
                    </span>
                  </button>

                  <button
                    onClick={() => generateQRCode(selectedDoc)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  >
                    <QrCode size={24} className="text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">
                      QR Code
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      copyValue(selectedDoc.url, `share-${selectedDoc.id}`);
                      setShareModalOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    <Copy size={24} className="text-orange-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Copier lien
                    </span>
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modale QR Code */}
          <Modal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            title="QR Code du Document"
          >
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Scannez ce QR Code pour accéder au document
              </p>

              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (qrCode) {
                      const link = document.createElement("a");
                      link.download = `qr-code-${selectedDoc?.nom || "document"}.png`;
                      link.href = qrCode;
                      link.click();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: "var(--color-on-primary)",
                  }}
                >
                  Télécharger QR Code
                </button>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </Modal>

          {/* Modale File Picker */}
          <Modal
            isOpen={filePickerOpen}
            onClose={() => setFilePickerOpen(false)}
            title="Choisir un Document"
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Sélectionnez un fichier depuis le stockage
                </p>
                <label
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: "var(--color-on-primary)",
                  }}
                >
                  <Upload size={15} />
                  <span>Uploader un fichier</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                    className="hidden"
                  />
                </label>
              </div>

              {loadingFiles ? (
                <div className="flex items-center justify-center h-48">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: settings.primary_color }}
                  ></div>
                </div>
              ) : storageFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <FolderOpen size={40} className="mb-2 opacity-30" />
                  <p className="text-sm">Aucun fichier dans le stockage</p>
                  <p className="text-xs mt-1">Uploadez d'abord un fichier</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {storageFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors cursor-pointer"
                      onClick={() => selectFile(file.url, file.name)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-white">
                          <File size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB •{" "}
                            {new Date(file.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectFile(file.url, file.name);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: settings.primary_color,
                          color: "var(--color-on-primary)",
                        }}
                      >
                        Sélectionner
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setFilePickerOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        // Onglet Partage - FileBrowser
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Filebrowser (intégration safe)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Ouvrez Filebrowser dans un nouvel onglet. Recommandé pour
                  éviter tout souci d’iframe/CORS.
                </p>
              </div>
              <button
                type="button"
                disabled={!fileBrowserUrl}
                onClick={() => {
                  if (!fileBrowserUrl) return;
                  window.open(fileBrowserUrl, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: settings.primary_color,
                  color: "var(--color-on-primary)",
                }}
              >
                <ExternalLink size={16} />
                Ouvrir Filebrowser
              </button>
            </div>

            {fileBrowserUrl ? (
              <p className="text-xs text-gray-500 mt-3">
                URL configurée: {fileBrowserUrl}
              </p>
            ) : (
              <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                Renseignez{" "}
                <code className="font-mono">VITE_FILEBROWSER_URL</code> dans{" "}
                <code className="font-mono">.env</code> pour activer le bouton.
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowFileBrowserAdvanced((value) => !value)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {showFileBrowserAdvanced ? "Masquer" : "Afficher"} le mode
                avancé (API)
              </button>
            </div>
          </div>

          {showFileBrowserAdvanced && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <FileBrowserIntegration
                onFileSelect={(file) => {
                  if (import.meta.env.DEV)
                    console.log("Fichier sélectionné:", file);
                  // Vous pouvez ajouter une logique ici pour intégrer le fichier dans EGS
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
