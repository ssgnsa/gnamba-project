import { FolderOpen } from "lucide-react";
import { Document, Client, Project } from "../../types";
import Modal from "../ui/Modal";

interface DocumentFormProps {
  form: {
    nom: string;
    type_document: Document["type_document"];
    url: string;
    description: string;
    client_id: string;
    project_id: string;
  };
  setForm: (form: any) => void;
  formErrors: Record<string, string>;
  saving: boolean;
  uploading: boolean;
  uploadProgress: number;
  clients: Client[];
  projects: Project[];
  typeConfig: Record<string, { label: string; color: any }>;
  sharedInputClass: string;
  settings: { primary_color: string };
  fileInputRef: React.RefObject<HTMLInputElement>;
  urlInputRef: React.RefObject<HTMLInputElement>;
  onSave: () => void;
  onCancel: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
}

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

const sharedInputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400";

export default function DocumentForm({
  form,
  setForm,
  formErrors,
  saving,
  uploading,
  uploadProgress,
  clients,
  projects,
  settings,
  fileInputRef,
  urlInputRef,
  onSave,
  onCancel,
  onFileUpload,
  onOpenFilePicker,
}: DocumentFormProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
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
              setForm((prev: any) => ({ ...prev, nom: e.target.value }))
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
              setForm((prev: any) => ({
                ...prev,
                type_document: e.target.value as Document["type_document"],
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
                  setForm((prev: any) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://... ou sélectionnez depuis le stockage"
                className={sharedInputClass}
                readOnly={uploading}
              />
              <button
                type="button"
                onClick={onOpenFilePicker}
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
                onChange={onFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              />
              {uploading && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-600">{uploadProgress}%</span>
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
                setForm((prev: any) => ({
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
                setForm((prev: any) => ({
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
              setForm((prev: any) => ({
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
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
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
  );
}
