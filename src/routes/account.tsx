import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Mon compte — Lumière" }] }),
});

function AccountPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase
      .from("watchlist")
      .select("movie_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setCount(count ?? 0));
  }, [user, authLoading, navigate]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("6 caractères minimum");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour");
      setPassword("");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20 space-y-8">
        <header>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Mon compte</h1>
          <p className="text-muted-foreground">Gérez vos informations et votre sécurité.</p>
        </header>

        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Membre depuis {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            {isAdmin && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-wider text-primary border border-primary/40 px-2 py-1 rounded">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center pt-2">
            <div className="bg-secondary/40 rounded-lg p-4">
              <p className="font-display text-2xl font-bold text-gradient-gold">{count ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Films dans ma liste</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-4">
              <p className="font-display text-2xl font-bold text-gradient-gold">∞</p>
              <p className="text-xs text-muted-foreground mt-1">Streaming illimité</p>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Changer de mot de passe</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">Nouveau mot de passe</Label>
              <Input id="pwd" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving || !password}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Mettre à jour
            </Button>
          </form>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold mb-2">Déconnexion</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vous serez redirigé vers la page de connexion.
          </p>
          <Button
            variant="destructive"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </Button>
        </section>
      </main>
    </div>
  );
}
