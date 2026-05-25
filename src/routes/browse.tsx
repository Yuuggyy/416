import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({ meta: [{ title: "Parcourir — Lumière" }] }),
});

function BrowsePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Tous");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("movies").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setMovies((data as Movie[]) ?? []);
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  const categories = useMemo(
    () => ["Tous", ...Array.from(new Set(movies.map((m) => m.category).filter(Boolean)))],
    [movies],
  );
  const visible = filter === "Tous" ? movies : movies.filter((m) => m.category === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Parcourir</h1>
        <p className="text-muted-foreground mb-6">Tout le catalogue, en un coup d'œil.</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={filter === c ? "default" : "secondary"}
              onClick={() => setFilter(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground">Aucun titre dans cette catégorie.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visible.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </main>
    </div>
  );
}
