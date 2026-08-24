import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Music, Loader2 } from "lucide-react";

export const Route = createFileRoute("/artists/")({
  component: ArtistsPage,
  head: () => ({ meta: [{ title: "Artistes — 416 Records" }] }),
});

function ArtistsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("artists").select("id,name,photo_url,genre,featured,created_at").order("featured", { ascending: false }).order("created_at", { ascending: false }).then(({ data }) => {
      if (aborted.current) return;
      setArtists((data as Artist[]) ?? []);
      setLoading(false);
    });
    return () => { aborted.current = true; };
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Artistes</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucun artiste pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {artists.map((a) => (
              <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border group-hover:border-primary/60 transition-all shadow-lg group-hover:shadow-gold-glow">
                  {a.photo_url ? <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Music className="h-10 w-10 text-muted-foreground" /></div>}
                </div>
                <h3 className="mt-2 font-semibold text-sm group-hover:text-primary transition-colors">{a.name}</h3>
                {a.genre && <p className="text-xs text-muted-foreground">{a.genre}</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
