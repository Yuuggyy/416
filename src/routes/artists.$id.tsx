import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Artist, type Track, type Merch } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Play, Pause, Film as FilmIcon, ShoppingBag } from "lucide-react";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/artists/$id")({
  component: ArtistDetail,
});

function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  return url;
}

function ArtistDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [merch, setMerch] = useState<Merch[]>([]);
  const [loading, setLoading] = useState(true);
  const { current, playing, play, toggle } = usePlayer();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [a, t, m] = await Promise.all([
        supabase.from("artists").select("*").eq("id", id).maybeSingle(),
        supabase.from("tracks").select("id,artist_id,title,audio_url,video_url,cover_url,duration_seconds,release_year,spotify_url,created_at").eq("artist_id", id).order("created_at", { ascending: false }),
        supabase.from("merch").select("id,name,image_url,price,currency,in_stock,external_url,artist_id").eq("artist_id", id).order("created_at", { ascending: false }),
      ]);
      setArtist((a.data as Artist) ?? null);
      setTracks((t.data as Track[]) ?? []);
      setMerch((m.data as Merch[]) ?? []);
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  const handlePlay = (t: Track) => {
    if (current?.id === t.id) { toggle(); }
    else {
      play({
        id: t.id, title: t.title, artist: artist?.name ?? "",
        audio_url: t.audio_url,
        cover_url: t.cover_url ?? artist?.photo_url ?? null,
        spotify_url: t.spotify_url ?? null,
      });
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!artist) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="pt-32 text-center text-muted-foreground">Artiste introuvable.</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero cover — 1200px desktop, 800px mobile */}
      <div className="relative h-[50vh] min-h-[320px] sm:min-h-[360px] w-full overflow-hidden">
        {artist.cover_url ? (
          <picture>
            <source media="(max-width: 640px)" srcSet={imgUrl(artist.cover_url, 800, 75)} />
            <img
              src={imgUrl(artist.cover_url, 1200, 80)}
              alt={artist.name}
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
        )}
        <div className="absolute inset-0 bg-cinema-fade" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8 sm:pb-10">
          <div className="flex items-end gap-4 sm:gap-6 min-w-0 w-full">
            {artist.photo_url && (
              <img
                src={imgUrl(artist.photo_url, 200)}
                alt={artist.name}
                className="hidden sm:block w-40 h-40 rounded-full object-cover border-4 border-background shadow-gold-glow shrink-0"
                loading="eager"
                decoding="async"
              />
            )}
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-[0.3em] text-primary">Artiste</span>
              <h1 className="font-display text-3xl sm:text-6xl font-bold mt-2 break-words">{artist.name}</h1>
              {artist.genre && <p className="text-muted-foreground mt-1 text-sm sm:text-base">{artist.genre}</p>}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-10">
        {artist.bio && (
          <section className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold mb-3">Biographie</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{artist.bio}</p>
          </section>
        )}

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" /> Discographie
          </h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">Aucun titre publié.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl active:scale-[0.99] transition-transform">
                  <span className="w-5 text-center text-muted-foreground text-sm shrink-0">{i + 1}</span>
                  <div className="w-11 h-11 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {t.cover_url && (
                      <img
                        src={imgUrl(t.cover_url, 88)}
                        alt={t.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-sm">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.release_year ?? "—"}</p>
                  </div>
                  {t.video_url && (
                    <a href={t.video_url} target="_blank" rel="noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-90 transition-transform">
                      <FilmIcon className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handlePlay(t)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0 ${
                      current?.id === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {current?.id === t.id && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {merch.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> Merchandising
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {merch.map((m) => (
                <Link key={m.id} to="/merch"
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 active:scale-95 transition-all">
                  <div className="aspect-square bg-secondary overflow-hidden">
                    {m.image_url && (
                      <img
                        src={imgUrl(m.image_url, 300)}
                        alt={m.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate text-sm">{m.name}</h3>
                    {m.price != null && <p className="text-primary text-sm font-semibold">{m.price} {m.currency}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
