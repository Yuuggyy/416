import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Movie, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon, Music } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "Rechercher — 416 Records" }] }),
});

function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    Promise.all([
      supabase.from("movies").select("*").order("title"),
      supabase.from("artists").select("*").order("name"),
    ]).then(([m, a]) => {
      setMovies((m.data as Movie[]) ?? []);
      setArtists((a.data as Artist[]) ?? []);
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  const term = q.trim().toLowerCase();
  const movieResults = useMemo(() => {
    if (!term) return movies;
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        (m.genre ?? "").toLowerCase().includes(term) ||
        (m.category ?? "").toLowerCase().includes(term) ||
        (m.description ?? "").toLowerCase().includes(term),
    );
  }, [term, movies]);
  const artistResults = useMemo(() => {
    if (!term) return artists;
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        (a.genre ?? "").toLowerCase().includes(term) ||
        (a.bio ?? "").toLowerCase().includes(term),
    );
  }, [term, artists]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Rechercher</h1>
        <div className="relative max-w-2xl mb-10">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Titre, artiste, genre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : movieResults.length === 0 && artistResults.length === 0 ? (
          <p className="text-muted-foreground">Aucun résultat pour "{q}".</p>
        ) : (
          <div className="space-y-12">
            {artistResults.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-4 flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Artistes</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {artistResults.map((a) => (
                    <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group">
                      <div className="aspect-square rounded-full overflow-hidden bg-secondary border border-border group-hover:border-primary/60 transition-all">
                        {a.photo_url ? (
                          <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Music className="h-8 w-8 text-muted-foreground" /></div>
                        )}
                      </div>
                      <p className="mt-2 text-center text-sm font-semibold truncate group-hover:text-primary">{a.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {movieResults.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-4">Films</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movieResults.map((m) => <MovieCard key={m.id} movie={m} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
