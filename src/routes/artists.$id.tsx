import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Artist, type Track, type Merch } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Play, Pause, Film as FilmIcon, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/artists/$id")({
  component: ArtistDetail,
});

function ArtistDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [merch, setMerch] = useState<Merch[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const [a, t, m] = await Promise.all([
        supabase.from("artists").select("*").eq("id", id).maybeSingle(),
        supabase.from("tracks").select("*").eq("artist_id", id).order("created_at", { ascending: false }),
        supabase.from("merch").select("*").eq("artist_id", id).order("created_at", { ascending: false }),
      ]);
      setArtist((a.data as Artist) ?? null);
      setTracks((t.data as Track[]) ?? []);
      setMerch((m.data as Merch[]) ?? []);
      setLoading(false);
    })();
  }, [id, user, authLoading, navigate]);

  const toggle = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const a = new Audio(track.audio_url);
      audioRef.current = a;
      a.play();
      a.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!artist) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="pt-32 text-center text-muted-foreground">Artiste introuvable.</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative h-[50vh] min-h-[360px] w-full overflow-hidden">
        {artist.cover_url ? (
          <img src={artist.cover_url} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
        )}
        <div className="absolute inset-0 bg-cinema-fade" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-10">
          <div className="flex items-end gap-6">
            {artist.photo_url && (
              <img src={artist.photo_url} alt={artist.name} className="hidden sm:block w-40 h-40 rounded-full object-cover border-4 border-background shadow-gold-glow" />
            )}
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-primary">Artiste</span>
              <h1 className="font-display text-4xl sm:text-6xl font-bold mt-2">{artist.name}</h1>
              {artist.genre && <p className="text-muted-foreground mt-1">{artist.genre}</p>}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {artist.bio && (
          <section className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold mb-3">Biographie</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{artist.bio}</p>
          </section>
        )}

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Discographie</h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">Aucun titre publié.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
                  <span className="w-6 text-center text-muted-foreground text-sm">{i + 1}</span>
                  <div className="w-12 h-12 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {t.cover_url && <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">{t.release_year ?? "—"}</p>
                  </div>
                  {t.video_url && (
                    <Button asChild size="sm" variant="ghost"><a href={t.video_url} target="_blank" rel="noreferrer"><FilmIcon className="h-4 w-4" /></a></Button>
                  )}
                  <Button size="icon" variant={playingId === t.id ? "default" : "secondary"} onClick={() => toggle(t)} className="rounded-full h-10 w-10">
                    {playingId === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {merch.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Merchandising</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {merch.map((m) => (
                <Link key={m.id} to="/merch" className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition">
                  <div className="aspect-square bg-secondary">
                    {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />}
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
