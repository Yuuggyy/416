import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type PlayableTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url?: string | null;
  cover_url?: string | null;
  spotify_url?: string | null;
};

type PlayerCtx = {
  current: PlayableTrack | null;
  playing: boolean;
  progress: number; // 0..1
  duration: number; // seconds
  play: (track: PlayableTrack) => void;
  toggle: () => void;
  stop: () => void;
  seek: (ratio: number) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

function extractSpotifyId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/);
  return m?.[1] ?? null;
}
export function getSpotifyEmbedUrl(url?: string | null): string | null {
  const id = extractSpotifyId(url);
  return id ? `https://open.spotify.com/embed/track/${id}?utm_source=416` : null;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayableTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;
    const onTime = () => {
      if (!a.duration) return;
      setProgress(a.currentTime / a.duration);
      setDuration(a.duration);
    };
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // Media Session API — enables lockscreen / background controls on mobile
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: "416 Records",
      artwork: current.cover_url
        ? [
            { src: current.cover_url, sizes: "256x256", type: "image/jpeg" },
            { src: current.cover_url, sizes: "512x512", type: "image/jpeg" },
          ]
        : [],
    });
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime;
    });
  }, [current]);

  const play = (track: PlayableTrack) => {
    const a = audioRef.current;
    if (!a) return;
    if (current?.id === track.id) {
      a.play();
      return;
    }
    a.pause();
    a.src = track.audio_url;
    a.currentTime = 0;
    setCurrent(track);
    setProgress(0);
    a.play().catch(() => setPlaying(false));
  };
  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play();
    else a.pause();
  };
  const stop = () => {
    audioRef.current?.pause();
    setCurrent(null);
    setPlaying(false);
  };
  const seek = (ratio: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = Math.max(0, Math.min(1, ratio)) * a.duration;
  };

  return <Ctx.Provider value={{ current, playing, progress, duration, play, toggle, stop, seek }}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used inside PlayerProvider");
  return v;
}