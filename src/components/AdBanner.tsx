/**
 * AdBanner — placeholder pour les pubs version gratuite.
 * Remplacer le contenu de <AdContent> par votre réseau publicitaire
 * (Google AdSense, AdMob webview, etc.) quand prêt.
 */
import { X, Zap } from "lucide-react";
import { useState } from "react";
import { useSubscription } from "@/lib/subscription";

function AdContent() {
  // TODO: remplacer par un vrai tag pub (AdSense, AdMob, etc.)
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-secondary to-card border border-border/60">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Publicité</p>
        <p className="text-[10px] text-muted-foreground truncate">Espace réservé à une annonce</p>
      </div>
    </div>
  );
}

/** Bannière inline dans une page */
export function AdBannerInline({ className = "" }: { className?: string }) {
  const { isPremium } = useSubscription();
  if (isPremium) return null;
  return (
    <div className={`rounded-xl overflow-hidden border border-border/50 ${className}`}>
      <AdContent />
    </div>
  );
}

/** Bannière flottante (après N lectures) */
export function AdOverlay({ onClose }: { onClose: () => void }) {
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
          <AdContent />
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Passez à <span className="text-primary font-bold">Premium</span> pour une expérience sans pub — 1,50$/mois
          </p>
        </div>
      </div>
    </div>
  );
}
