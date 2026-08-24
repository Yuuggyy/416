/**
 * Optimise les URLs d'images via wsrv.nl (proxy de resize/compression gratuit).
 * - Images Supabase: proxy via wsrv.nl avec resize + webp
 * - Images externes: proxy via wsrv.nl si possible
 * - Images locales: retourne tel quel
 */
function encodeUrl(url: string): string {
  return encodeURIComponent(url);
}

/**
 * Retourne l'URL optimisée pour l'affichage principal.
 */
export function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  // Pour les images Supabase, utiliser wsrv.nl
  if (url.includes("supabase.co") || url.includes("supabase.in")) {
    return `https://wsrv.nl/?url=${encodeUrl(url)}&w=${width}&q=${quality}&output=webp`;
  }
  // Pour les autres URLs HTTPS, utiliser wsrv.nl aussi
  if (url.startsWith("https://") && !url.startsWith("data:")) {
    return `https://wsrv.nl/?url=${encodeUrl(url)}&w=${width}&q=${quality}&output=webp`;
  }
  return url;
}

/**
 * Retourne une version minuscule (placeholder flou) pour l'effet blur-up.
 */
export function imgPlaceholder(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes("supabase.co") || url.includes("supabase.in")) {
    return `https://wsrv.nl/?url=${encodeUrl(url)}&w=32&q=30&blur=3&output=webp`;
  }
  if (url.startsWith("https://") && !url.startsWith("data:")) {
    return `https://wsrv.nl/?url=${encodeUrl(url)}&w=32&q=30&blur=3&output=webp`;
  }
  return url;
}
