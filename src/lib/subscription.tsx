/**
 * 416 Records — Système d'accès saison
 *
 * Un utilisateur a accès Premium s'il a une subscription active (status = "active")
 * pour la saison en cours (CURRENT_SEASON).
 *
 * Le paiement se fait via CinetPay (à intégrer) ou manuellement par l'admin.
 * Après confirmation du paiement, l'admin (ou CinetPay webhook) met status → "active".
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export const CURRENT_SEASON = "S1_2026"; // identifiant de la saison courante
export const SEASON_PRICE_FC = 3500;      // prix en Francs Congolais

export type Plan = "free" | "premium";

export type Subscription = {
  id: string;
  season: string;
  status: "pending" | "active" | "expired" | "cancelled";
  artist_code: string | null;
  paid_at: string | null;
  expires_at: string | null;
};

type SubCtx = {
  plan: Plan;
  isPremium: boolean;
  subscription: Subscription | null;
  loading: boolean;
  playCount: number;
  shouldShowAd: () => boolean;
  recordPlay: () => void;
  refresh: () => void;
};

const SubCtx = createContext<SubCtx | null>(null);

const AD_INTERVAL = 3; // pub toutes les 3 lectures (free)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [playCount, setPlayCount] = useState(0);

  const fetchSub = async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("id,season,status,artist_code,paid_at,expires_at")
        .eq("user_id", user.id)
        .eq("season", CURRENT_SEASON)
        .maybeSingle();
      setSubscription(data ?? null);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSub(); }, [user]);

  const isPremium = subscription?.status === "active";
  const plan: Plan = isPremium ? "premium" : "free";

  const recordPlay = () => {
    if (isPremium) return;
    setPlayCount(n => n + 1);
  };

  const shouldShowAd = () => {
    if (isPremium) return false;
    return playCount > 0 && playCount % AD_INTERVAL === 0;
  };

  return (
    <SubCtx.Provider value={{ plan, isPremium, subscription, loading, playCount, shouldShowAd, recordPlay, refresh: fetchSub }}>
      {children}
    </SubCtx.Provider>
  );
}

export function useSubscription() {
  const v = useContext(SubCtx);
  if (!v) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return v;
}
