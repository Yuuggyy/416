import { useEffect, useState } from "react";
import { Download, X, Share, Plus, MoreVertical } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISS_KEY = "416-install-dismissed";
const DISMISS_DURATION = 1000 * 60 * 60 * 24 * 7;

function shouldShowAfterDismiss(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return true;
    return Date.now() - parseInt(dismissed, 10) > DISMISS_DURATION;
  } catch { return true; }
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) return;
    if (!shouldShowAfterDismiss()) return;
    setPlatform(detectPlatform());
    setHidden(false);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => {
      setHidden(true);
      try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mounted || hidden) return null;

  const handleClick = async () => {
    if (bip) {
      try {
        await bip.prompt();
        const { outcome } = await bip.userChoice;
        if (outcome === "accepted") {
          setHidden(true);
          try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
        }
      } catch {}
      setBip(null);
      return;
    }
    setOpen(true);
  };

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
  };

  const closeModal = () => {
    setOpen(false);
    // Ensure pointer-events are restored
    document.body.style.pointerEvents = "";
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Installer l'app
          </button>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          {/* Modal — plain div, no Radix, no pointer-events leak */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-display text-xl font-bold mb-1">Installer 416 Records</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Ajoute l'app à ton écran d'accueil — elle s'ouvre en plein écran, comme une vraie application.
            </p>

            {platform === "ios" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-300">
                  Tu es sur iPhone/iPad — suis ces étapes:
                </div>
                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <span className="flex items-center gap-1.5 pt-0.5">
                      Appuie sur le bouton
                      <span className="inline-flex items-center justify-center rounded-md bg-muted p-1">
                        <Share className="h-4 w-4" />
                      </span>
                      <strong>Partager</strong>
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <span className="flex items-center gap-1.5 pt-0.5">
                      Choisis
                      <span className="inline-flex items-center justify-center rounded-md bg-muted p-1">
                        <Plus className="h-4 w-4" />
                      </span>
                      <strong>Sur l'écran d'accueil</strong>
                    </span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    <span className="pt-0.5">Appuie sur <strong>Ajouter</strong></span>
                  </li>
                </ol>
              </div>
            )}

            {platform === "android" && (
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3"><span className="font-semibold text-primary">1.</span> Ouvre le menu <MoreVertical className="inline h-4 w-4" /> de Chrome</li>
                <li className="flex gap-3"><span className="font-semibold text-primary">2.</span> Choisis <strong>Installer l'application</strong></li>
                <li className="flex gap-3"><span className="font-semibold text-primary">3.</span> Confirme avec <strong>Installer</strong></li>
              </ol>
            )}

            {platform === "desktop" && (
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3"><span className="font-semibold text-primary">1.</span> Clique sur l'icône <Download className="inline h-4 w-4" /> dans la barre d'adresse</li>
                <li className="flex gap-3"><span className="font-semibold text-primary">2.</span> Clique sur <strong>Installer</strong></li>
              </ol>
            )}

            <button
              onClick={closeModal}
              className="mt-5 w-full rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
