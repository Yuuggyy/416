import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { Movie } from "@/lib/supabase";

function isNew(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 1000 * 60 * 60 * 24 * 14;
}

function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  return url;
}

export function MovieCard({ movie }: { movie: Movie }) {
  const newBadge = isNew(movie.created_at);
  // Poster : 300px max sur mobile (card ~140px), 400px sur desktop
  const posterSrc = imgUrl(movie.poster_url, 300);

  return (
    <Link
      to="/watch/$id"
      params={{ id: movie.id }}
      className="group relative flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-gold-glow active:scale-95"
    >
      {posterSrc ? (
        <img
          src={posterSrc}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
          <span className="font-display text-foreground/40 text-xl sm:text-2xl px-3 text-center">{movie.title}</span>
        </div>
      )}

      {newBadge && (
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-md">
          Nouveau
        </span>
      )}

      <div className="sm:hidden absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-8">
        <h3 className="font-semibold text-xs text-white line-clamp-2 leading-tight">{movie.title}</h3>
        {movie.year && <p className="text-[10px] text-white/60 mt-0.5">{movie.year}</p>}
      </div>

      <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-3">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-gold-glow transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </div>
        </div>
        <h3 className="font-semibold text-sm text-white line-clamp-2 leading-tight">{movie.title}</h3>
        {movie.year && <p className="text-xs text-white/60 mt-0.5">{movie.year}</p>}
      </div>
    </Link>
  );
}
