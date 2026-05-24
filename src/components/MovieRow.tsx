import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/lib/supabase";
import { MovieCard } from "./MovieCard";

export function MovieRow({ title, movies }: { title: string; movies: Movie[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (!movies.length) return null;

  return (
    <section className="relative py-4 group/row">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground px-4 sm:px-6 lg:px-8 mb-3">
        {title}
      </h2>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Précédent"
        >
          <ChevronLeft className="h-8 w-8 text-foreground" />
        </button>
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 scroll-smooth pb-6"
        >
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Suivant"
        >
          <ChevronRight className="h-8 w-8 text-foreground" />
        </button>
      </div>
    </section>
  );
}
