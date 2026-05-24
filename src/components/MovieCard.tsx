import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { Movie } from "@/lib/supabase";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to="/watch/$id"
      params={{ id: movie.id }}
      className="group relative flex-shrink-0 w-[180px] sm:w-[220px] aspect-[2/3] rounded-md overflow-hidden bg-card transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-gold-glow"
    >
      {movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
          <span className="font-display text-foreground/40 text-2xl px-4 text-center">{movie.title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="rounded-full bg-primary text-primary-foreground p-2">
            <Play className="h-4 w-4 fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">
            {movie.year ?? ""}
            {movie.duration_minutes ? ` • ${movie.duration_minutes} min` : ""}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-foreground line-clamp-2">{movie.title}</h3>
      </div>
    </Link>
  );
}
