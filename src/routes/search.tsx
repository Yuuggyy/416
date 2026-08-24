import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Movie, type Artist, type Track } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "Rechercher — 416 Records" }] }),
});

function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ movies: Movie[]; artists: Artist[]; tracks: Track[] }>({ movies: [], artists: [], tracks: [] });
  const [loading, setLoading] = useState(false);
  const aborted = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    return () => { aborted.current = true; };
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !q.trim()) { setResults({ movies: [], artists: [], tracks: [] }); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const [m, a, t] = await Promise.all([
        supabase.from("movies").select("id,title,poster_url,category,genre,year,created_at,featured").ilike("title", `%${q}%`).limit(20),
        supabase.from("artists").select("id,name,photo_url,genre,featured,created_at").ilike("name", `%${q}%`).limit(20),
        supabase.from("tracks").select("id,artist_id,title,audio_url,video_url,cover_url,duration_seconds,release_year,created_at,spotify_url").ilike("title", `%${q}%`).limit(20),
      ]);
      if (aborted.current) return;
      setResults({
        movies: (m.data as Movie[]) ?? [],
        artists: (a.data as Artist[]) ?? [],
        tracks: (t.data as Track[]) ?? [],
      });
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q, user]);

  const hasResults = results.movies.length > 0 || results.artists.length > 0 || results.tracks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Rechercher</h1>
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Films, artistes, morceaux..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11 h-12 text-base"
            autoFocus
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && !q.trim() && (
          <p className="text-muted-foreground text-center py-12">Commence à taper pour chercher dans le catalogue.</p>
        )}

        {!loading && q.trim() && !hasResults && (
          <p className="text-muted-foreground text-center py-12">Aucun résultat pour « {q} ».</p>
        )}

        {hasResults && (
          <div className="space-y-10">
            {results.movies.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">Films ({results.movies.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.movies.map((m) => <MovieCard key={m.id} movie={m} />)}
                </div>
              </section>
            )}
            {results.artists.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">Artistes ({results.artists.length})</h2>
                <div className="flex gap-4 flex-wrap">
                  {results.artists.map((a) => (
                    <div key={a.id} className="text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border border-border">
                        {a.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🎤</div>}
                      </div>
                      <p className="mt-2 text-sm font-medium">{a.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {results.tracks.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold mb-4">Morceaux ({results.tracks.length})</h2>
                <div className="space-y-2">
                  {results.tracks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-lg">🎵</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {results.artists.find(a => a.id === t.artist_id)?.name ?? "Artiste inconnu"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
