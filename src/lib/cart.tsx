import { createContext, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import { useAuth } from "./auth";
import type { Merch } from "./supabase";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  currency: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (m: Merch) => boolean;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const storageKey = (uid: string | null) => (uid ? `416-cart:${uid}` : "416-cart:guest");

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = false;
    try {
      const raw = localStorage.getItem(storageKey(uid));
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
    hydrated.current = true;
  }, [uid]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(storageKey(uid), JSON.stringify(items)); } catch {}
  }, [items, uid]);

  // Memoized functions — stable references
  const add = useMemo(() => (m: Merch) => {
    if (!user) { toast.error("Connectez-vous pour ajouter au panier"); return false; }
    if (m.price == null) return false;
    setItems((prev) => {
      const found = prev.find((i) => i.id === m.id);
      if (found) return prev.map((i) => i.id === m.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: m.id, name: m.name, price: Number(m.price), currency: m.currency || "EUR", image_url: m.image_url, quantity: 1 }];
    });
    setOpen(true);
    return true;
  }, [user]);

  const remove = useMemo(() => (id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);
  const setQty = useMemo(() => (id: string, qty: number) =>
    setItems((p) => qty <= 0 ? p.filter((i) => i.id !== id) : p.map((i) => i.id === id ? { ...i, quantity: qty } : i)), []);
  const clear = useMemo(() => () => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items, count, total,
      currency: items[0]?.currency ?? "EUR",
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add, remove, setQty, clear,
    };
  }, [items, isOpen, add, remove, setQty, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
