import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 24;
const MOVIE_COLS = "id,title,poster_url,category,genre,year,created_at,featured";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({ meta: [{ title: "Parcourir — 416 Records" }] }),
});

function BrowsePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Tous");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const aborted = useRef(false);

  const fetchPage = async (pageIndex: number, category: string, replace = false) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("movies")
      .select(MOVIE_COLS)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (category !== "Tous") q = q.eq("category", category);
    const { data } = await q;
    if (aborted.current) return;
    const items = (data as Movie[]) ?? [];
    setHasMore(items.length === PAGE_SIZE);
    setMovies((prev) => (replace ? items : [...prev, ...items]));
  };

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    setLoading(true);
    fetchPage(0, filter, true).then(() => {
      if (aborted.current) return;
      setPage(0);
      setLoading(false);
    });
    return () => { aborted.current = true; };
  }, [user, authLoading, navigate, filter]);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    await fetchPage(next, filter);
    if (!aborted.current) setPage(next);
    setLoadingMore(false);
  };

  const categories = useMemo(
    () => ["Tous", ...Array.from(new Set(movies.map((m) => m.category).filter(Boolean)))],
    [movies],
  );

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
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <p className="text-muted-foreground">Aucun titre dans cette catégorie.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Chargement...</> : "Voir plus"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
