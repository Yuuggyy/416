import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export const CURRENT_SEASON = "S1_2026";
export const SEASON_PRICE_FC = 3500;

export type Plan = "free" | "premium";
export type AccountType = "free" | "premium" | "artist";

export type Subscription = {
  id: string; season: string; status: "pending" | "active" | "expired" | "cancelled";
  artist_code: string | null; paid_at: string | null; expires_at: string | null;
};

export type Profile = {
  id: string; email: string | null; display_name: string | null;
  artist_name: string | null; account_type: AccountType;
};

type SubCtx = {
  plan: Plan; isPremium: boolean; subscription: Subscription | null;
  accountType: AccountType; isArtist: boolean; profile: Profile | null;
  loading: boolean; playCount: number;
  shouldShowAd: () => boolean; recordPlay: () => void; refresh: () => void;
};

const SubCtx = createContext<SubCtx | null>(null);
const AD_INTERVAL = 3;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [playCount, setPlayCount] = useState(0);

  const fetchSub = useMemo(() => async () => {
    if (!user) { setSubscription(null); setProfile(null); setLoading(false); return; }
    setLoading(true);
    try {
      // Profil = source de vérité du type de compte (free / premium / artiste)
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,email,display_name,artist_name,account_type")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((prof as Profile) ?? null);
      const { data } = await supabase
        .from("subscriptions")
        .select("id,season,status,artist_code,paid_at,expires_at")
        .eq("user_id", user.id)
        .eq("season", CURRENT_SEASON)
        .maybeSingle();
      setSubscription(data ?? null);
    } catch { setSubscription(null); setProfile(null); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  const value = useMemo<SubCtx>(() => {
    const accountType: AccountType = profile?.account_type ?? "free";
    const isArtist = accountType === "artist";
    // Compte artiste : avantages équivalents premium (partenaire de la maison)
    const isPremium = accountType === "premium" || (!isArtist && subscription?.status === "active");
    return {
      plan: isPremium || isArtist ? "premium" : "free",
      isPremium,
      accountType,
      isArtist,
      profile,
      subscription, loading, playCount,
      shouldShowAd: () => isPremium || isArtist ? false : playCount > 0 && playCount % AD_INTERVAL === 0,
      recordPlay: () => { if (!isPremium && !isArtist) setPlayCount(n => n + 1); },
      refresh: fetchSub,
    };
  }, [profile, subscription, loading, playCount, fetchSub]);

  return <SubCtx.Provider value={value}>{children}</SubCtx.Provider>;
}

export function useSubscription() {
  const v = useContext(SubCtx);
  if (!v) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return v;
}
