import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Zap, Check, Music, Film, ShoppingBag, Wifi } from "lucide-react";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
  head: () => ({ meta: [{ title: "Premium — 416 Records" }] }),
});

const FEATURES_FREE = [
  "Accès au catalogue de base",
  "Écouter des extraits (30 sec)",
  "Voir les clips et films",
  "Publicités entre les lectures",
];

const FEATURES_PREMIUM = [
  "Tout le catalogue — sans limite",
  "Lecture audio complète",
  "Zéro publicité",
  "Téléchargements offline (bientôt)",
  "Accès prioritaire aux sorties",
  "Badge Premium sur le profil",
];

function PremiumPage() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-24">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">416 Premium</h1>
          <p className="text-muted-foreground text-sm">Tout l'univers 416 Records. Sans limite. Sans pub.</p>
        </div>

        {/* Prix */}
        <div className="bg-card border border-primary/40 rounded-2xl p-6 mb-6 shadow-gold-glow text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Abonnement mensuel</p>
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="font-display text-5xl font-bold text-foreground">1,50</span>
            <span className="text-xl text-muted-foreground mb-1">$</span>
          </div>
          <p className="text-sm text-muted-foreground">≈ 3 500 FC / mois</p>
          <p className="text-xs text-muted-foreground mt-1">Annulable à tout moment</p>

          {isPremium ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary font-semibold text-sm">
              <Check className="h-4 w-4" /> Vous êtes déjà Premium ✨
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full mt-5 font-bold text-base shadow-gold-glow"
              onClick={() => {
                // TODO: rediriger vers le flux de paiement (Stripe / DPO / Mobile Money)
                alert("Paiement bientôt disponible — Mobile Money, Visa, PayPal");
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Passer Premium
            </Button>
          )}
        </div>

        {/* Comparatif */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Gratuit */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="font-semibold text-sm mb-3 text-muted-foreground">Gratuit</p>
            <ul className="space-y-2">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center text-[8px]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {/* Premium */}
          <div className="bg-primary/5 border border-primary/40 rounded-xl p-4">
            <p className="font-semibold text-sm mb-3 text-primary flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Premium
            </p>
            <ul className="space-y-2">
              {FEATURES_PREMIUM.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modes de paiement prévus */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">Modes de paiement disponibles bientôt</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["M-Pesa", "Airtel Money", "Orange Money", "Visa / Mastercard", "PayPal"].map((m) => (
              <span key={m} className="text-[10px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                {m}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
