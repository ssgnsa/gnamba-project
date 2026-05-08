import { memo, useMemo } from "react";
import { VisiteurFormData } from "../../types";
import {
  Camera,
  Upload,
  ChevronLeft,
  X,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface FormulaireVisiteurProps {
  visitorForm: VisiteurFormData;
  onFormChange: (field: keyof VisiteurFormData, value: string) => void;
  onPhotoDelete: () => void;
  onPhotoUpload: (file: File) => void;
  onStartWebcam: () => void;
  onNext: () => void;
  errors?: Record<string, string>;
  onFieldBlur?: (field: keyof VisiteurFormData) => void;
  touched?: Record<string, boolean>;
}

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email) return "Email requis";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Format d'email invalide";
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone) return "Téléphone requis";
  const phoneRegex = /^(\+225|0)[0-9]{9,10}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, "")))
    return "Numéro invalide (ex: 0707080808)";
  return null;
};

const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value.trim()) return `${fieldName} requis`;
  return null;
};

// Composant mémoïsé pour éviter les re-renders inutiles
export const FormulaireVisiteur = memo(function FormulaireVisiteur({
  visitorForm,
  onFormChange,
  onPhotoDelete,
  onPhotoUpload,
  onStartWebcam,
  onNext,
  errors = {},
  onFieldBlur,
  touched = {},
}: FormulaireVisiteurProps) {
  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const errorClass =
    "border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-400";

  // Compute validation errors in real-time
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    const nomError = validateRequired(visitorForm.nom_complet, "Nom complet");
    if (nomError) errs.nom_complet = nomError;

    const pieceError = validateRequired(
      visitorForm.numero_piece,
      "N° de pièce",
    );
    if (pieceError) errs.numero_piece = pieceError;

    const phoneError = validatePhone(visitorForm.telephone);
    if (phoneError) errs.telephone = phoneError;

    const emailError = validateEmail(visitorForm.email);
    if (emailError) errs.email = emailError;

    return errs;
  }, [
    visitorForm.nom_complet,
    visitorForm.numero_piece,
    visitorForm.telephone,
    visitorForm.email,
  ]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPhotoUpload(file);
  };

  const getFieldClass = (fieldName: keyof VisiteurFormData) => {
    const hasError =
      touched[fieldName] &&
      (errors[fieldName] || validationErrors[fieldName as string]);
    return `${inputClass} ${hasError ? errorClass : ""}`;
  };

  const renderError = (fieldName: string) => {
    const error = errors[fieldName] || validationErrors[fieldName];
    if (!touched[fieldName] || !error) return null;
    return (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <UserPlus size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Informations du Visiteur
          </h2>
          <p className="text-xs text-gray-500">Étape 1 sur 2</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Photo */}
        <div>
          <label className={labelClass}>Photo du visiteur</label>
          <div className="flex items-center gap-4">
            {visitorForm.photo_base64 ? (
              <div className="relative">
                <img
                  src={visitorForm.photo_base64}
                  alt="Photo"
                  className="w-24 h-32 object-cover rounded-xl border-2 border-blue-200"
                />
                <button
                  type="button"
                  onClick={onPhotoDelete}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  aria-label="Supprimer la photo"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
                <Camera size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500">Aucune photo</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onStartWebcam}
                className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Camera size={16} />
                Webcam
              </button>
              <label className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2">
                <Upload size={16} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Nom complet */}
        <div>
          <label className={labelClass}>Nom complet *</label>
          <input
            type="text"
            value={visitorForm.nom_complet}
            onChange={(e) => onFormChange("nom_complet", e.target.value)}
            className={inputClass}
            placeholder="ex: KONAN Jean"
            autoComplete="off"
          />
        </div>

        {/* Type et numéro pièce */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type de pièce *</label>
            <select
              value={visitorForm.type_piece}
              onChange={(e) => onFormChange("type_piece", e.target.value)}
              className={inputClass}
            >
              <option value="CNI">CNI</option>
              <option value="PASSEPORT">Passeport</option>
              <option value="PERMIS">Permis</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>N° de pièce *</label>
            <input
              type="text"
              value={visitorForm.numero_piece}
              onChange={(e) => onFormChange("numero_piece", e.target.value)}
              className={inputClass}
              placeholder="ex: CI 05274109"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Téléphone et email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Téléphone *</label>
            <input
              type="tel"
              value={visitorForm.telephone}
              onChange={(e) => onFormChange("telephone", e.target.value)}
              onBlur={() => onFieldBlur?.("telephone")}
              className={getFieldClass("telephone")}
              placeholder="ex: 0707080808"
              autoComplete="off"
              required
            />
            {renderError("telephone")}
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={visitorForm.email}
              onChange={(e) => onFormChange("email", e.target.value)}
              onBlur={() => onFieldBlur?.("email")}
              className={getFieldClass("email")}
              placeholder="ex: email@example.com"
              autoComplete="off"
              required
            />
            {renderError("email")}
            <p className="text-xs text-gray-400 mt-1">
              Email requis pour les attestations et rappels
            </p>
          </div>
        </div>

        {/* Société */}
        <div>
          <label className={labelClass}>Société</label>
          <input
            type="text"
            value={visitorForm.societe}
            onChange={(e) => onFormChange("societe", e.target.value)}
            className={inputClass}
            placeholder="ex: Société ABC"
            autoComplete="off"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onNext}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Suivant
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
});
