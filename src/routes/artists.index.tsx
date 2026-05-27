import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Loader2, Music } from "lucide-react";

export const Route = createFileRoute("/artists/")({
  component: ArtistsPage,
  head: () => ({ meta: [{ title: "Artistes — 416 Records" }] }),
});

function ArtistsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("artists").select("*").order("featured", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => { setArtists((data as Artist[]) ?? []); setLoading(false); });
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Notre roster</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Artistes du label</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Découvrez les voix de la maison 416 Records. Musique, clips et exclusivités.</p>
        </div>

        {artists.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            Aucun artiste pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {artists.map((a) => (
              <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group">
                <div className="aspect-square rounded-full overflow-hidden bg-secondary border border-border group-hover:border-primary/60 transition-all shadow-lg group-hover:shadow-gold-glow">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Music className="h-10 w-10 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{a.name}</h3>
                  {a.genre && <p className="text-xs text-muted-foreground truncate">{a.genre}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
