import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase, type Movie } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Trash2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Lumière" }] }),
});

type Form = {
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  video_url: string;
  category: string;
  genre: string;
  year: string;
  duration_minutes: string;
  featured: boolean;
};

const empty: Form = {
  title: "", description: "", poster_url: "", backdrop_url: "", video_url: "",
  category: "Tendances", genre: "", year: "", duration_minutes: "", featured: false,
};

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isAdmin) { navigate({ to: "/" }); return; }
    refresh();
  }, [user, isAdmin, authLoading, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
    setMovies((data as Movie[]) ?? []);
    setLoading(false);
  };

  const startEdit = (m: Movie) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? "",
      poster_url: m.poster_url ?? "",
      backdrop_url: m.backdrop_url ?? "",
      video_url: m.video_url,
      category: m.category,
      genre: m.genre ?? "",
      year: m.year?.toString() ?? "",
      duration_minutes: m.duration_minutes?.toString() ?? "",
      featured: m.featured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => { setEditingId(null); setForm(empty); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.video_url) {
      toast.error("Titre et URL vidéo requis");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      poster_url: form.poster_url || null,
      backdrop_url: form.backdrop_url || null,
      video_url: form.video_url,
      category: form.category || "Tendances",
      genre: form.genre || null,
      year: form.year ? parseInt(form.year) : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      featured: form.featured,
    };
    const { error } = editingId
      ? await supabase.from("movies").update(payload).eq("id", editingId)
      : await supabase.from("movies").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Film mis à jour" : "Film ajouté");
    cancel();
    refresh();
  };

  const remove = async (m: Movie) => {
    if (!confirm(`Supprimer "${m.title}" ?`)) return;
    const { error } = await supabase.from("movies").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé");
    refresh();
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Panneau d'administration</h1>
          <p className="text-muted-foreground mt-2">Gérez le catalogue de films et séries.</p>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 mb-10">
          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
            {editingId ? <><Pencil className="h-5 w-5 text-primary" /> Modifier</> : <><Plus className="h-5 w-5 text-primary" /> Ajouter un film</>}
          </h2>
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>URL de la vidéo * (mp4, HLS, ou YouTube)</Label>
              <div className="flex gap-2">
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://... ou upload" required />
                <UploadButton accept="video/*" folder="videos" onUploaded={(url) => setForm((f) => ({ ...f, video_url: url }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Affiche (poster, vertical)</Label>
              <div className="flex gap-2">
                <Input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} placeholder="https://..." />
                <UploadButton accept="image/*" folder="posters" onUploaded={(url) => setForm((f) => ({ ...f, poster_url: url }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image de fond (backdrop)</Label>
              <div className="flex gap-2">
                <Input value={form.backdrop_url} onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })} placeholder="https://..." />
                <UploadButton accept="image/*" folder="backdrops" onUploaded={(url) => setForm((f) => ({ ...f, backdrop_url: url }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tendances, Action, Drame..." />
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} id="featured" />
              <Label htmlFor="featured">Mettre à la une (bannière d'accueil)</Label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Enregistrer" : "Ajouter"}
              </Button>
              {editingId && <Button type="button" variant="secondary" onClick={cancel}>Annuler</Button>}
            </div>
          </form>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-4">Catalogue ({movies.length})</h2>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="space-y-2">
              {movies.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
                  <div className="w-14 h-20 flex-shrink-0 bg-secondary rounded overflow-hidden">
                    {m.poster_url && <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{m.title}</h3>
                      {m.featured && <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/40 px-1.5 rounded">À la une</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.category} • {m.year ?? "—"} • {m.genre ?? "—"}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              {movies.length === 0 && <p className="text-muted-foreground">Aucun film. Ajoutez-en un ci-dessus.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function UploadButton({ accept, folder, onUploaded }: { accept: string; folder: string; onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onUploaded(data.publicUrl);
    toast.success("Fichier uploadé");
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };

  return (
    <>
      <input ref={ref} type="file" accept={accept} onChange={onPick} className="hidden" />
      <Button type="button" variant="secondary" onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </>
  );
}
