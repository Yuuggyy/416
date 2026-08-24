import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  component: WatchlistPage,
  head: () => ({ meta: [{ title: "Ma liste — 416 Records" }] }),
});

function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data } = await supabase
        .from("watchlist")
        .select("movie:movies(id,title,poster_url,category,genre,year,created_at,featured)")
        .eq("user_id", user.id);
      if (aborted.current) return;
      const list = ((data ?? []) as unknown as Array<{ movie: Movie | null }>)
        .map((r) => r.movie).filter((m): m is Movie => !!m);
      setMovies(list);
      setLoading(false);
    })();
    return () => { aborted.current = true; };
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Ma liste</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : movies.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Votre liste est vide. Ajoutez des films depuis leur page.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </main>
    </div>
  );
}
