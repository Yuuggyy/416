/**
 * Admin — Comptes : bascule free / premium / artiste
 * Source de vérité : table profiles (account_type).
 * Les comptes artistes publient quicks/clips avec badge « Artiste vérifié ».
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, RefreshCw, Search, BadgeCheck, Crown, User } from "lucide-react";
import { toast } from "sonner";

type AccountType = "free" | "premium" | "artist";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  artist_name: string | null;
  account_type: AccountType;
  created_at: string;
};

const TYPE_META: Record<AccountType, { label: string; hint: string }> = {
  free: { label: "Free", hint: "compte gratuit, pubs actives" },
  premium: { label: "Premium", hint: "sans pubs, accès complet" },
  artist: { label: "Artiste", hint: "badge vérifié + posts quicks/clips" },
};

export function AccountsAdmin() {
  const [list, setList] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [switching, setSwitching] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,artist_name,account_type,created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setList([]); }
    else setList((data as ProfileRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const setType = async (row: ProfileRow, account_type: AccountType) => {
    if (row.account_type === account_type) return;
    setSwitching(row.id);
    let payload: Record<string, unknown> = { account_type };
    if (account_type === "artist" && !row.artist_name) {
      const name = (row.display_name || row.email || "").split("@")[0];
      payload.artist_name = name;
    }
    const { error } = await supabase.from("profiles").update(payload).eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${row.email ?? row.id} → ${TYPE_META[account_type].label}`);
      setList((l) => l.map((p) => (p.id === row.id ? { ...p, account_type } : p)));
    }
    setSwitching(null);
  };

  const filtered = list.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.display_name ?? "").toLowerCase().includes(q) ||
      (p.artist_name ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: list.length,
    free: list.filter((p) => p.account_type === "free").length,
    premium: list.filter((p) => p.account_type === "premium").length,
    artist: list.filter((p) => p.account_type === "artist").length,
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Comptes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Basculez chaque compte entre Free, Premium et Artiste (badge vérifié).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Free</p>
          <p className="text-2xl font-bold mt-1">{stats.free}</p>
        </div>
        <div className="bg-card border border-yellow-500/30 rounded-xl p-4">
          <p className="text-xs text-yellow-500 uppercase tracking-wider flex items-center gap-1"><Crown className="h-3 w-3" /> Premium</p>
          <p className="text-2xl font-bold mt-1 text-yellow-500">{stats.premium}</p>
        </div>
        <div className="bg-card border border-primary/30 rounded-xl p-4">
          <p className="text-xs text-primary uppercase tracking-wider flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Artistes</p>
          <p className="text-2xl font-bold mt-1 text-primary">{stats.artist}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="pl-9"
        />
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Aucun compte.</p>
        ) : filtered.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border rounded-xl p-3 sm:p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5 truncate">
                {p.account_type === "artist" && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                {p.artist_name || p.display_name || p.email || p.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(["free", "premium", "artist"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={p.account_type === t ? "default" : "outline"}
                  disabled={switching === p.id || p.account_type === t}
                  onClick={() => setType(p, t)}
                  title={TYPE_META[t].hint}
                  className="gap-1"
                >
                  {t === "artist" ? <BadgeCheck className="h-3.5 w-3.5" /> : t === "premium" ? <Crown className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{TYPE_META[t].label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Note : les comptes artistes bénéficient d'un badge « vérifié » sur leurs posts et publient
        quicks ou clips ; l'équipe 416 valide toujours avant affichage.
      </p>
    </div>
  );
}
