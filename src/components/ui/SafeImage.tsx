import { useState } from "react";
import { ImageOff } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant Image sécurisé avec CORS
 * Utilise crossOrigin="anonymous" pour éviter OpaqueResponseBlocking
 */
export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  onLoad,
  onError,
}: SafeImageProps) {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    onError?.();
  };

  const handleLoad = () => {
    onLoad?.();
  };

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${fallbackClassName}`}
        title={`Erreur chargement: ${alt}`}
      >
        <ImageOff className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
