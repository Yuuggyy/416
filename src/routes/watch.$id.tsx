import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Plus, Check, Share2, Clock, Calendar, Tag } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { toast } from "sonner";


function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  return url;
}

export const Route = createFileRoute("/watch/$id")({
  component: WatchPage,
});

function WatchPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
      const m = data as Movie | null;
      setMovie(m);
      if (m) {
        const { data: wl } = await supabase.from("watchlist").select("movie_id")
          .eq("user_id", user.id).eq("movie_id", id).maybeSingle();
        setInList(!!wl);
        // Suggestions: même catégorie, sauf ce film
        const { data: sugg } = await supabase.from("movies").select("*")
          .eq("category", m.category).neq("id", id).limit(8);
        if (sugg && sugg.length > 0) {
          setSuggestions(sugg as Movie[]);
        } else {
          // Si pas assez dans la même catégorie, prendre les derniers
          const { data: recent } = await supabase.from("movies").select("id,title,poster_url,category,genre,year,created_at,featured")
            .neq("id", id).order("created_at", { ascending: false }).limit(8);
          setSuggestions((recent as Movie[]) ?? []);
        }
      }
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  const toggleList = async () => {
    if (!user || !movie) return;
    if (inList) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", movie.id);
      setInList(false);
      toast.success("Retiré de ma liste");
    } else {
      await supabase.from("watchlist").insert({ user_id: user.id, movie_id: movie.id });
      setInList(true);
      toast.success("Ajouté à ma liste");
    }
  };

  const share = async () => {
    if (!movie) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: movie.title, text: `Regarde « ${movie.title} » sur 416 Records`, url });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Film introuvable.</p>
      </div>
    );
  }

  const isYouTube = /youtu\.?be/.test(movie.video_url);
  const ytId = isYouTube
    ? movie.video_url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Bouton retour flottant */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </button>
      </div>

      {/* Player — sticky sur mobile */}
      <div className="sticky top-0 z-40 bg-black w-full" style={{ aspectRatio: "16/9", maxHeight: "56vw" }}>
        {ytId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0`}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={movie.video_url}
            controls
            autoPlay
            playsInline
            className="w-full h-full"
            poster={imgUrl(movie.backdrop_url ?? movie.poster_url, 800, 80) || undefined}
          />
        )}
      </div>

      {/* Infos film */}
      <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto">
        {/* Titre + actions */}
        <div className="mb-4">
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2 leading-tight">{movie.title}</h1>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.year && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Calendar className="h-3 w-3" /> {movie.year}
              </span>
            )}
            {movie.genre && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" /> {movie.genre}
              </span>
            )}
            {movie.duration_minutes && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" /> {movie.duration_minutes} min
              </span>
            )}
            <span className="inline-flex items-center text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium">
              {movie.category}
            </span>
          </div>

          {/* Boutons actions — taille tactile sur mobile */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleList}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                inList
                  ? "bg-secondary text-foreground border border-border"
                  : "bg-primary text-primary-foreground shadow-gold-glow"
              }`}
            >
              {inList ? <><Check className="h-4 w-4" /> Ma liste</> : <><Plus className="h-4 w-4" /> Ma liste</>}
            </button>
            <button
              onClick={share}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-secondary text-foreground border border-border transition-all active:scale-95"
            >
              <Share2 className="h-4 w-4" /> Partager
            </button>
          </div>
        </div>

        {/* Description avec expand/collapse sur mobile */}
        {movie.description && (
          <div className="mb-6">
            <p className={`text-sm sm:text-base text-foreground/85 leading-relaxed ${descExpanded ? "" : "line-clamp-3 sm:line-clamp-none"}`}>
              {movie.description}
            </p>
            <button
              className="sm:hidden text-xs text-primary mt-1 font-medium"
              onClick={() => setDescExpanded((v) => !v)}
            >
              {descExpanded ? "Voir moins" : "Voir plus"}
            </button>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="font-display text-lg sm:text-2xl font-semibold mb-3 text-foreground">
              À voir aussi
            </h2>
            {/* Scroll horizontal sur mobile, grille sur desktop */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible">
              {suggestions.map((s) => (
                <div key={s.id} className="flex-shrink-0 w-[140px] sm:w-auto">
                  <MovieCard movie={s} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
