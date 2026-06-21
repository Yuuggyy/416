import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Plus, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/watch/$id")({
  component: WatchPage,
});

function WatchPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
      setMovie(data as Movie | null);
      const { data: wl } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", user.id)
        .eq("movie_id", id)
        .maybeSingle();
      setInList(!!wl);
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
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 left-4 z-50">
        <Button asChild variant="secondary" size="sm">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </Button>
      </div>

      <div className="bg-black w-full aspect-video max-h-[80vh]">
        {ytId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={movie.video_url} controls autoPlay className="w-full h-full" poster={movie.backdrop_url ?? movie.poster_url ?? undefined} />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-5xl font-bold mb-2 break-words">{movie.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {movie.year && <span>{movie.year}</span>}
              {movie.genre && <span>{movie.genre}</span>}
              {movie.duration_minutes && <span>{movie.duration_minutes} min</span>}
              <span className="text-primary">{movie.category}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={toggleList} variant={inList ? "secondary" : "default"}>
              {inList ? <><Check className="h-4 w-4" /> Dans ma liste</> : <><Plus className="h-4 w-4" /> Ma liste</>}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const url = typeof window !== "undefined" ? window.location.href : "";
                const shareData = { title: movie.title, text: `Regarde « ${movie.title} » sur 416 Records`, url };
                try {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    await navigator.share(shareData);
                    return;
                  }
                } catch (err) {
                  if ((err as DOMException)?.name === "AbortError") return;
                }
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Lien copié dans le presse-papier");
                } catch {
                  toast.error("Impossible de copier le lien");
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Partager le lien
            </Button>
          </div>
        </div>
        {movie.description && (
          <p className="text-foreground/85 leading-relaxed max-w-3xl">{movie.description}</p>
        )}
      </div>
    </div>
  );
}
