import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Merch, type Artist } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ExternalLink, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/merch")({
  component: MerchPage,
  head: () => ({ meta: [{ title: "Boutique — 416 Records" }] }),
});

// Modal de détail produit
function MerchModal({ item, artist, onClose, onAdd }: {
  item: Merch;
  artist?: Artist;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-square w-full bg-secondary rounded-t-2xl sm:rounded-t-2xl overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <X className="h-4 w-4" />
          </button>
          {!item.in_stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg uppercase tracking-widest">Épuisé</span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-5 space-y-3">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight">{item.name}</h2>
            {artist && (
              <Link to="/artists/$id" params={{ id: artist.id }} onClick={onClose}
                className="text-sm text-primary hover:underline mt-0.5 inline-block">
                {artist.name}
              </Link>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
          )}

          {item.category && (
            <span className="inline-block text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">
              {item.category}
            </span>
          )}

          <div className="flex items-center justify-between pt-1">
            {item.price != null ? (
              <span className="text-2xl font-bold text-primary">{item.price} {item.currency}</span>
            ) : <span />}
            {!item.in_stock && (
              <span className="text-xs uppercase tracking-wider text-muted-foreground border border-border rounded px-2 py-1">
                Épuisé
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2 space-y-2">
            {item.in_stock && item.price != null && (
              <Button size="lg" className="w-full font-semibold" onClick={() => { onAdd(); onClose(); }}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter au panier
              </Button>
            )}
            {item.external_url && (
              <Button asChild size="lg" variant="secondary" className="w-full">
                <a href={item.external_url} target="_blank" rel="noreferrer">
                  Voir sur le site <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();
  const [items, setItems] = useState<Merch[]>([]);
  const [artists, setArtists] = useState<Record<string, Artist>>({});
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("Tous");
  const [selected, setSelected] = useState<Merch | null>(null);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Édition limitée</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-1">Boutique officielle</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl">
            Le merch officiel de la maison 416 Records et de ses artistes.
          </p>
        </div>

        {cats.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                  c === cat
                    ? "bg-primary text-primary-foreground shadow-gold-glow"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            Aucun article disponible.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 active:scale-95 transition-all text-left"
              >
                <div className="aspect-square bg-secondary overflow-hidden relative">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {!m.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-end p-2">
                      <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Épuisé</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                  {m.artist_id && artists[m.artist_id] && (
                    <p className="text-xs text-primary truncate mt-0.5">{artists[m.artist_id].name}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {m.price != null ? (
                      <span className="text-primary font-bold text-sm">{m.price} {m.currency}</span>
                    ) : <span />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal détail */}
      {selected && (
        <MerchModal
          item={selected}
          artist={selected.artist_id ? artists[selected.artist_id] : undefined}
          onClose={() => setSelected(null)}
          onAdd={() => addToCart(selected)}
        />
      )}
    </div>
  );
}
