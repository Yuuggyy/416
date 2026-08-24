import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Artist, type Track, type Merch } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Play, Pause, Film as FilmIcon, ShoppingBag } from "lucide-react";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/artists/$id")({ component: ArtistDetail });

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
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [a, t, m] = await Promise.all([
        supabase.from("artists").select("*").eq("id", id).maybeSingle(),
        supabase.from("tracks").select("id,artist_id,title,audio_url,video_url,cover_url,duration_seconds,release_year,spotify_url,created_at").eq("artist_id", id).order("created_at", { ascending: false }),
        supabase.from("merch").select("id,name,image_url,price,currency,in_stock,external_url,artist_id").eq("artist_id", id).order("created_at", { ascending: false }),
      ]);
      if (aborted.current) return;
      setArtist(a.data as Artist | null);
      setTracks((t.data as Track[]) ?? []);
      setMerch((m.data as Merch[]) ?? []);
      setLoading(false);
    })();
    return () => { aborted.current = true; };
  }, [id, user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Artiste introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero cover */}
      {artist.cover_url && (
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img src={artist.cover_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 ${artist.cover_url ? "-mt-20" : "pt-24 sm:pt-28"} pb-20`}>
        {/* Header */}
        <div className="flex items-end gap-4 mb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-secondary border-4 border-background shadow-xl shrink-0">
            {artist.photo_url ? <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="h-10 w-10 text-muted-foreground" /></div>}
          </div>
          <div className="min-w-0 pb-2">
            <h1 className="font-display text-3xl sm:text-5xl font-bold truncate">{artist.name}</h1>
            {artist.genre && <p className="text-muted-foreground mt-1">{artist.genre}</p>}
          </div>
        </div>
        {artist.bio && <p className="text-foreground/80 leading-relaxed mb-8 max-w-3xl">{artist.bio}</p>}

        {/* Tracks */}
        {tracks.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-2xl font-semibold mb-4">Morceaux</h2>
            <div className="space-y-2">
              {tracks.map((t) => {
                const isCurrent = current?.id === t.id;
                const isThisPlaying = isCurrent && playing;
                return (
                  <div key={t.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
                    <button
                      onClick={() => isCurrent ? toggle() : play({ id: t.id, title: t.title, artist: artist.name, audio_url: t.audio_url, cover_url: t.cover_url, spotify_url: t.spotify_url })}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    >
                      {isThisPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCurrent ? "text-primary" : ""}`}>{t.title}</p>
                      {t.duration_seconds && <p className="text-xs text-muted-foreground">{Math.floor(t.duration_seconds / 60)}:{(t.duration_seconds % 60).toString().padStart(2, "0")}</p>}
                    </div>
                    {t.video_url && (
                      <Link to="/watch/$id" params={{ id: t.video_url }}>
                        <Button variant="ghost" size="sm" aria-label="Clip"><FilmIcon className="h-4 w-4" /></Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Merch */}
        {merch.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Merch</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {merch.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-secondary">
                    {m.image_url ? <img src={imgUrl(m.image_url, 300)} alt={m.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-sm text-primary font-semibold mt-1">{m.price} {m.currency}</p>
                    {m.external_url && <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary mt-1 block">Acheter →</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
