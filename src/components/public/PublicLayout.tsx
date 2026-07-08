import { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import PublicNavbar from "./PublicNavbar";
import type { PublicPage } from "../../lib/publicRoutes";
import PublicFooter from "./PublicFooter";
import { SiteContentProvider } from "../../context/SiteContentContext";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface PublicLayoutProps {
  children: ReactNode;
  activePage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  showFooter?: boolean;
}

export default function PublicLayout({
  children,
  activePage,
  onNavigate,
  showFooter = true,
}: PublicLayoutProps) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <SiteContentProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ paddingBottom: "max(0px, var(--sab))" }}
      >
        <PublicNavbar activePage={activePage} onNavigate={onNavigate} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
        {showFooter && <PublicFooter onNavigate={onNavigate} />}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          style={{ bottom: "max(1.25rem, var(--sab))" }}
          aria-label="Contacter GNAMBA SERVICES sur WhatsApp"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>
    </SiteContentProvider>
  );
}
