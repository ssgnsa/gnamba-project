import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSettings } from "../context/SettingsContext";

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

  const logoUrl = useMemo(() => {
    const primary = settings.logo_url;
    const dark = settings.brand_logo_dark;
    if (tone === "dark") return dark || primary;
    return primary || dark;
  }, [settings.logo_url, settings.brand_logo_dark, tone]);

  useEffect(() => {
    setErrored(false);
  }, [logoUrl]);

  if (!logoUrl || errored) {
    return <>{fallback ?? null}</>;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      title={title}
      className={className}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setErrored(true)}
    />
  );
}
