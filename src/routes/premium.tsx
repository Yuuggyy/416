import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSubscription, SEASON_PRICE_FC, CURRENT_SEASON } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv2, Check, X, Loader2, Ticket, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { initiatePayment, PAYMENT_METHODS, FLW_PUBLIC_KEY } from "@/lib/payment";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
  head: () => ({ meta: [{ title: "Accès Saison — 416 Records" }] }),
});

const WHATSAPP_NUMBER = "243000000000"; // ← remplacer par le vrai numéro 416

const INCLUS = [
  "Tous les épisodes de l'émission — saison complète",
  "Finale en live sur l'app (streaming exclusif)",
  "Replays illimités de tous les épisodes",
  "Contenu exclusif : behind the scenes, interviews",
  "Clips et sessions studio des artistes 416",
  "Vote du public pour les éliminations",
  "Zéro publicité pendant toute la saison",
];

const NON_INCLUS = [
  "Accès aux saisons précédentes",
  "Téléchargement offline",
];

function PremiumPage() {
  const { user } = useAuth();
  const { isPremium, subscription, loading, refresh } = useSubscription();
  const navigate = useNavigate();
  const [artistCode, setArtistCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <Tv2 className="h-12 w-12 text-primary/40" />
          <p className="text-lg font-semibold text-center">Connectez-vous pour accéder à la saison</p>
          <Button onClick={() => navigate({ to: "/login" })}>Se connecter</Button>
        </main>
      </div>
    );
  }

  // Paiement via Flutterwave (M-Pesa, Airtel, Orange Money)
  const [selectedMethod, setSelectedMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleRequest = async () => {
    if (!user) return;
    if (!phoneNumber.trim()) { toast.error("Entrez votre numéro de téléphone"); return; }

    setSaving(true);

    // Étape 1: Créer une entrée "pending"
    const { error: subError } = await supabase.from("subscriptions").upsert({
      user_id: user.id,
      season: CURRENT_SEASON,
      status: "pending",
      artist_code: artistCode.trim() || null,
      amount_fc: SEASON_PRICE_FC,
    }, { onConflict: "user_id,season" });

    if (subError) {
      toast.error("Erreur: " + subError.message);
      setSaving(false);
      return;
    }

    // Étape 2: Lancer le paiement Flutterwave
    const result = await initiatePayment(
      SEASON_PRICE_FC,
      { email: user.email || "", phone: phoneNumber, name: user.email?.split("@")[0] },
      selectedMethod
    );

    if (result.success && result.transactionId) {
      // Étape 3: Activer le premium automatiquement
      const { error: activateError } = await supabase.from("subscriptions").update({
        status: "active",
        paid_at: new Date().toISOString(),
        transaction_id: result.transactionId,
      }).eq("user_id", user.id).eq("season", CURRENT_SEASON);

      if (!activateError) {
        toast.success("Paiement réussi ! Votre accès Premium est activé 🎉");
        setRequested(true);
        refresh();
      } else {
        toast.success("Paiement reçu ! Activation en cours (l'admin confirme sous 24h).");
        refresh();
      }
    } else {
      // Fallback: si Flutterwave n'est pas configuré, garder le système WhatsApp
      if (!FLW_PUBLIC_KEY) {
        const msg = encodeURIComponent(
          `🎬 Demande d'accès Saison S1 — 416 Records\n\nEmail: ${user.email}\nMontant: ${SEASON_PRICE_FC} FC\n${artistCode.trim() ? `Code artiste: ${artistCode.trim()}` : ""}\n\nJ'ai envoyé le paiement et j'attends la confirmation d'accès.`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
        toast.success("Demande enregistrée ! L'équipe 416 confirme votre accès.");
        setRequested(true);
        refresh();
      } else {
        toast.error(result.message || "Paiement échoué");
      }
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-20">

        {/* Hero */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 shadow-gold-glow">
            <Tv2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            L'Émission 416
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            La première émission musicale compétitive de Kinshasa — exclusivement sur l'app 416 Records.
          </p>
        </div>

        {/* ÉTAT : déjà premium */}
        {!loading && isPremium && (
          <div className="bg-primary/5 border border-primary/40 rounded-2xl p-6 mb-6 text-center shadow-gold-glow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <p className="font-bold text-lg text-primary mb-1">Accès actif ✓</p>
            <p className="text-sm text-muted-foreground">
              Vous avez accès à toute la saison <strong>S1 2026</strong>.
            </p>
            {subscription?.paid_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Activé le {new Date(subscription.paid_at).toLocaleDateString("fr-FR")}
              </p>
            )}
            <Button className="mt-4 w-full" onClick={() => navigate({ to: "/browse" })}>
              Regarder maintenant
            </Button>
          </div>
        )}

        {/* ÉTAT : pending (demande en attente) */}
        {!loading && !isPremium && subscription?.status === "pending" && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-5 mb-6 text-center">
            <Loader2 className="h-6 w-6 text-yellow-500 mx-auto mb-2 animate-spin" />
            <p className="font-semibold text-sm text-yellow-500">Paiement en attente de confirmation</p>
            <p className="text-xs text-muted-foreground mt-1">
              L'équipe 416 va vérifier votre paiement et activer votre accès sous 24h.
            </p>
          </div>
        )}

        {/* ÉTAT : pas encore accès → afficher le prix + bouton */}
        {!loading && !isPremium && subscription?.status !== "pending" && (
          <>
            {/* Prix */}
            <div className="bg-card border border-primary/40 rounded-2xl p-6 mb-6 shadow-gold-glow text-center">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                Accès Saison Complète
              </p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="font-display text-5xl font-bold">{SEASON_PRICE_FC.toLocaleString()}</span>
                <span className="text-xl text-muted-foreground mb-1.5">FC</span>
              </div>
              <p className="text-sm text-muted-foreground">≈ 1,20 $ USD — paiement unique</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accès permanent à toute la saison S1
              </p>

              {/* Code artiste */}
              <div className="mt-5 text-left">
                <Label htmlFor="artist-code" className="text-xs text-muted-foreground">
                  Code artiste (optionnel)
                </Label>
                <Input
                  id="artist-code"
                  value={artistCode}
                  onChange={e => setArtistCode(e.target.value.toUpperCase())}
                  placeholder="Ex: YUGGY2026"
                  className="mt-1 uppercase font-mono tracking-wider"
                  style={{ fontSize: "16px" }}
                  maxLength={20}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tu soutiens directement l'artiste en entrant son code.
                </p>
              </div>

              {/* Numéro de téléphone */}
              <div className="mt-5 text-left">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">
                  Numéro de téléphone (Mobile Money)
                </Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ex: +243 8xx xxx xxx"
                  className="mt-1"
                  type="tel"
                  style={{ fontSize: "16px" }}
                />
              </div>

              {/* Choix du moyen de paiement */}
              <div className="mt-4 text-left">
                <Label className="text-xs text-muted-foreground mb-2 block">Moyen de paiement</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.flwOption)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedMethod === method.flwOption
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      <span className="text-base">{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-5 font-bold text-base shadow-gold-glow h-12 touch-manipulation"
                onClick={handleRequest}
                disabled={saving || requested}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Paiement en cours…</>
                  : <><Ticket className="h-4 w-4 mr-2" />Payer {SEASON_PRICE_FC.toLocaleString()} FC</>
                }
              </Button>
            </div>

            {/* Comment ça marche */}
            <div className="bg-secondary/30 border border-border rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Comment obtenir l'accès ?
              </p>
              <ol className="space-y-2.5">
                {[
                  `Choisis ton moyen de paiement (M-Pesa, Airtel Money, Orange Money)`,
                  "Entre ton numéro de téléphone et clique sur Payer",
                  "Confirme le paiement sur ton téléphone (push notification)",
                  "Ton accès Premium s'active automatiquement — sans pub !",
                ].map((s, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* Ce qui est inclus */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <p className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Ce qui est inclus
          </p>
          <ul className="space-y-2.5">
            {INCLUS.map(f => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {NON_INCLUS.length > 0 && (
            <>
              <div className="border-t border-border my-4" />
              <ul className="space-y-2">
                {NON_INCLUS.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive/60 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Modes de paiement */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground mb-3">Modes de paiement acceptés</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Airtel Money", "M-Pesa", "Orange Money", "Espèces (via agent)"].map(m => (
              <span key={m} className="text-[10px] bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border">
                {m}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 italic">
            Paiement par carte Visa bientôt disponible via CinetPay.
          </p>
        </div>

      </main>
    </div>
  );
}
