import { Play, Pause, X, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { usePlayer, getSpotifyEmbedUrl } from "@/lib/player";
import { useState } from "react";

function extractSpotifyTrackId(url?: string | null): string | null {
  if (!url) return null;
  return url.match(/spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/)?.[1] ?? null;
}

function openInSpotify(spotifyUrl: string) {
  const id = extractSpotifyTrackId(spotifyUrl);
  if (!id) { window.open(spotifyUrl, "_blank", "noopener,noreferrer"); return; }
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const start = Date.now();
    window.location.href = `spotify://track/${id}`;
    setTimeout(() => {
      if (Date.now() - start < 2000 && document.visibilityState === "visible") {
        window.open(spotifyUrl, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  } else {
    window.open(spotifyUrl, "_blank", "noopener,noreferrer");
  }
}

export function MiniPlayer() {
  const { current, playing, progress, toggle, stop, seek } = usePlayer();
  const [expanded, setExpanded] = useState(false);
  if (!current) return null;

  const embed = getSpotifyEmbedUrl(current.spotify_url);
  const spotifyOnly = !current.audio_url && !!embed;

  // ── Version compacte (défaut mobile) ──
  if (!expanded && !spotifyOnly) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 safe-area-bottom">
        {/* Barre de progression fine */}
        <div
          className="h-0.5 bg-secondary cursor-pointer"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Barre compacte */}
        <div className="bg-card/97 backdrop-blur-md border-t border-border px-3 py-2 flex items-center gap-3">
          {/* Cover */}
          <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
            {current.cover_url
              ? <img src={current.cover_url} alt={current.title} className="w-full h-full object-cover" />
              : <span className="text-lg">🎵</span>
            }
          </div>

          {/* Titre + artiste — flex-1 avec overflow */}
          <div className="flex-1 min-w-0" onClick={() => setExpanded(true)}>
            <p className="text-sm font-semibold truncate text-foreground">{current.title}</p>
            <p className="text-xs text-muted-foreground truncate">{current.artist}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform"
            >
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <button
              onClick={stop}
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground active:scale-90 transition-transform"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Version étendue (Spotify embed ou player développé) ──
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 safe-area-bottom">
      <div className="bg-card/97 backdrop-blur-md border-t border-border">
        {/* Handle drag + toggle */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {current.cover_url && (
              <img src={current.cover_url} alt={current.title} className="w-9 h-9 rounded-md object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{current.title}</p>
              <p className="text-xs text-muted-foreground truncate">{current.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!spotifyOnly && (
              <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform">
                {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
            )}
            <button onClick={() => setExpanded(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground active:scale-90">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button onClick={stop} className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground active:scale-90">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        {!spotifyOnly && (
          <div
            className="mx-4 h-1 bg-secondary rounded-full cursor-pointer mb-2"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <div className="h-full bg-primary rounded-full transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Spotify embed */}
        {spotifyOnly && embed && (
          <div className="px-3 pb-3">
            <iframe
              src={embed}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
            {current.spotify_url && (
              <button
                onClick={() => openInSpotify(current.spotify_url!)}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#1DB954] font-medium mx-auto"
              >
                <ExternalLink className="h-3 w-3" /> Ouvrir dans Spotify
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
