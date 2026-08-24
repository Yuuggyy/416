import { useState, useEffect } from "react";
import { imgUrl, imgPlaceholder } from "@/lib/image";

type SmartImageProps = {
  src: string | null | undefined;
  alt: string;
  width: number;
  quality?: number;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Image avec effet blur-up:
 * 1. Affiche un placeholder flou (32px) immédiatement
 * 2. Charge l'image pleine résolution en arrière-plan
 * 3. Fond la transition quand l'image est chargée
 */
export function SmartImage({
  src,
  alt,
  width,
  quality = 75,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = imgUrl(src, width, quality);
  const placeholderSrc = imgPlaceholder(src);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [optimizedSrc]);

  if (!src || error) {
    return (
      <div
        className={className}
        style={{ background: "var(--color-secondary)" }}
        aria-label={alt}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder flou */}
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(15px)",
            transform: "scale(1.1)",
            opacity: placeholderLoaded ? 0.6 : 0,
            transition: "opacity 0.3s ease",
          }}
          onLoad={() => setPlaceholderLoaded(true)}
          onError={() => setPlaceholderLoaded(false)}
        />
      )}

      {/* Image principale */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className="relative w-full h-full object-cover"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
