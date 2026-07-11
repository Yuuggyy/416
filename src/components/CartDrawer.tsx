import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, Loader2, ShoppingBag } from "lucide-react";
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
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const clean = whatsapp.replace(/[^\d+]/g, "");
    if (clean.length < 8) { toast.error("Numéro WhatsApp invalide"); return; }
    if (!name.trim()) { toast.error("Nom requis"); return; }
    setSaving(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user?.id ?? null,
      customer_name: name.trim(),
      whatsapp: clean,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      total,
      currency,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Commande envoyée ! L'équipe 416 vous contacte sur WhatsApp.");
    clear();
    setStep("cart"); setName(""); setWhatsapp(""); setNotes("");
    close();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-[100dvh] sm:h-full z-[60]">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {step === "cart" ? `Panier (${count})` : "Finaliser la commande"}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Votre panier est vide.
          </div>
        ) : step === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 items-center bg-card border border-border rounded-lg p-2">
                  <div className="w-14 h-14 bg-secondary rounded overflow-hidden flex-shrink-0">
                    {i.image_url && <img src={imgUrl(i.image_url, 120)} alt={i.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.name}</p>
                    <p className="text-xs text-primary">{i.price} {i.currency}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(i.id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-xs w-6 text-center">{i.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(i.id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{total.toFixed(2)} {currency}</span>
              </div>
              <Button className="w-full" onClick={() => setStep("checkout")}>Passer commande</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Laissez votre numéro WhatsApp, l'équipe 416 vous contacte pour finaliser le paiement et la livraison.
              </p>
              <div className="space-y-2">
                <Label htmlFor="ck-name">Nom complet</Label>
                <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ck-wa">Numéro WhatsApp</Label>
                <Input id="ck-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+33 6 12 34 56 78" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ck-notes">Notes (taille, adresse…)</Label>
                <Textarea id="ck-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="bg-card border border-border rounded-lg p-3 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Total</span><span>{total.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setStep("cart")}>Retour</Button>
              <Button className="flex-1" onClick={submit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmer
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
