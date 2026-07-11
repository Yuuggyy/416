import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Loader2, Music } from "lucide-react";


function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  return url;
}

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
    supabase.from("artists").select("id,name,photo_url,genre,featured,bio,created_at")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => { setArtists((data as Artist[]) ?? []); setLoading(false); });
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Notre roster</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-1">Artistes du label</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl">
            Découvrez les voix de la maison 416 Records. Musique, clips et exclusivités.
          </p>
        </div>

        {artists.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            Aucun artiste pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {artists.map((a) => (
              <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group">
                {/* Photo */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary border border-border group-hover:border-primary/60 group-active:scale-95 transition-all shadow-lg group-hover:shadow-gold-glow">
                  {a.photo_url ? (
                    <img src={imgUrl(a.photo_url, 300)} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {/* Badge featured */}
                  {a.featured && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      ★ Vedette
                    </span>
                  )}
                  {/* Overlay hover desktop */}
                  <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                    <span className="text-white text-sm font-semibold">Voir profil →</span>
                  </div>
                </div>

                {/* Infos */}
                <div className="mt-2.5 px-0.5">
                  <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">{a.name}</h3>
                  {a.genre && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{a.genre}</p>
                  )}
                  {a.bio && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 hidden sm:block leading-relaxed">
                      {a.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
