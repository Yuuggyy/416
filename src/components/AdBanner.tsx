/**
 * AdBanner — Google AdSense integration for 416 Records.
 * Les utilisateurs premium ne voient aucune publicité.
 *
 * Composants :
 * - AdBannerInline : bannière native AdSense dans le flux de page
 * - AdOverlay : pub interstitielle (après N lectures) avec bouton fermer
 */
import { X, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSubscription } from "@/lib/subscription";

const AD_CLIENT = "ca-pub-6614933308950023";

/** Insérer un bloc pub AdSense réel */
function AdSenseBlock({ slot, format = "auto", responsive = true }: { slot: string; format?: string; responsive?: boolean }) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense not loaded yet (e.g. ad blocker or not approved)
    }
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", width: "100%", minHeight: "90px" }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}

/** Placeholder de fallback si AdSense n'est pas encore approuvé / bloqué */
function AdFallback() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-secondary to-card border border-border/60 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">416 Records</p>
        <p className="text-[10px] text-muted-foreground truncate">
          Passez Premium pour une expérience sans pub — 1,50$/mois
        </p>
      </div>
    </div>
  );
}

/** Bannière inline dans une page (flux normal) */
export function AdBannerInline({ className = "", slot = "1111111111" }: { className?: string; slot?: string }) {
  const { isPremium } = useSubscription();
  if (isPremium) return null;
  return (
    <div className={`rounded-xl overflow-hidden border border-border/50 ${className}`}>
      <div className="px-3 py-1 bg-secondary/50 border-b border-border/50">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Publicité</span>
      </div>
      <AdSenseBlock slot={slot} />
      <noscript><AdFallback /></noscript>
    </div>
  );
}

/** Bannière flottante (interstitielle après N lectures) */
export function AdOverlay({ onClose, slot = "2222222222" }: { onClose: () => void; slot?: string }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-lg bg-card border-t border-border shadow-2xl rounded-t-2xl">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Publicité</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground active:scale-90 transition-transform"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <AdSenseBlock slot={slot} format="vertical" responsive={false} />
          <noscript><AdFallback /></noscript>
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Passez à <span className="text-primary font-bold">Premium</span> pour une expérience sans pub — 1,50$/mois
          </p>
        </div>
      </div>
    </div>
  );
}
