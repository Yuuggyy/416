import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, Loader2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function imgUrl(url: string | null | undefined, width: number): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=70&format=webp`;
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

  // Reset step quand on rouvre le panier
  useEffect(() => {
    if (isOpen && step === "success") {
      setStep("cart");
    }
  }, [isOpen]);

  const handleClose = () => {
    if (step === "success") {
      setStep("cart");
    }
    close();
  };

  const submit = async () => {
    const clean = whatsapp.replace(/[^\d+]/g, "");
    if (!name.trim()) { toast.error("Veuillez entrer votre nom"); return; }
    if (clean.length < 8) { toast.error("Numéro WhatsApp invalide"); return; }
    
    setSaving(true);
    try {
      const orderData = {
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        whatsapp: clean,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, currency: i.currency })),
        total,
        currency,
        notes: notes.trim() || null,
        status: "pending",
      };

      const { error } = await supabase.from("orders").insert(orderData);
      
      if (error) {
        console.error("Order error:", error);
        // Si la table n'existe pas, on affiche quand même un succès
        // car la commande sera transmise par WhatsApp
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          // Table orders manquante — fallback WhatsApp
          const waMsg = encodeURIComponent(
            `🛍️ Nouvelle commande 416 Records\n\nNom: ${name.trim()}\nWhatsApp: ${clean}\nTotal: ${total.toFixed(2)} ${currency}\n\nArticles:\n${items.map(i => `- ${i.name} x${i.quantity} (${i.price} ${i.currency})`).join("\n")}${notes.trim() ? `\n\nNotes: ${notes.trim()}` : ""}`
          );
          window.open(`https://wa.me/243000000000?text=${waMsg}`, "_blank");
          setStep("success");
          clear();
          setName(""); setWhatsapp(""); setNotes("");
          return;
        }
        toast.error("Erreur lors de l'envoi. Réessayez.");
        return;
      }

      setStep("success");
      clear();
      setName(""); setWhatsapp(""); setNotes("");
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent 
        side="right"
        className="w-full sm:max-w-md flex flex-col h-[100dvh] sm:h-full"
        style={{ zIndex: 80 }}
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {step === "cart" && `Panier (${count})`}
            {step === "checkout" && "Finaliser la commande"}
            {step === "success" && "Commande confirmée"}
          </SheetTitle>
        </SheetHeader>

        {/* SUCCÈS */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-lg">Commande envoyée !</p>
              <p className="text-sm text-muted-foreground mt-1">
                L'équipe 416 Records va vous contacter sur WhatsApp pour confirmer la livraison et le paiement.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">Fermer</Button>
          </div>
        )}

        {/* PANIER VIDE */}
        {step === "cart" && items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12 text-primary/30" />
            <p className="text-sm">Votre panier est vide.</p>
          </div>
        )}

        {/* ÉTAPE PANIER */}
        {step === "cart" && items.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 items-center bg-card border border-border rounded-lg p-2">
                  <div className="w-14 h-14 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {i.image_url ? (
                      <img src={imgUrl(i.image_url, 120)} alt={i.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.name}</p>
                    <p className="text-xs text-primary font-semibold">{i.price} {i.currency}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => setQty(i.id, i.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90 transition-transform"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs w-6 text-center font-medium">{i.quantity}</span>
                      <button
                        onClick={() => setQty(i.id, i.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90 transition-transform"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs font-bold">{(i.price * i.quantity).toFixed(2)} {i.currency}</p>
                    <button
                      onClick={() => remove(i.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-90 transition-transform"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3 shrink-0">
              <div className="flex justify-between font-semibold text-sm">
                <span>Total ({count} article{count > 1 ? "s" : ""})</span>
                <span className="text-primary text-base">{total.toFixed(2)} {currency}</span>
              </div>
              <Button className="w-full font-semibold" onClick={() => setStep("checkout")}>
                Passer commande
              </Button>
            </div>
          </>
        )}

        {/* ÉTAPE CHECKOUT */}
        {step === "checkout" && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
              <p className="text-sm text-muted-foreground">
                Laissez vos informations — l'équipe 416 vous contacte sur WhatsApp pour le paiement et la livraison.
              </p>

              {/* Récap commande */}
              <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>{i.name} × {i.quantity}</span>
                    <span>{(i.price * i.quantity).toFixed(2)} {i.currency}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-1 mt-1 flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-primary">{total.toFixed(2)} {currency}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-name">Nom complet *</Label>
                <Input
                  id="ck-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className={!name.trim() && saving ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ck-wa">Numéro WhatsApp *</Label>
                <Input
                  id="ck-wa"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+243 81 234 5678"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ck-notes">Notes (taille, adresse, quartier…)</Label>
                <Textarea
                  id="ck-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Taille M, Livraison Gombe…"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => setStep("cart")} disabled={saving}>
                Retour
              </Button>
              <Button className="flex-1 font-semibold" onClick={submit} disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Envoi…</>
                ) : "Confirmer la commande"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
