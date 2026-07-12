/**
 * 416 Records — Freemium system
 *
 * Plans :
 *   free    → ads every N plays, max 30s preview on some content
 *   premium → no ads, full content (1.50$ / month ≈ 3 500 FC)
 *
 * Pour l'instant : stockage localStorage + Supabase column `is_premium`
 * sur la table users. À connecter à un payment provider (Stripe / DPO) plus tard.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Plan = "free" | "premium";

type SubCtx = {
  plan: Plan;
  isPremium: boolean;
  playCount: number;           // nb de tracks joués depuis la dernière pub
  shouldShowAd: () => boolean; // retourne true si une pub doit s'afficher
  recordPlay: () => void;      // à appeler à chaque lecture
  adReset: () => void;         // à appeler après affichage pub
};

const SubCtx = createContext<SubCtx | null>(null);

const AD_INTERVAL = 3; // afficher une pub toutes les N lectures (free)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [playCount, setPlayCount] = useState(0);

  // Charger le plan depuis Supabase
  useEffect(() => {
    if (!user) { setPlan("free"); return; }
    supabase
      .from("user_profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPlan(data?.is_premium ? "premium" : "free");
      });
  }, [user]);

  const recordPlay = () => {
    if (plan === "premium") return;
    setPlayCount((n) => n + 1);
  };

  const shouldShowAd = () => {
    if (plan === "premium") return false;
    return playCount > 0 && playCount % AD_INTERVAL === 0;
  };

  const adReset = () => {
    // On ne remet pas à 0, le compteur continue — l'annonce se réaffiche tous les N plays
  };

  return (
    <SubCtx.Provider value={{ plan, isPremium: plan === "premium", playCount, shouldShowAd, recordPlay, adReset }}>
      {children}
    </SubCtx.Provider>
  );
}

export function useSubscription() {
  const v = useContext(SubCtx);
  if (!v) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return v;
}
