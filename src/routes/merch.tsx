import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Merch, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ExternalLink, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/merch")({
  component: MerchPage,
  head: () => ({ meta: [{ title: "Boutique — 416 Records" }] }),
});

function MerchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();
  const [items, setItems] = useState<Merch[]>([]);
  const [artists, setArtists] = useState<Record<string, Artist>>({});
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("Tous");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    Promise.all([
      supabase.from("merch").select("*").order("created_at", { ascending: false }),
      supabase.from("artists").select("*"),
    ]).then(([m, a]) => {
      setItems((m.data as Merch[]) ?? []);
      const map: Record<string, Artist> = {};
      ((a.data as Artist[]) ?? []).forEach((x) => { map[x.id] = x; });
      setArtists(map);
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  const cats = useMemo(() => ["Tous", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[]))], [items]);
  const filtered = cat === "Tous" ? items : items.filter((i) => i.category === cat);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Édition limitée</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Boutique officielle</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Le merch officiel de la maison 416 Records et de ses artistes.</p>
        </div>

        {cats.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {cats.map((c) => (
              <Button key={c} size="sm" variant={c === cat ? "default" : "secondary"} onClick={() => setCat(c)}>{c}</Button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            Aucun article disponible.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((m) => (
              <div key={m.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all">
                <div className="aspect-square bg-secondary overflow-hidden">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-10 w-10 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold truncate">{m.name}</h3>
                  {m.artist_id && artists[m.artist_id] && (
                    <Link
                      to="/artists/$id"
                      params={{ id: m.artist_id }}
                      className="text-xs text-primary hover:underline inline-block"
                    >
                      {artists[m.artist_id].name}
                    </Link>
                  )}
                  {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                  <div className="flex items-center justify-between pt-2">
                    {m.price != null ? (
                      <span className="text-primary font-bold">{m.price} {m.currency}</span>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                    {!m.in_stock && <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">Épuisé</span>}
                  </div>
                  {m.in_stock && m.price != null ? (
                    <Button size="sm" onClick={() => addToCart(m)} className="w-full mt-2">
                      <Plus className="h-3 w-3 mr-1" /> Ajouter au panier
                    </Button>
                  ) : m.external_url ? (
                    <Button asChild size="sm" variant="secondary" className="w-full mt-2">
                      <a href={m.external_url} target="_blank" rel="noreferrer">Voir <ExternalLink className="h-3 w-3 ml-1" /></a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
