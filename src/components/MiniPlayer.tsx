import { Play, Pause, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { usePlayer } from "@/lib/player";
import { useState } from "react";

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const { current, playing, progress, duration, currentTime, toggle, stop, seek, openSpotify } = usePlayer();
  const [expanded, setExpanded] = useState(false);

  if (!current) return null;

  const spotifyOnly = !current.audio_url && !!current.spotify_url;

  // ── EXPANDED (full player) ──
  if (expanded) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 safe-area-bottom">
        <div className="bg-card/98 backdrop-blur-xl border-t border-border shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1 text-muted-foreground text-xs active:scale-95 transition-transform"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Cover + Info */}
          <div className="flex items-center gap-4 px-4 pb-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0 shadow-lg">
              {current.cover_url
                ? <img src={current.cover_url} alt={current.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{current.title}</p>
              <p className="text-xs text-muted-foreground truncate">{current.artist}</p>
              {spotifyOnly && (
                <span className="text-[10px] text-[#1DB954] font-semibold uppercase tracking-wide">Spotify</span>
              )}
            </div>
          </div>

          {/* Barre de progression */}
          {!spotifyOnly && (
            <div className="px-4 pb-1">
              <div
                className="h-1.5 bg-secondary rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  seek((e.clientX - rect.left) / rect.width);
                }}
              >
                <div
                  className="h-full bg-primary rounded-full relative transition-[width] duration-100"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{fmtTime(currentTime)}</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div className="flex items-center justify-center gap-6 py-3 px-4">
            {spotifyOnly ? (
              <button
                onClick={() => current.spotify_url && openSpotify(current.spotify_url)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-white text-sm font-bold active:scale-95 transition-transform shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans Spotify
              </button>
            ) : (
              <button
                onClick={toggle}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-gold-glow active:scale-90 transition-transform"
              >
                {playing
                  ? <Pause className="h-6 w-6 fill-current" />
                  : <Play className="h-6 w-6 fill-current ml-0.5" />
                }
              </button>
            )}
            <button
              onClick={stop}
              className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPACT (barre du bas) ──
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 safe-area-bottom">
      {/* Barre de progression fine */}
      {!spotifyOnly && (
        <div
          className="h-0.5 bg-secondary cursor-pointer"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <div className="bg-card/97 backdrop-blur-md border-t border-border px-3 py-2 flex items-center gap-3">
        {/* Cover — tap pour expand */}
        <button
          onClick={() => setExpanded(true)}
          className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0 flex items-center justify-center active:scale-90 transition-transform"
        >
          {current.cover_url
            ? <img src={current.cover_url} alt={current.title} className="w-full h-full object-cover" />
            : <span className="text-lg">🎵</span>
          }
        </button>

        {/* Titre + tap pour expand */}
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-semibold truncate text-foreground">{current.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {spotifyOnly ? <span className="text-[#1DB954]">Spotify</span> : current.artist}
          </p>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {spotifyOnly ? (
            <button
              onClick={() => current.spotify_url && openSpotify(current.spotify_url)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DB954] text-white text-xs font-bold active:scale-90 transition-transform"
            >
              <ExternalLink className="h-3 w-3" />
              Spotify
            </button>
          ) : (
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform"
            >
              {playing
                ? <Pause className="h-4 w-4 fill-current" />
                : <Play className="h-4 w-4 fill-current ml-0.5" />
              }
            </button>
          )}
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
