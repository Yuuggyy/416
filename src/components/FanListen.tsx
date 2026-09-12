/**
 * FanListen — Écoute Fan / Écoute Super Fan
 *
 * - Écoute Fan : gratuite avec pub. +2 pts fidélité.
 * - Écoute Super Fan : version mieux masterisée.
 *     • soit payante (2 200 FC ≈ 0,90 $ via M-Pesa / Airtel / Orange Money / carte)
 *     • soit gratuite en regardant 2 pubs récompensées.
 *   +5 pts fidélité. Répartition artiste : 70 % / 416 : 30 % (maison de distribution).
 *
 * À insérer sous le player : <FanListen trackId={track.id} trackTitle={track.title} />
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdOverlay } from "@/components/AdBanner";
import { Headphones, Crown, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  FAN_LABEL,
  SUPER_FAN_LABEL,
  SUPER_FAN_PRICE_FC,
  SUPER_FAN_AD_COUNT,
  POINTS,
  addPoints,
  getPointsBalance,
} from "@/lib/phase0";
import { initiatePayment, PAYMENT_METHODS } from "@/lib/payment";

export function FanListen({ trackId, trackTitle }: { trackId: string; trackTitle: string }) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [adOpen, setAdOpen] = useState<null | "fan" | "superfan-ads">(null);
  const [adsWatched, setAdsWatched] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);

  useEffect(() => {
    if (!user) return;
    getPointsBalance(user.id).then(setBalance);
  }, [user]);

  async function recordListen(listenType: "fan" | "super_fan", paid: boolean, points: number) {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("fan_listens").insert({
        user_id: user.id,
        track_id: trackId,
        listen_type: listenType,
        paid,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("Écoute déjà comptabilisée aujourd'hui pour ce titre.");
        } else {
          throw error;
        }
      } else {
        await addPoints(user.id, points, listenType === "fan" ? "Ecoute fan" : "Ecoute super fan");
        const b = await getPointsBalance(user.id);
        setBalance(b);
        toast.success(`+${points} pts fidélité`, { description: `Nouveau solde : ${b} pts` });
      }
    } catch {
      toast.error("Erreur d'enregistrement de l'écoute.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Écoute Fan (gratuite + pub) ---------- */
  function startFanListen() {
    if (!user) { toast.error("Crée un compte pour accumuler des points."); return; }
    setAdOpen("fan");
  }

  /* ---------- Super Fan : pubs récompensées ---------- */
  function startSuperFanAds() {
    if (!user) return;
    setAdsWatched(0);
    setAdOpen("superfan-ads");
  }

  async function handleAdClosed() {
    if (adOpen === "fan") {
      setAdOpen(null);
      await recordListen("fan", false, POINTS.fanListen);
      return;
    }
    if (adOpen === "superfan-ads") {
      const next = adsWatched + 1;
      setAdsWatched(next);
      if (next >= SUPER_FAN_AD_COUNT) {
        setAdOpen(null);
        await recordListen("super_fan", false, POINTS.superFanListen);
      } else {
        toast.info(`Encore ${SUPER_FAN_AD_COUNT - next} pub(s) pour débloquer l'écoute Super Fan.`);
      }
    }
  }

  /* ---------- Super Fan : paiement mobile money ---------- */
  async function paySuperFan() {
    if (!user?.email) return;
    setBusy(true);
    const opt = PAYMENT_METHODS.find((m) => m.id === method) ?? PAYMENT_METHODS[0];
    const res = await initiatePayment(SUPER_FAN_PRICE_FC, { email: user.email }, opt.flwOption);
    setBusy(false);
    if (res.success) {
      setPayOpen(false);
      await recordListen("super_fan", true, POINTS.superFanListen);
    } else {
      toast.error(res.message || "Paiement non abouti. Réessaie.");
    }
  }

  if (authLoading) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Headphones className="h-4 w-4 text-primary" /> Écoutes 416 — « {trackTitle} »
        </p>
        {user && balance !== null && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500" /> {balance} pts
          </span>
        )}
      </div>

      {!user ? (
        <p className="text-xs text-muted-foreground">
          <Link to="/login" className="underline text-primary">Abonne-toi</Link> pour écouter en Fan (gratuit) ou en Super Fan et gagner des points fidélité.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" size="sm" className="gap-2 flex-1" onClick={startFanListen} disabled={busy}>
            <Headphones className="h-4 w-4" /> {FAN_LABEL} · gratuit + pub
          </Button>

          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 flex-1">
                <Crown className="h-4 w-4" /> {SUPER_FAN_LABEL} · {SUPER_FAN_PRICE_FC.toLocaleString("fr-FR")} FC
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Écoute Super Fan — version masterisée</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  70 % du montant va à l'artiste, 30 % à 416 Records (maison de distribution).
                  Tu gagnes {POINTS.superFanListen} pts fidélité.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                        method === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full gap-2" onClick={paySuperFan} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Payer {SUPER_FAN_PRICE_FC.toLocaleString("fr-FR")} FC
                </Button>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-muted-foreground uppercase">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setPayOpen(false); startSuperFanAds(); }}>
                  Débloquer en regardant {SUPER_FAN_AD_COUNT} pubs
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Pub plein écran (AdSense) — fermée par l'utilisateur */}
      {adOpen && <AdOverlay onClose={handleAdClosed} />}
    </div>
  );
}

