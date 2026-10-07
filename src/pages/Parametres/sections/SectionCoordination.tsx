import { Image as ImageIcon, Globe, Shield, FileText, Users, CheckCircle, X } from "lucide-react";
import { MODULE_CARDS, LOGO_COVERAGE } from "../constants";
import type { BrandSettings, Page } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface SectionCoordinationProps {
  form: BrandSettings;
  onNavigate: (page: Page) => void;
  activeTab: string;
}

export function SectionCoordination({ form, onNavigate, activeTab }: SectionCoordinationProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  if (activeTab !== "coordination") return null;

  const IconMap = { Image: ImageIcon, Globe, Shield, FileText, Users };

  // Calculate branding status dynamically based on current form
  const brandingStatus = [
    { label: "Logo principal", ok: !!form.logo_url, hint: "Sidebar, entêtes, documents, pages publiques" },
    { label: "Logo secondaire", ok: !!form.brand_logo_dark, hint: "Fond sombre (footer, hero, emails)" },
    { label: "Favicon", ok: !!form.brand_favicon_url, hint: "Onglet navigateur et favoris" },
    { label: "Filigrane", ok: !!form.brand_watermark_url, hint: "Documents imprimés et exportés" },
  ];

  return (
    <section aria-labelledby="coordination-heading">
      <h2 id="coordination-heading" className="sr-only">Centre de coordination</h2>
      
      <div className="space-y-6">
        {/* Accès modules clés */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          <div className="flex flex-wrap gap-2">
            {MODULE_CARDS.map((module) => {
              const disabled = module.adminOnly && !isAdmin;
              const Icon = IconMap[module.icon as keyof typeof IconMap];
              return (
                <button
                  key={module.id}
                  onClick={() => onNavigate(module.id)}
                  disabled={disabled}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    disabled
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"
                  }`}
                  aria-disabled={disabled}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        disabled ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{module.label}</div>
                      {module.adminOnly && (
                        <div className="text-xs text-amber-600">Accès administrateur requis</div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{module.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Harmonisation du logo */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
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
