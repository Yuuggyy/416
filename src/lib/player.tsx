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
  progress: number;      // 0..1
  duration: number;      // seconds
  currentTime: number;   // seconds
  play: (track: PlayableTrack) => void;
  toggle: () => void;
  stop: () => void;
  seek: (ratio: number) => void;
  openSpotify: (url: string) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

function openSpotify(url: string) {
  const id = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/)?.[1];
  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );
  if (id && isMobile) {
    const t = Date.now();
    window.location.href = `spotify://track/${id}`;
    setTimeout(() => {
      if (Date.now() - t < 2000 && document.visibilityState === "visible") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayableTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Créer l'élément audio une seule fois
  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;

    const onTime = () => {
      if (!a.duration) return;
      setCurrentTime(a.currentTime);
      setProgress(a.currentTime / a.duration);
      setDuration(a.duration);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onLoaded = () => setDuration(a.duration);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("loadedmetadata", onLoaded);

    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  // Media Session API — contrôles lockscreen mobile
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !current) return;
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
      // Même track — juste play/resume
      if (a.paused && track.audio_url) { a.play().catch(() => {}); }
      return;
    }

    a.pause();
    setCurrent(track);
    setProgress(0);
    setCurrentTime(0);

    if (track.audio_url) {
      a.src = track.audio_url;
      a.currentTime = 0;
      a.play().catch(() => setPlaying(false));
    } else {
      // Spotify uniquement — ouvrir directement
      a.removeAttribute("src");
      if (track.spotify_url) openSpotify(track.spotify_url);
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (!current.audio_url) {
      if (current.spotify_url) openSpotify(current.spotify_url);
      return;
    }
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const stop = () => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.removeAttribute("src");
    }
    setCurrent(null);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const seek = (ratio: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = Math.max(0, Math.min(1, ratio)) * a.duration;
  };

  return (
    <Ctx.Provider value={{ current, playing, progress, duration, currentTime, play, toggle, stop, seek, openSpotify }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer must be used inside PlayerProvider");
  return v;
}
