import { MapPin, Phone, Mail, Clock } from "lucide-react";
import type { BrandSettings } from "@/types";

type ContactField = {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
  type?: string;
};

const CONTACT_FIELDS_TYPED: ContactField[] = [
  { key: "contact_address", label: "Adresse", icon: "MapPin", placeholder: "Abidjan, Côte d'Ivoire" },
  { key: "contact_phone", label: "Téléphone", icon: "Phone", placeholder: "+225 XX XX XX XX XX", type: "tel" },
  { key: "contact_email", label: "Email", icon: "Mail", placeholder: "contact@gnambaservices.ci", type: "email" },
  { key: "contact_hours", label: "Heures d'Ouverture", icon: "Clock", placeholder: "Lun-Ven : 08h – 18h" },
];

const ContactIcon = { MapPin, Phone, Mail, Clock };

export function SectionContact({ 
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
  if (activeTab !== "contact") return null;

  return (
    <section aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="sr-only">Informations de contact</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTACT_FIELDS_TYPED.map(({ key, label, icon: IconName, placeholder, type = "text" }) => {
            const Icon = ContactIcon[IconName as keyof typeof ContactIcon];
            const displayKey = key as keyof BrandSettings;
            const inputType = type || "text";
            return (
              <div key={key} className={key === "contact_hours" ? "md:col-span-2" : ""}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Icon size={14} className="inline mr-1.5" />
                  {label}
                </label>
                <input
                  id={key}
                  type={inputType}
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
