import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieRow } from "@/components/MovieRow";
import { Button } from "@/components/ui/button";
import { Film, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("movies")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMovies((data as Movie[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Landing onCTA={() => navigate({ to: "/login" })} />;

  const hero = movies.find((m) => m.featured) ?? movies[0];
  const categories = Array.from(new Set(movies.map((m) => m.category)));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : movies.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {hero && <HeroBanner movie={hero} />}
          <div className="relative z-10 -mt-32 pb-20">
            {categories.map((cat) => (
              <MovieRow key={cat} title={cat} movies={movies.filter((m) => m.category === cat)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Landing({ onCTA }: { onCTA: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--gold)_/_0.12,_transparent_60%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-display text-3xl font-bold text-gradient-gold">Lumière</span>
        </div>
        <Button onClick={onCTA} size="sm">Connexion</Button>
      </header>
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <span className="inline-block text-xs uppercase tracking-[0.3em] text-primary mb-6">
          Maison de production
        </span>
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
          Films, musique,
          <br />
          <span className="text-gradient-gold">une seule maison.</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Découvrez les films, les artistes et le merch officiel de Lumière. Tout l'univers du label, en un seul endroit.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" onClick={onCTA} className="font-semibold text-base px-8 shadow-gold-glow">
            Entrer dans l'univers
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">Déjà membre ?</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <Film className="h-16 w-16 text-primary mb-4" />
      <h2 className="font-display text-3xl font-bold mb-2">Le catalogue est vide</h2>
      <p className="text-muted-foreground mb-6">Aucun film n'a encore été ajouté.</p>
    </div>
  );
}
