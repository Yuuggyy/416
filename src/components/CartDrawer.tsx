import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Loader2, ShoppingBag, CheckCircle2, X, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

function imgUrl(url: string | null | undefined, w: number): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    return `${url}${url.includes("?") ? "&" : "?"}width=${w}&quality=70&format=webp`;
  }
  return url;
}

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, total, currency, clear, count } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (step === "success") setStep("cart");
      // Scroll to top quand on change de step
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [isOpen]);

  // Scroll to top sur changement de step
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Bloquer le scroll du body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = () => {
    setStep("cart");
    close();
  };

  const submit = async () => {
    if (!name.trim()) { toast.error("Entrez votre nom"); return; }
    const clean = whatsapp.replace(/[^\d+]/g, "");
    if (clean.length < 8) { toast.error("Numéro WhatsApp invalide"); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from("orders").insert({
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        whatsapp: clean,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, currency: i.currency })),
        total,
        currency,
        notes: notes.trim() || null,
        status: "pending",
      });

      if (error) {
        // Fallback WhatsApp si table manquante
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          const msg = encodeURIComponent(
            `🛍️ Commande 416 Records\n\nNom: ${name.trim()}\nWhatsApp: ${clean}\n\nArticles:\n${items.map(i => `• ${i.name} ×${i.quantity} — ${i.price} ${i.currency}`).join("\n")}\n\nTotal: ${total.toFixed(2)} ${currency}${notes.trim() ? `\n\nNotes: ${notes.trim()}` : ""}`
          );
          window.open(`https://wa.me/243000000000?text=${msg}`, "_blank");
        } else {
          toast.error("Erreur : " + error.message);
          return;
        }
      }

      clear();
      setName(""); setWhatsapp(""); setNotes("");
      setStep("success");
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 85 }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background border-l border-border flex flex-col"
        style={{ zIndex: 86 }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                className="mr-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-90 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">
              {step === "cart" && `Panier${count > 0 ? ` (${count})` : ""}`}
              {step === "checkout" && "Finaliser"}
              {step === "success" && "Commande envoyée"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-90 transition-transform"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">

          {/* SUCCÈS */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center h-full">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">Commande confirmée !</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  L'équipe 416 Records vous contacte sur WhatsApp pour la livraison et le paiement.
                </p>
              </div>
              <Button onClick={handleClose} className="mt-2 w-full max-w-xs">Fermer</Button>
            </div>
          )}

          {/* PANIER VIDE */}
          {step === "cart" && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 h-full text-muted-foreground">
              <ShoppingBag className="h-12 w-12 text-primary/20" />
              <p className="text-sm">Votre panier est vide.</p>
            </div>
          )}

          {/* LISTE DES ARTICLES */}
          {step === "cart" && items.length > 0 && (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 items-center bg-card border border-border rounded-xl p-3">
                  <div className="w-14 h-14 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {i.image_url
                      ? <img src={imgUrl(i.image_url, 120)} alt={i.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/40" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.name}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">{i.price} {i.currency}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setQty(i.id, i.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm w-5 text-center font-medium">{i.quantity}</span>
                      <button
                        onClick={() => setQty(i.id, i.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-bold">{(i.price * i.quantity).toFixed(0)} {i.currency}</p>
                    <button
                      onClick={() => remove(i.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-destructive active:scale-90 transition-transform touch-manipulation"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CHECKOUT */}
          {step === "checkout" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                L'équipe 416 vous contacte sur WhatsApp pour confirmer la livraison.
              </p>
              {/* Récap */}
              <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>{i.name} ×{i.quantity}</span>
                    <span>{(i.price * i.quantity).toFixed(0)} {i.currency}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-1 flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-primary">{total.toFixed(0)} {currency}</span>
                </div>
              </div>
              {/* Formulaire */}
              <div className="space-y-1.5">
                <Label htmlFor="ck-name" className="text-sm">Nom complet *</Label>
                <Input
                  id="ck-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Votre nom"
                  autoComplete="name"
                  style={{ fontSize: "16px" /* empêche zoom iOS */ }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ck-wa" className="text-sm">WhatsApp *</Label>
                <Input
                  id="ck-wa"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+243 81 234 5678"
                  type="tel"
                  autoComplete="tel"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ck-notes" className="text-sm">Notes (taille, quartier…)</Label>
                <Textarea
                  id="ck-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Taille M, Livraison Gombe"
                  style={{ fontSize: "16px" }}
                />
              </div>
              {/* Espace pour que le clavier mobile ne masque pas le bouton */}
              <div className="h-4" />
            </div>
          )}
        </div>

        {/* Footer avec bouton CTA */}
        {step === "cart" && items.length > 0 && (
          <div className="px-4 py-4 border-t border-border shrink-0 bg-background">
            <div className="flex justify-between text-sm font-medium mb-3">
              <span className="text-muted-foreground">{count} article{count > 1 ? "s" : ""}</span>
              <span className="font-bold text-primary">{total.toFixed(0)} {currency}</span>
            </div>
            <Button
              className="w-full font-semibold h-12 text-base touch-manipulation"
              onClick={() => setStep("checkout")}
            >
              Passer commande
            </Button>
          </div>
        )}

        {step === "checkout" && (
          <div className="px-4 py-4 border-t border-border shrink-0 bg-background">
            <Button
              className="w-full font-semibold h-12 text-base touch-manipulation"
              onClick={submit}
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi en cours…</>
                : "Confirmer la commande"
              }
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
