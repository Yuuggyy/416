/**
 * Phase 0 — Casting digital 416 Records
 * Constantes, types et logique de score (jury 60% / public 40%).
 *
 * Règle de sélection (alignée sur le dossier projet unifié) :
 *   - 36 candidats retenus par le score composite (jury 60% + likes 40%)
 *   - 4 repêchés par les likes purs (meilleurs compteurs hors sélection)
 *   - = 40 candidats au parking pour l'Épisode 1 (26 nov 2026)
 */
import { supabase } from "./supabase";

// ---------- Objectifs Phase 0 ----------
export const CASTING = {
  targetCandidates: 140, // candidats sérieux visés
  selectedByComposite: 36, // retenus jury 60% + likes 40%
  repecheByLikes: 4, // sauvés par le public
  totalForE1: 40, // total qui entre au parking
};

// ---------- Pondération ----------
export const JURY_WEIGHT = 0.6;
export const PUBLIC_WEIGHT = 0.4;

// ---------- Grille jury (total /10) ----------
export const CRITERIA = [
  { key: "ecriture", label: "Écriture", max: 3, hint: "Lyrics, originalité, punchlines, message" },
  { key: "choix_prod", label: "Choix de la prod", max: 2, hint: "Cohérence musique ↔ identité" },
  { key: "prestance", label: "Prestance", max: 3, hint: "Présence caméra, flow, énergie" },
  { key: "potentiel_video", label: "Potentiel vidéo", max: 2, hint: "Capacité à tenir l'écran, format clips" },
] as const;

export type CriteriaKey = (typeof CRITERIA)[number]["key"];

// ---------- Monétisation ----------
export const SUPER_FAN_PRICE_FC = 2200; // ≈ 0,90 USD (taux ~2400 FC/USD)
export const SUPER_FAN_LABEL = "Écoute Super Fan";
export const FAN_LABEL = "Écoute Fan";
export const SUPER_FAN_AD_COUNT = 2; // pubs récompensées pour débloquer sans payer

// ---------- Points de fidélité ----------
export const POINTS = {
  dailyVisit: 1,
  fanListen: 2,
  superFanListen: 5,
  shareQuick: 3,
} as const;

export const REWARDS = [
  { label: "Billet finale −20%", points: 500 },
  { label: "Merch −10%", points: 300 },
  { label: "Quicks exclusifs 7 jours en avance", points: 200 },
] as const;

// ---------- Types ----------
export type CastingApplication = {
  id: string;
  user_id: string;
  artist_name: string;
  track_title: string;
  video_url: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "selected" | "repeche";
  created_at: string;
  votes?: { count: number }[];
};

export type JuryScore = {
  id: string;
  application_id: string;
  jury_user_id: string;
  ecriture: number;
  choix_prod: number;
  prestance: number;
  potentiel_video: number;
  comment: string | null;
  created_at: string;
};

export type Quick = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  title: string;
  video_url: string;
  views: number;
  featured: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type FanListen = {
  id: string;
  user_id: string;
  track_id: string;
  listen_type: "fan" | "super_fan";
  paid: boolean;
  created_at: string;
};

// ---------- Logique de score ----------
export function juryTotal(s: Pick<JuryScore, "ecriture" | "choix_prod" | "prestance" | "potentiel_video">): number {
  return s.ecriture + s.choix_prod + s.prestance + s.potentiel_video; // /10
}

/** Score composite : jury /10 × 60% + (likes/maxLikes × 10) × 40% */
export function compositeScore(juryAvg10: number, likes: number, maxLikes: number): number {
  const public10 = maxLikes > 0 ? (likes / maxLikes) * 10 : 0;
  return juryAvg10 * JURY_WEIGHT + public10 * PUBLIC_WEIGHT;
}

/** Classe les candidatures approuvées : 36 sélectionnées + 4 repêchées par likes purs */
export function computeSelection(apps: CastingApplication[], juryByApp: Record<string, JuryScore[]>) {
  const approved = apps.filter((a) => a.status === "approved" || a.status === "selected" || a.status === "repeche");
  const likesOf = (a: CastingApplication) => a.votes?.[0]?.count ?? 0;
  const maxLikes = Math.max(1, ...approved.map(likesOf));

  const scored = approved.map((a) => {
    const scores = juryByApp[a.id] ?? [];
    const juryAvg10 = scores.length
      ? scores.reduce((sum, s) => sum + juryTotal(s), 0) / scores.length
      : 0;
    const likes = likesOf(a);
    return {
      application: a,
      juryAvg10,
      likes,
      composite: compositeScore(juryAvg10, likes, maxLikes),
    };
  });

  const byComposite = [...scored].sort((x, y) => y.composite - x.composite);
  const selectedIds = new Set(byComposite.slice(0, CASTING.selectedByComposite).map((s) => s.application.id));

  const repeches = [...scored]
    .filter((s) => !selectedIds.has(s.application.id))
    .sort((x, y) => y.likes - x.likes)
    .slice(0, CASTING.repecheByLikes);
  const repecheIds = new Set(repeches.map((s) => s.application.id));

  return { scored, selectedIds, repecheIds, byComposite };
}

// ---------- Fidélité ----------
export async function addPoints(userId: string, points: number, reason: string) {
  return supabase.from("loyalty_ledger").insert({ user_id: userId, points, reason });
}

export async function getPointsBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("points")
    .eq("user_id", userId);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.points ?? 0), 0);
}

// ---------- Upload storage (même pattern que l'admin) ----------
export async function uploadPhase0Video(prefix: "casting" | "quicks", userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${prefix}/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
