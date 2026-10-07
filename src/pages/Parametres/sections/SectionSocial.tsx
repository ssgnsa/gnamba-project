import { Facebook, Youtube, Linkedin, Twitter, Instagram, Video } from "lucide-react";
import { SOCIAL_FIELDS } from "../constants";
import type { BrandSettings } from "@/types";

interface SectionSocialProps {
  form: BrandSettings;
  onChange: (field: keyof BrandSettings, value: string) => void;
  hasError: (field: keyof BrandSettings) => boolean;
  getError: (field: keyof BrandSettings) => string | null;
  activeTab: string;
}

const SocialIcons = { Facebook, Youtube, Linkedin, Twitter, Instagram, Video };

export function SectionSocial({ form, onChange, hasError, getError, activeTab }: SectionSocialProps) {
  if (activeTab !== "social") return null;

  return (
    <section aria-labelledby="social-heading">
      <h2 id="social-heading" className="sr-only">Réseaux sociaux</h2>
      
      <div className="space-y-4">
        {SOCIAL_FIELDS.map(({ key, label, placeholder }) => {
          const Icon = SocialIcons[key as keyof typeof SocialIcons];
          const displayKey = key as keyof BrandSettings;
          return (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1.5">
                <Icon size={14} className="inline mr-1.5 text-gray-400" />
                {label}
              </label>
              <input
                id={key}
                type="url"
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
              {hasError(displayKey) && (
                <p id={`${key}-error`} className="text-xs text-red-600 mt-1" role="alert">
                  {getError(displayKey)}
                </p>
              )}
              {key === "social_youtube" && (
                <p className="mt-1 text-xs text-gray-400">
                  Pour une mise à jour automatique fiable, privilégiez une
                  URL de chaîne ou de playlist.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
