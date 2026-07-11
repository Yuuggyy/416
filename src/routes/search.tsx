import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Movie, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon, Music } from "lucide-react";

const MOVIE_COLS = "id,title,poster_url,category,genre,year,created_at,featured";
const ARTIST_COLS = "id,name,photo_url,genre,featured";

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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = q.trim();
    if (!term) { setMovies([]); setArtists([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const pattern = `%${term}%`;
      const [m, a] = await Promise.all([
        supabase.from("movies").select(MOVIE_COLS).or(`title.ilike.${pattern},genre.ilike.${pattern},category.ilike.${pattern}`).limit(30),
        supabase.from("artists").select(ARTIST_COLS).or(`name.ilike.${pattern},genre.ilike.${pattern}`).limit(20),
      ]);
      setMovies((m.data as Movie[]) ?? []);
      setArtists((a.data as Artist[]) ?? []);
      setSearched(true);
      setLoading(false);
    }, 350);
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Rechercher</h1>
        <div className="relative max-w-xl mb-10">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titre, artiste, genre…"
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && !searched && (
          <p className="text-muted-foreground text-center py-16">Tapez pour lancer la recherche.</p>
        )}

        {!loading && searched && movies.length === 0 && artists.length === 0 && (
          <p className="text-muted-foreground text-center py-16">Aucun résultat pour « {q} ».</p>
        )}

        {!loading && artists.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-2xl font-semibold mb-4">Artistes</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {artists.map((a) => (
                <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group text-center">
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
                      : <div className="w-full h-full flex items-center justify-center"><Music className="h-8 w-8 text-muted-foreground" /></div>
                    }
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{a.name}</p>
                  {a.genre && <p className="text-xs text-muted-foreground truncate">{a.genre}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && movies.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Titres & Clips</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
