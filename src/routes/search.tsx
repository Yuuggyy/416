import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "Rechercher — Lumière" }] }),
});

function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("movies").select("*").order("title").then(({ data }) => {
      setAll((data as Movie[]) ?? []);
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        (m.genre ?? "").toLowerCase().includes(term) ||
        (m.category ?? "").toLowerCase().includes(term) ||
        (m.description ?? "").toLowerCase().includes(term),
    );
  }, [q, all]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Rechercher</h1>
        <div className="relative max-w-2xl mb-10">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Titre, genre, catégorie..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground">Aucun résultat pour "{q}".</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{results.length} titre{results.length > 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
