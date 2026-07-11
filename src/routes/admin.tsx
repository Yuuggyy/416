import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase, type Movie, type Artist, type Track, type Merch } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Pencil, Trash2, Plus, Upload, Film, Music, ShoppingBag, Settings as SettingsIcon, Inbox, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppSettings } from "@/lib/app-settings";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — 416 Records" }] }),
});

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isAdmin) { navigate({ to: "/" }); return; }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-3xl sm:text-5xl font-bold">Panneau d'administration</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Gérez films, artistes et boutique depuis un seul endroit.</p>
        </div>

        <Tabs defaultValue="movies" className="space-y-6">
          <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-card border border-border h-auto p-1 inline-flex w-max sm:flex sm:flex-wrap sm:w-full mx-4 sm:mx-0">
              <TabsTrigger value="orders" className="gap-2 shrink-0"><Inbox className="h-4 w-4" /> Commandes</TabsTrigger>
              <TabsTrigger value="movies" className="gap-2 shrink-0"><Film className="h-4 w-4" /> Films</TabsTrigger>
              <TabsTrigger value="artists" className="gap-2 shrink-0"><Music className="h-4 w-4" /> Artistes</TabsTrigger>
              <TabsTrigger value="tracks" className="gap-2 shrink-0"><Music className="h-4 w-4" /> Titres</TabsTrigger>
              <TabsTrigger value="merch" className="gap-2 shrink-0"><ShoppingBag className="h-4 w-4" /> Boutique</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 shrink-0"><SettingsIcon className="h-4 w-4" /> Apparence</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders"><OrdersAdmin /></TabsContent>
          <TabsContent value="movies"><MoviesAdmin /></TabsContent>
          <TabsContent value="artists"><ArtistsAdmin /></TabsContent>
          <TabsContent value="tracks"><TracksAdmin /></TabsContent>
          <TabsContent value="merch"><MerchAdmin /></TabsContent>
          <TabsContent value="settings"><SettingsAdmin /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ============== ORDERS ============== */
type OrderRow = {
  id: string;
  customer_name: string | null;
  whatsapp: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
};

