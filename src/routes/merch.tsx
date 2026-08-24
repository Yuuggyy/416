import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Merch, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ExternalLink } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/merch")({
  component: MerchPage,
  head: () => ({ meta: [{ title: "Boutique — 416 Records" }] }),
});

function imgUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return "";
  if (url.includes(".supabase.co/storage/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}&format=webp`;
  }
  return url;
}

function MerchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Merch[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const aborted = useRef(false);

  useEffect(() => {
    aborted.current = false;
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    Promise.all([
      supabase.from("merch").select("*").order("created_at", { ascending: false }),
      supabase.from("artists").select("id,name"),
    ]).then(([m, a]) => {
      if (aborted.current) return;
      setItems((m.data as Merch[]) ?? []);
      setArtists((a.data as Artist[]) ?? []);
      setLoading(false);
    });
    return () => { aborted.current = true; };
  }, [user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const artistName = (id: string | null) => artists.find((a) => a.id === id)?.name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Boutique</h1>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">La boutique est vide pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="aspect-square bg-secondary">
                  {m.image_url ? <img src={imgUrl(m.image_url, 300)} alt={m.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/40" /></div>}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.category && <p className="text-xs text-muted-foreground mt-0.5">{m.category}</p>}
                  <div className="mt-auto pt-2">
                    <p className="text-lg font-bold text-primary">{m.price} {m.currency}</p>
                    {m.external_url ? (
                      <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Acheter externe
                      </a>
                    ) : (
                      <Button size="sm" className="mt-1 w-full" onClick={() => add(m)} disabled={!m.in_stock}>
                        {m.in_stock ? "Ajouter au panier" : "Rupture"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
