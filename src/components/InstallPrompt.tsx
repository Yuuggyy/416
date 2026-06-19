import { useEffect, useState } from "react";
import { Download, X, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS specific
    window.navigator.standalone === true
  );
}

const DISMISS_KEY = "416-install-dismissed";

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setPlatform(detectPlatform());
    setHidden(false);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!mounted || hidden) return null;

  const handleClick = async () => {
    if (bip) {
      await bip.prompt();
      const { outcome } = await bip.userChoice;
      if (outcome === "accepted") {
        setHidden(true);
        localStorage.setItem(DISMISS_KEY, "1");
      }
      setBip(null);
      return;
    }
    setOpen(true);
  };

  const dismiss = () => {
    setHidden(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <>
      {/* Floating button — above footer, above mini-player */}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Installer 416 Records sur ton téléphone</DialogTitle>
            <DialogDescription>
              Ajoute l'app à ton écran d'accueil — elle s'ouvre en plein écran,
              comme une vraie application, sans passer par le store.
            </DialogDescription>
          </DialogHeader>

          {platform === "ios" && (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-semibold text-primary">1.</span>
                <span className="flex items-center gap-1">
                  Appuie sur le bouton <Share className="inline h-4 w-4" />
                  <strong>Partager</strong> en bas de Safari.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">2.</span>
                <span className="flex items-center gap-1">
                  Choisis <Plus className="inline h-4 w-4" />
                  <strong>Sur l'écran d'accueil</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">3.</span>
                <span>
                  Appuie sur <strong>Ajouter</strong> en haut à droite.
                </span>
              </li>
            </ol>
          )}

          {platform === "android" && (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-semibold text-primary">1.</span>
                <span className="flex items-center gap-1">
                  Ouvre le menu <MoreVertical className="inline h-4 w-4" /> de
                  Chrome (en haut à droite).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">2.</span>
                <span>
                  Choisis <strong>Installer l'application</strong> ou{" "}
                  <strong>Ajouter à l'écran d'accueil</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">3.</span>
                <span>
                  Confirme avec <strong>Installer</strong>.
                </span>
              </li>
            </ol>
          )}

          {platform === "desktop" && (
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-semibold text-primary">1.</span>
                <span>
                  Dans la barre d'adresse de Chrome / Edge, clique sur l'icône{" "}
                  <Download className="inline h-4 w-4" /> (à droite).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">2.</span>
                <span>
                  Clique sur <strong>Installer</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">3.</span>
                <span>L'app s'ouvre dans sa propre fenêtre.</span>
              </li>
            </ol>
          )}

          <div className="pt-2">
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              J'ai compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
