import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Mon compte — 416 Records" }] }),
});

function AccountPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const url = (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null;
    setAvatar(url);
  }, [user]);

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

  const onPickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image");
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Image illisible"));
        im.src = dataUrl;
      });
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: compressed } });
      if (error) throw error;
      setAvatar(compressed);
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
    setUploadingAvatar(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAvatar(null);
    toast.success("Photo retirée");
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 space-y-6 sm:space-y-8">
        <header>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-2">Mon compte</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gérez vos informations et votre sécurité.</p>
        </header>

        <section className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
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

        <section className="bg-card border border-border rounded-xl p-4 sm:p-6">
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

        <section className="bg-card border border-border rounded-xl p-4 sm:p-6">
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
