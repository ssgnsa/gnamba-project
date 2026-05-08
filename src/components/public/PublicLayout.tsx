import { ReactNode } from "react";
import PublicNavbar from "./PublicNavbar";
import type { PublicPage } from "../../lib/publicRoutes";
import PublicFooter from "./PublicFooter";
import { SiteContentProvider } from "../../context/SiteContentContext";

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
  return (
    <SiteContentProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ paddingBottom: "max(0px, var(--sab))" }}
      >
        <PublicNavbar activePage={activePage} onNavigate={onNavigate} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
        {showFooter && <PublicFooter onNavigate={onNavigate} />}
      </div>
    </SiteContentProvider>
  );
}
