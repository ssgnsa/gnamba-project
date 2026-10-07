import { useMemo } from "react";
import { Palette, Type, Building, Building2, Image as ImageIcon } from "lucide-react";
import { useColor } from "@/hooks/useColor";
import { PRESET_COLORS, PRESET_SECONDARY, SettingsTab } from "../constants";
import type { BrandSettings } from "@/types";

interface SectionGeneralProps {
  form: BrandSettings;
  onChange: (field: keyof BrandSettings, value: string) => void;
  hasError: (field: keyof BrandSettings) => boolean;
  getError: (field: keyof BrandSettings) => string | null;
  activeTab: SettingsTab;
}

export function SectionGeneral({
  form,
  onChange,
  hasError,
  getError,
  activeTab,
}: SectionGeneralProps) {
  const colorPrimary = useColor(form.primary_color);
  const colorSecondary = useColor(form.secondary_color);

  const primaryColorStyles = useMemo(
    () => ({
      backgroundColor: form.primary_color,
      color: colorPrimary.textOnColor,
      borderColor: colorPrimary.borderColor,
    }),
    [form.primary_color, colorPrimary]
  );

  const secondaryColorStyles = useMemo(
    () => ({
      backgroundColor: form.secondary_color,
      color: colorSecondary.textOnColor,
      borderColor: colorSecondary.borderColor,
    }),
    [form.secondary_color, colorSecondary]
  );

  if (activeTab !== "general") return null;

  return (
    <section aria-labelledby="general-heading">
      <h2 id="general-heading" className="sr-only">
        Paramètres généraux
      </h2>
      
      <div className="space-y-6">
        {/* Titre et entreprise */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="app_title" className="block text-sm font-medium text-gray-700 mb-1.5">
              <Type size={14} className="inline mr-1.5" />
              Titre de l'application
            </label>
            <input
              id="app_title"
              type="text"
              value={form.app_title}
              onChange={(e) => onChange("app_title", e.target.value)}
              placeholder="EGS"
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${
                hasError("app_title")
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"
              }`}
              aria-invalid={hasError("app_title")}
              aria-describedby={hasError("app_title") ? "app_title-error" : undefined}
            />
            {hasError("app_title") && (
              <p id="app_title-error" className="text-xs text-red-600 mt-1" role="alert">
                {getError("app_title")}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="app_subtitle" className="block text-sm font-medium text-gray-700 mb-1.5">
              <Type size={14} className="inline mr-1.5" />
              Sous-titre
            </label>
            <input
              id="app_subtitle"
              type="text"
              value={form.app_subtitle}
              onChange={(e) => onChange("app_subtitle", e.target.value)}
              placeholder="Enterprise Gnamba System"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="app_company" className="block text-sm font-medium text-gray-700 mb-1.5">
              <Building size={14} className="inline mr-1.5" />
              Nom de l'entreprise
            </label>
            <input
              id="app_company"
              type="text"
              value={form.app_company}
              onChange={(e) => onChange("app_company", e.target.value)}
              placeholder="Gnamba Services"
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${
                hasError("app_company")
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"
              }`}
              aria-invalid={hasError("app_company")}
              aria-describedby={hasError("app_company") ? "app_company-error" : undefined}
            />
            {hasError("app_company") && (
              <p id="app_company-error" className="text-xs text-red-600 mt-1" role="alert">
                {getError("app_company")}
              </p>
            )}
          </div>
        </div>

        {/* Couleurs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Palette size={14} className="inline mr-1.5" />
              Couleur primaire
            </label>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => onChange("primary_color", e.target.value)}
                className="w-12 h-12 rounded-xl border-2 cursor-pointer"
                style={primaryColorStyles}
                aria-label="Choisir la couleur primaire"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => onChange("primary_color", e.target.value.toLowerCase())}
                placeholder="#RRVVBB"
                className={`w-32 px-3 py-2.5 border rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors ${
                  hasError("primary_color")
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-gray-200"
                }`}
                aria-invalid={hasError("primary_color")}
                aria-describedby={hasError("primary_color") ? "primary_color-error" : undefined}
              />
              {hasError("primary_color") && (
                <p id="primary_color-error" className="text-xs text-red-600" role="alert">
                  {getError("primary_color")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Couleurs prédéfinies primaires">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onChange("primary_color", color.value)}
                  className="w-8 h-8 rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: color.value,
                    borderColor: form.primary_color === color.value ? "#999" : "#e5e7eb",
                    boxShadow: form.primary_color === color.value ? "0 0 0 2px #3b82f6" : "none",
                  }}
                  aria-label={color.name}
                  aria-pressed={form.primary_color === color.value}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <ImageIcon size={14} className="inline mr-1.5" />
              Couleur secondaire
            </label>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => onChange("secondary_color", e.target.value)}
                className="w-12 h-12 rounded-xl border-2 cursor-pointer"
                style={secondaryColorStyles}
                aria-label="Choisir la couleur secondaire"
              />
              <input
                type="text"
                value={form.secondary_color}
                onChange={(e) => onChange("secondary_color", e.target.value.toLowerCase())}
                placeholder="#RRVVBB"
                className={`w-32 px-3 py-2.5 border rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors ${
                  hasError("secondary_color")
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-gray-200"
                }`}
                aria-invalid={hasError("secondary_color")}
                aria-describedby={hasError("secondary_color") ? "secondary_color-error" : undefined}
              />
              {hasError("secondary_color") && (
                <p id="secondary_color-error" className="text-xs text-red-600" role="alert">
                  {getError("secondary_color")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Couleurs prédéfinies secondaires">
              {PRESET_SECONDARY.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onChange("secondary_color", color.value)}
                  className="w-8 h-8 rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: color.value,
                    borderColor: form.secondary_color === color.value ? "#999" : "#e5e7eb",
                    boxShadow: form.secondary_color === color.value ? "0 0 0 2px #3b82f6" : "none",
                  }}
                  aria-label={color.name}
                  aria-pressed={form.secondary_color === color.value}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Aperçu temps réel */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Aperçu</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: form.primary_color }}
            >
              Bouton primaire
            </div>
            <div
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700"
              style={{ borderColor: form.secondary_color }}
            >
              Bouton secondaire
            </div>
            <div
              className="px-4 py-2 rounded-lg text-white text-sm"
              style={{ backgroundColor: form.secondary_color }}
            >
              Badge secondaire
            </div>
            <div className="h-4 w-24 rounded" style={{ backgroundColor: form.primary_color }} />
          </div>
        </div>

        {/* Paramètres Immobilier */}
        <div className="space-y-6 border-t border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Paramètres Immobilier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Taux de commission propriétaire (%)</label
              >
              <input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.commission_rate}
                onChange={(e) => onChange("commission_rate", e.target.value)}
                placeholder="12"
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${hasError("commission_rate") ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"}`}
                aria-invalid={hasError("commission_rate")}
                aria-describedby={hasError("commission_rate") ? "commission_rate-error" : undefined}
              />
              {hasError("commission_rate") && (
                <p id="commission_rate-error" className="text-xs text-red-600 mt-1" role="alert">
                  {getError("commission_rate")}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Commission prélevée sur les encaissements propriétaires (défaut: 12%)</p>
            </div>
            <div>
              <label htmlFor="rent_due_day" className="block text-sm font-medium text-gray-700 mb-1.5">
                Jour d'échéance loyer (1-28)</label
              >
              <input
                id="rent_due_day"
                type="number"
                min="1"
                max="28"
                step="1"
                value={form.rent_due_day}
                onChange={(e) => onChange("rent_due_day", e.target.value)}
                placeholder="10"
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${hasError("rent_due_day") ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"}`}
                aria-invalid={hasError("rent_due_day")}
                aria-describedby={hasError("rent_due_day") ? "rent_due_day-error" : undefined}
              />
              {hasError("rent_due_day") && (
                <p id="rent_due_day-error" className="text-xs text-red-600 mt-1" role="alert">
                  {getError("rent_due_day")}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Jour du mois pour l'échéance des loyers (défaut: 10)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
