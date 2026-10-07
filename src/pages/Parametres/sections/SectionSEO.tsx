import { Globe, Search } from "lucide-react";
import { SEO_FIELDS, VALIDATION_CONFIG } from "../constants";
import type { BrandSettings } from "@/types";

export function SectionSEO({ 
  form, 
  onChange, 
  hasError, 
  getError, 
  activeTab 
}: {
  form: BrandSettings;
  onChange: (field: keyof BrandSettings, value: string) => void;
  hasError: (field: keyof BrandSettings) => boolean;
  getError: (field: keyof BrandSettings) => string | null;
  activeTab: string;
}) {
  if (activeTab !== "seo") return null;

  return (
    <section aria-labelledby="seo-heading">
      <h2 id="seo-heading" className="sr-only">Optimisation SEO</h2>
      
      <div className="space-y-4">
        {SEO_FIELDS.map(({ key, label, placeholder }) => {
          const Icon = key === "seo_description" ? Globe : Search;
          const displayKey = key as keyof BrandSettings;
          const currentLength = form[displayKey]?.length || 0;
          
          return (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1.5">
                <Icon size={14} className="inline mr-1.5" />
                {label}
              </label>
              {key === "seo_description" ? (
                <textarea
                  id={key}
                  value={form[displayKey]}
                  onChange={(e) => onChange(displayKey, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors resize-none ${
                    hasError(displayKey)
                      ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                      : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                  }`}
                  aria-invalid={hasError(displayKey)}
                  aria-describedby={hasError(displayKey) ? `${key}-error` : undefined}
                />
              ) : (
                <input
                  id={key}
                  type="text"
                  value={form[displayKey]}
                  onChange={(e) => onChange(displayKey, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${
                    hasError(displayKey)
                      ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                      : "border border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                  }`}
                  aria-invalid={hasError(displayKey)}
                  aria-describedby={hasError(displayKey) ? `${key}-error` : undefined}
                />
              )}
              {key === "seo_description" && (
                <p className={`mt-1 text-xs ${
                  currentLength > VALIDATION_CONFIG.SEO_DESC_MAX ? "text-red-600" : "text-gray-400"
                }`}>
                  {currentLength} caractères (recommandé: 150-{VALIDATION_CONFIG.SEO_DESC_MAX})
                </p>
              )}
              {hasError(displayKey) && (
                <p id={`${key}-error`} className="text-xs text-red-600 mt-1" role="alert">
                  {getError(displayKey)}
                </p>
              )}
              {key === "seo_keywords" && (
                <p className="text-xs text-gray-400 mt-1">Séparez les mots-clés par des virgules</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