function OrdersAdmin() {
  const [list, setList] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("id,customer_name,whatsapp,items,total,currency,notes,status,created_at,user_id").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data as OrderRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Statut mis à jour"); refresh();
  };

  const waLink = (o: OrderRow) => {
    const num = o.whatsapp.replace(/[^\d]/g, "");
    const lines = o.items.map((i) => `• ${i.quantity}× ${i.name} (${i.price} ${o.currency})`).join("\n");
    const msg = `Bonjour ${o.customer_name ?? ""}, 416 Records au sujet de votre commande :\n${lines}\nTotal : ${o.total} ${o.currency}`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Commandes ({list.length})</h2>
      {list.length === 0 && <p className="text-muted-foreground">Aucune commande pour l'instant.</p>}
      {list.map((o) => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold">{o.customer_name ?? "Client"}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
              <p className="text-sm mt-1">WhatsApp : <span className="font-mono">{o.whatsapp}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${
                o.status === "done" ? "border-green-500/40 text-green-500" :
                o.status === "cancelled" ? "border-destructive/40 text-destructive" :
                "border-primary/40 text-primary"
              }`}>{o.status}</span>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="pending">En attente</option>
                <option value="contacted">Contacté</option>
                <option value="done">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
          <div className="text-sm space-y-1">
            {o.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-muted-foreground">
                <span>{i.quantity}× {i.name}</span>
                <span>{(i.price * i.quantity).toFixed(2)} {o.currency}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t border-border">
              <span>Total</span><span>{o.total} {o.currency}</span>
            </div>
          </div>
          {o.notes && <p className="text-xs text-muted-foreground italic">Note : {o.notes}</p>}
          <Button asChild size="sm" className="w-full sm:w-auto">
            <a href={waLink(o)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-1" /> Contacter sur WhatsApp
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}


/* ============== MOVIES ============== */
type MovieForm = { title: string; description: string; poster_url: string; backdrop_url: string; video_url: string; category: string; genre: string; year: string; duration_minutes: string; featured: boolean; };
const emptyMovie: MovieForm = { title: "", description: "", poster_url: "", backdrop_url: "", video_url: "", category: "Tendances", genre: "", year: "", duration_minutes: "", featured: false };

function MoviesAdmin() {
  const [list, setList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<MovieForm>(emptyMovie);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("movies").select("id,title,category,genre,year,duration_minutes,featured,created_at,poster_url").order("created_at", { ascending: false });
    setList((data as Movie[]) ?? []); setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const startEdit = (m: Movie) => {
    setEditingId(m.id);
    setForm({ title: m.title, description: m.description ?? "", poster_url: m.poster_url ?? "", backdrop_url: m.backdrop_url ?? "", video_url: m.video_url, category: m.category, genre: m.genre ?? "", year: m.year?.toString() ?? "", duration_minutes: m.duration_minutes?.toString() ?? "", featured: m.featured });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(emptyMovie); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.video_url) { toast.error("Titre et URL vidéo requis"); return; }
    setSaving(true);
    const payload = { title: form.title, description: form.description || null, poster_url: form.poster_url || null, backdrop_url: form.backdrop_url || null, video_url: form.video_url, category: form.category || "Tendances", genre: form.genre || null, year: form.year ? parseInt(form.year) : null, duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null, featured: form.featured };
    const { error } = editingId ? await supabase.from("movies").update(payload).eq("id", editingId) : await supabase.from("movies").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Film mis à jour" : "Film ajouté"); cancel(); refresh();
  };

  const remove = async (m: Movie) => {
    if (!confirm(`Supprimer "${m.title}" ?`)) return;
    const { error } = await supabase.from("movies").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); refresh();
  };

  return (
    <div className="space-y-8">
      <FormCard title={editingId ? "Modifier le film" : "Ajouter un film"} icon={editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Titre *" full><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Description" full><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></Field>
          <Field label="URL vidéo * (mp4, HLS ou YouTube)" full>
            <div className="flex gap-2"><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} required /><UploadButton accept="video/*" folder="videos" onUploaded={(url) => setForm((f) => ({ ...f, video_url: url }))} /></div>
          </Field>
          <Field label="Affiche (poster)"><div className="flex gap-2"><Input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} /><UploadButton accept="image/*" folder="posters" onUploaded={(url) => setForm((f) => ({ ...f, poster_url: url }))} /></div></Field>
          <Field label="Image de fond"><div className="flex gap-2"><Input value={form.backdrop_url} onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })} /><UploadButton accept="image/*" folder="backdrops" onUploaded={(url) => setForm((f) => ({ ...f, backdrop_url: url }))} /></div></Field>
          <Field label="Catégorie"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Genre"><Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></Field>
          <Field label="Année"><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
          <Field label="Durée (min)"><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></Field>
          <div className="flex items-center gap-3 md:col-span-2"><Switch id="featured-m" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /><Label htmlFor="featured-m">Mettre à la une</Label></div>
          <FormActions editing={!!editingId} saving={saving} onCancel={cancel} />
        </form>
      </FormCard>
      <ListSection title="Catalogue films" count={list.length} loading={loading}>
        {list.map((m) => (
          <Row key={m.id} thumb={m.poster_url} onEdit={() => startEdit(m)} onRemove={() => remove(m)}>
            <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{m.title}</h3>{m.featured && <Badge>À la une</Badge>}</div>
            <p className="text-xs text-muted-foreground truncate">{m.category} • {m.year ?? "—"} • {m.genre ?? "—"}</p>
          </Row>
        ))}
      </ListSection>
    </div>
  );
}

/* ============== ARTISTS ============== */
type ArtistForm = { name: string; bio: string; photo_url: string; cover_url: string; genre: string; featured: boolean; };
const emptyArtist: ArtistForm = { name: "", bio: "", photo_url: "", cover_url: "", genre: "", featured: false };

function ArtistsAdmin() {
  const [list, setList] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ArtistForm>(emptyArtist);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("artists").select("id,name,bio,image_url,genre,created_at").order("created_at", { ascending: false });
    setList((data as Artist[]) ?? []); setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const startEdit = (a: Artist) => {
    setEditingId(a.id);
    setForm({ name: a.name, bio: a.bio ?? "", photo_url: a.photo_url ?? "", cover_url: a.cover_url ?? "", genre: a.genre ?? "", featured: a.featured });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(emptyArtist); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Nom requis"); return; }
    setSaving(true);
    const payload = { name: form.name, bio: form.bio || null, photo_url: form.photo_url || null, cover_url: form.cover_url || null, genre: form.genre || null, featured: form.featured };
    const { error } = editingId ? await supabase.from("artists").update(payload).eq("id", editingId) : await supabase.from("artists").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Artiste mis à jour" : "Artiste ajouté"); cancel(); refresh();
  };

  const remove = async (a: Artist) => {
    if (!confirm(`Supprimer "${a.name}" ? (Ses titres seront aussi supprimés)`)) return;
    const { error } = await supabase.from("artists").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); refresh();
  };

  return (
    <div className="space-y-8">
      <FormCard title={editingId ? "Modifier l'artiste" : "Ajouter un artiste"} icon={editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *" full><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Bio" full><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} /></Field>
          <Field label="Photo (carré)"><div className="flex gap-2"><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /><UploadButton accept="image/*" folder="artists" onUploaded={(url) => setForm((f) => ({ ...f, photo_url: url }))} /></div></Field>
          <Field label="Bannière (cover)"><div className="flex gap-2"><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /><UploadButton accept="image/*" folder="artists" onUploaded={(url) => setForm((f) => ({ ...f, cover_url: url }))} /></div></Field>
          <Field label="Genre"><Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Afro, Rap, Jazz..." /></Field>
          <div className="flex items-center gap-3"><Switch id="featured-a" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /><Label htmlFor="featured-a">Mettre en avant</Label></div>
          <FormActions editing={!!editingId} saving={saving} onCancel={cancel} />
        </form>
      </FormCard>
      <ListSection title="Roster" count={list.length} loading={loading}>
        {list.map((a) => (
          <Row key={a.id} thumb={a.photo_url} round onEdit={() => startEdit(a)} onRemove={() => remove(a)}>
            <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{a.name}</h3>{a.featured && <Badge>En avant</Badge>}</div>
            <p className="text-xs text-muted-foreground truncate">{a.genre ?? "—"}</p>
          </Row>
        ))}
      </ListSection>
    </div>
  );
}

/* ============== TRACKS ============== */
type TrackForm = { artist_id: string; title: string; audio_url: string; video_url: string; cover_url: string; release_year: string; spotify_url: string; };
const emptyTrack: TrackForm = { artist_id: "", title: "", audio_url: "", video_url: "", cover_url: "", release_year: "", spotify_url: "" };

function TracksAdmin() {
  const [list, setList] = useState<(Track & { artist?: { name: string } })[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TrackForm>(emptyTrack);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([
      supabase.from("tracks").select("id,title,audio_url,video_url,cover_url,duration_seconds,release_year,artist_id,artist:artists(name),created_at").order("created_at", { ascending: false }),
      supabase.from("artists").select("id,name,genre").order("name"),
    ]);
    setList((t.data as any) ?? []); setArtists((a.data as Artist[]) ?? []); setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const startEdit = (t: Track) => {
    setEditingId(t.id);
    setForm({ artist_id: t.artist_id, title: t.title, audio_url: t.audio_url, video_url: t.video_url ?? "", cover_url: t.cover_url ?? "", release_year: t.release_year?.toString() ?? "", spotify_url: t.spotify_url ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(emptyTrack); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.artist_id || !form.title) { toast.error("Artiste et titre requis"); return; }
    if (!form.audio_url && !form.spotify_url) { toast.error("Renseigne soit un fichier audio, soit un lien Spotify"); return; }
    setSaving(true);
    const payload = { artist_id: form.artist_id, title: form.title, audio_url: form.audio_url || "", video_url: form.video_url || null, cover_url: form.cover_url || null, release_year: form.release_year ? parseInt(form.release_year) : null, spotify_url: form.spotify_url || null };
    const { error } = editingId ? await supabase.from("tracks").update(payload).eq("id", editingId) : await supabase.from("tracks").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Titre mis à jour" : "Titre ajouté"); cancel(); refresh();
  };

  const remove = async (t: Track) => {
    if (!confirm(`Supprimer "${t.title}" ?`)) return;
    const { error } = await supabase.from("tracks").delete().eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); refresh();
  };

  return (
    <div className="space-y-8">
      <FormCard title={editingId ? "Modifier le titre" : "Ajouter un titre"} icon={editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}>
        {artists.length === 0 ? (
          <p className="text-muted-foreground">Ajoutez d'abord un artiste dans l'onglet "Artistes".</p>
        ) : (
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Artiste *">
              <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— Choisir —</option>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Titre *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Lien Spotify (recommandé)" full>
              <Input value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })} placeholder="https://open.spotify.com/track/..." />
              <p className="text-xs text-muted-foreground mt-1">Avec ce lien, la lecture se fait dans l'app via le player Spotify officiel (compte comme un vrai stream). Aucun fichier audio à uploader.</p>
            </Field>
            <Field label="Audio (optionnel, mp3/wav)" full><div className="flex gap-2"><Input value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} placeholder="Laisser vide si Spotify renseigné" /><UploadButton accept="audio/*" folder="audio" onUploaded={(url) => setForm((f) => ({ ...f, audio_url: url }))} /></div></Field>
            <Field label="Clip vidéo (URL YouTube/mp4)" full><div className="flex gap-2"><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /><UploadButton accept="video/*" folder="videos" onUploaded={(url) => setForm((f) => ({ ...f, video_url: url }))} /></div></Field>
            <Field label="Pochette"><div className="flex gap-2"><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /><UploadButton accept="image/*" folder="covers" onUploaded={(url) => setForm((f) => ({ ...f, cover_url: url }))} /></div></Field>
            <Field label="Année"><Input type="number" value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} /></Field>
            <FormActions editing={!!editingId} saving={saving} onCancel={cancel} />
          </form>
        )}
      </FormCard>
      <ListSection title="Titres" count={list.length} loading={loading}>
        {list.map((t) => (
          <Row key={t.id} thumb={t.cover_url} onEdit={() => startEdit(t)} onRemove={() => remove(t)}>
            <h3 className="font-semibold truncate">{t.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{t.artist?.name ?? "—"} • {t.release_year ?? "—"}</p>
          </Row>
        ))}
      </ListSection>
    </div>
  );
}

/* ============== MERCH ============== */
type MerchForm = { name: string; description: string; image_url: string; price: string; currency: string; category: string; artist_id: string; in_stock: boolean; external_url: string; };
const emptyMerch: MerchForm = { name: "", description: "", image_url: "", price: "", currency: "EUR", category: "", artist_id: "", in_stock: true, external_url: "" };

function MerchAdmin() {
  const [list, setList] = useState<Merch[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<MerchForm>(emptyMerch);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [m, a] = await Promise.all([
      supabase.from("merch").select("id,name,image_url,price,currency,category,in_stock,artist_id,created_at").order("created_at", { ascending: false }),
      supabase.from("artists").select("id,name,genre").order("name"),
    ]);
    setList((m.data as Merch[]) ?? []); setArtists((a.data as Artist[]) ?? []); setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const startEdit = (m: Merch) => {
    setEditingId(m.id);
    setForm({ name: m.name, description: m.description ?? "", image_url: m.image_url ?? "", price: m.price?.toString() ?? "", currency: m.currency, category: m.category ?? "", artist_id: m.artist_id ?? "", in_stock: m.in_stock, external_url: m.external_url ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(emptyMerch); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Nom requis"); return; }
    setSaving(true);
    const payload = { name: form.name, description: form.description || null, image_url: form.image_url || null, price: form.price ? parseFloat(form.price) : null, currency: form.currency || "EUR", category: form.category || null, artist_id: form.artist_id || null, in_stock: form.in_stock, external_url: form.external_url || null };
    const { error } = editingId ? await supabase.from("merch").update(payload).eq("id", editingId) : await supabase.from("merch").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Article mis à jour" : "Article ajouté"); cancel(); refresh();
  };

  const remove = async (m: Merch) => {
    if (!confirm(`Supprimer "${m.name}" ?`)) return;
    const { error } = await supabase.from("merch").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); refresh();
  };

  return (
    <div className="space-y-8">
      <FormCard title={editingId ? "Modifier l'article" : "Ajouter un article"} icon={editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *" full><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Description" full><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></Field>
          <Field label="Image" full><div className="flex gap-2"><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /><UploadButton accept="image/*" folder="merch" onUploaded={(url) => setForm((f) => ({ ...f, image_url: url }))} /></div></Field>
          <Field label="Prix"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Devise"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="EUR" /></Field>
          <Field label="Catégorie"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="T-shirt, Vinyle, Hoodie..." /></Field>
          <Field label="Artiste lié (optionnel)">
            <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— Aucun —</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Lien externe (commande)" full><Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." /></Field>
          <div className="flex items-center gap-3 md:col-span-2"><Switch id="stock" checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} /><Label htmlFor="stock">En stock</Label></div>
          <FormActions editing={!!editingId} saving={saving} onCancel={cancel} />
        </form>
      </FormCard>
      <ListSection title="Boutique" count={list.length} loading={loading}>
        {list.map((m) => (
          <Row key={m.id} thumb={m.image_url} onEdit={() => startEdit(m)} onRemove={() => remove(m)}>
            <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{m.name}</h3>{!m.in_stock && <Badge>Épuisé</Badge>}</div>
            <p className="text-xs text-muted-foreground truncate">{m.category ?? "—"} • {m.price != null ? `${m.price} ${m.currency}` : "—"}</p>
          </Row>
        ))}
      </ListSection>
    </div>
  );
}

/* ============== SHARED ============== */
function FormCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">{icon} {title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`space-y-2 ${full ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>;
}
function FormActions({ editing, saving, onCancel }: { editing: boolean; saving: boolean; onCancel: () => void }) {
  return (
    <div className="md:col-span-2 flex gap-2">
      <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Enregistrer" : "Ajouter"}</Button>
      {editing && <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>}
    </div>
  );
}
function ListSection({ title, count, loading, children }: { title: string; count: number; loading: boolean; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold mb-4">{title} ({count})</h2>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="space-y-2">{children}{count === 0 && <p className="text-muted-foreground">Vide pour le moment.</p>}</div>}
    </section>
  );
}
function Row({ thumb, round, children, onEdit, onRemove }: { thumb: string | null; round?: boolean; children: React.ReactNode; onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg">
      <div className={`w-14 h-14 flex-shrink-0 bg-secondary overflow-hidden ${round ? "rounded-full" : "rounded"}`}>
        {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <Button size="sm" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/40 px-1.5 rounded">{children}</span>;
}

function UploadButton({ accept, folder, onUploaded }: { accept: string; folder: string; onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    try {
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type || undefined });
      if (error) {
        toast.error(
          error.message?.includes("Bucket not found")
            ? "Bucket 'media' introuvable dans Supabase Storage. Crée-le (public) puis réessaie."
            : error.message || "Échec de l'upload",
        );
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success("Uploadé");
    } catch (err: any) {
      toast.error(err?.message || "Erreur réseau pendant l'upload");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
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

/* ============== SETTINGS ============== */
function SettingsAdmin() {
  const { settings, update } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const k of Object.keys(form) as (keyof typeof form)[]) {
        await update(k, form[k]);
      }
      toast.success("Apparence mise à jour");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <FormCard title="Identité de l'app" icon={<SettingsIcon className="h-5 w-5 text-primary" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de l'app" full>
            <Input value={form.app_name} onChange={(e) => set("app_name", e.target.value)} placeholder="416 Records" />
          </Field>
          <Field label="Logo (URL ou upload)" full>
            <div className="flex gap-2">
              <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
              <UploadButton accept="image/*" folder="branding" onUploaded={(url) => set("logo_url", url)} />
            </div>
            {form.logo_url && (
              <div className="mt-3 flex items-center gap-3">
                <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded object-cover border border-border" />
                <span className="text-xs text-muted-foreground">Aperçu du logo</span>
              </div>
            )}
          </Field>
        </div>
      </FormCard>

      <FormCard title="Page d'accueil (visiteurs non connectés)" icon={<SettingsIcon className="h-5 w-5 text-primary" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Petit titre (eyebrow)" full>
            <Input value={form.landing_eyebrow} onChange={(e) => set("landing_eyebrow", e.target.value)} />
          </Field>
          <Field label="Titre principal — ligne 1">
            <Input value={form.landing_title_1} onChange={(e) => set("landing_title_1", e.target.value)} />
          </Field>
          <Field label="Titre principal — ligne 2 (doré)">
            <Input value={form.landing_title_2} onChange={(e) => set("landing_title_2", e.target.value)} />
          </Field>
          <Field label="Sous-titre / description" full>
            <Textarea rows={3} value={form.landing_subtitle} onChange={(e) => set("landing_subtitle", e.target.value)} />
          </Field>
          <Field label="Bouton principal">
            <Input value={form.landing_cta_primary} onChange={(e) => set("landing_cta_primary", e.target.value)} />
          </Field>
          <Field label="Bouton secondaire">
            <Input value={form.landing_cta_secondary} onChange={(e) => set("landing_cta_secondary", e.target.value)} />
          </Field>
        </div>
      </FormCard>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer
      </Button>
    </form>
  );
}
