import { Link } from "@tanstack/react-router";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/lib/supabase";

export function HeroBanner({ movie }: { movie: Movie }) {
  return (
    <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden">
      {movie.backdrop_url || movie.poster_url ? (
        <img
          src={movie.backdrop_url ?? movie.poster_url!}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-background" />
      )}
      <div className="absolute inset-0 bg-cinema-fade" />
      <div className="absolute inset-0 bg-cinema-side" />

      <div className="relative h-full flex items-end pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {movie.featured && (
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-primary mb-3">
                À la une
              </span>
            )}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] mb-4">
              {movie.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              {movie.year && <span>{movie.year}</span>}
              {movie.genre && <span>• {movie.genre}</span>}
              {movie.duration_minutes && <span>• {movie.duration_minutes} min</span>}
            </div>
            {movie.description && (
              <p className="text-base sm:text-lg text-foreground/85 mb-6 line-clamp-3 max-w-xl">
                {movie.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/watch/$id" params={{ id: movie.id }}>
                  <Play className="h-5 w-5 fill-current" /> Lecture
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/watch/$id" params={{ id: movie.id }}>
                  <Info className="h-5 w-5" /> Plus d'infos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
