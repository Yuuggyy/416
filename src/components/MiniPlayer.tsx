import { Play, Pause, X, ExternalLink } from "lucide-react";
import { usePlayer, getSpotifyEmbedUrl } from "@/lib/player";
import { Button } from "@/components/ui/button";

export function MiniPlayer() {
  const { current, playing, progress, toggle, stop, seek } = usePlayer();
  if (!current) return null;
  const embed = getSpotifyEmbedUrl(current.spotify_url);
  const spotifyOnly = !current.audio_url && !!embed;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border">
      {!spotifyOnly && (
        <div
          className="h-1 bg-secondary cursor-pointer"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      {spotifyOnly ? (
        // Visible Spotify player — stays inside the app, counts as a real Spotify stream
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <iframe
              key={current.id + (playing ? "-on" : "-off")}
              title={`${current.title} — ${current.artist}`}
              src={`${embed}${playing ? "&autoplay=1" : ""}`}
              width="100%"
              height="80"
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded"
            />
          </div>
          <Button size="icon" variant="ghost" onClick={stop} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
            {current.cover_url && <img src={current.cover_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{current.title}</p>
            <p className="text-xs text-muted-foreground truncate">{current.artist}</p>
          </div>
          {embed && (
            <a
              href={current.spotify_url!}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              title="Ouvrir sur Spotify"
            >
              Spotify <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button size="icon" variant="default" className="rounded-full h-10 w-10" onClick={toggle}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={stop} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Hidden Spotify scrobble when we DO have an MP3 playing (best-effort stream count) */}
      {!spotifyOnly && embed && playing && (
        <iframe
          title="Spotify stream"
          src={`${embed}&autoplay=1`}
          width="0"
          height="0"
          style={{ position: "absolute", width: 0, height: 0, border: 0, opacity: 0, pointerEvents: "none" }}
          allow="autoplay; encrypted-media"
        />
      )}
    </div>
  );
}
