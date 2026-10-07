import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSettings } from "../context/SettingsContext";
import { normalizeLogoUrl } from "../lib/logoUtils";

type BrandLogoTone = "light" | "dark";

interface BrandLogoProps {
  tone?: BrandLogoTone;
  alt?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}

export default function BrandLogo({
  tone = "light",
  alt = "Logo",
  title,
  className,
  style,
  fallback,
  loading = "eager",
  fetchPriority = "high",
}: BrandLogoProps) {
  const { settings } = useSettings();
  const [errored, setErrored] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  const logoUrl = useMemo(() => {
    const primary = settings.logo_url;
    const dark = settings.brand_logo_dark;
    const selected = tone === "dark" ? (dark || primary) : (primary || dark);
    return selected;
  }, [settings.logo_url, settings.brand_logo_dark, tone]);

  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null);

  useEffect(() => {
    const normalizeUrl = async () => {
      if (logoUrl) {
        const normalized = await normalizeLogoUrl(logoUrl);
        setNormalizedUrl(normalized);
      } else {
        setNormalizedUrl(null);
      }
    };
    
    normalizeUrl();
  }, [logoUrl]);

  useEffect(() => {
    setErrored(false);
    setLoadingState(true);
  }, [logoUrl]);

  const handleLoad = () => {
    setLoadingState(false);
    if (import.meta.env.DEV) {
      console.log("BrandLogo loaded successfully:", logoUrl);
    }
  };

  const handleError = () => {
    setErrored(true);
    setLoadingState(false);
    if (import.meta.env.DEV) {
      console.error("BrandLogo failed to load:", logoUrl);
    }
  };

  if (!normalizedUrl || errored) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div className={`brand-logo-container ${loadingState ? 'loading' : 'loaded'}`}>
      {loadingState && (
        <div className="brand-logo-spinner">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        </div>
      )}
      <img
        src={normalizedUrl}
        alt={alt}
        title={title}
        crossOrigin="anonymous"
        className={`${className} ${loadingState ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={style}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
