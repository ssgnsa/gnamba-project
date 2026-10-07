import { useMemo } from "react";
import { CheckCircle, X, Star } from "lucide-react";
import BrandAssetsManager from "@/components/media/BrandAssetsManager";
import SiteMediaAssignments from "@/components/media/SiteMediaAssignments";
import { BrandingStatusItem, LOGO_COVERAGE } from "../constants";
import type { BrandSettings } from "@/types";

interface SectionBrandProps {
  form: BrandSettings;
  activeTab: string;
}

export function SectionBrand({ form, activeTab }: SectionBrandProps) {
  const brandingStatus = useMemo((): BrandingStatusItem[] => [
    { label: "Logo principal", ok: Boolean(form.logo_url), hint: "Sidebar, entêtes, documents, pages publiques" },
    { label: "Logo secondaire", ok: Boolean(form.brand_logo_dark), hint: "Fond sombre (footer, hero, emails)" },
    { label: "Favicon", ok: Boolean(form.brand_favicon_url), hint: "Onglet navigateur et favoris" },
    { label: "Filigrane", ok: Boolean(form.brand_watermark_url), hint: "Documents imprimés et exportés" },
  ], [form]);

  if (activeTab !== "brand") return null;

  return (
    <section aria-labelledby="brand-heading">
      <h2 id="brand-heading" className="sr-only">Identité visuelle</h2>
      
      <div className="space-y-6">
        {/* Gestionnaire d'assets de marque */}
        <BrandAssetsManager />

        {/* Affectation médias - Site vitrine */}
        <SiteMediaAssignments />

        {/* Statut du branding */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Harmonisation du Logo
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {brandingStatus.map((status) => (
                <div
                  key={status.label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      status.ok ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {status.ok ? <CheckCircle size={16} /> : <X size={16} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{status.label}</div>
                    <div className="text-xs text-gray-500">{status.hint}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Pages couvertes</p>
              <ul className="space-y-2">
                {LOGO_COVERAGE.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                Modifiez un logo dans "Identité Visuelle" pour voir l'impact immédiat partout.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
