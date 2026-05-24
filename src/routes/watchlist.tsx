import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  component: WatchlistPage,
  head: () => ({ meta: [{ title: "Ma liste — Lumière" }] }),
});

function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("movie:movies(*)")
        .eq("user_id", user.id);
      const list = ((data ?? []) as unknown as Array<{ movie: Movie | null }>)
        .map((r) => r.movie)
        .filter((m): m is Movie => !!m);
      setMovies(list);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Ma liste</h1>
        <p className="text-muted-foreground mb-8">Vos films à voir, prêts à être lancés.</p>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : movies.length === 0 ? (
          <p className="text-muted-foreground">Aucun film dans votre liste pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </main>
    </div>
  );
}
