/**
 * Quicks — le feed vertical de 416 Records
 * (les « Reels » d'Insta, les « Shorts » de YouTube ; ici : les Quicks.)
 * Format ≤ 60 s, défilement vertical, vues comptées, publication ouverte
 * aux abonnés (validation admin avant affichage).
 * Phase 1 : les comptes artistes publient avec badge « Artiste vérifié »,
 * quicks (≤ 60 s) ou clips musicaux.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Zap, Plus, Eye, Loader as LoaderIcon, BadgeCheck, Music2, Film } from "lucide-react";
import { toast } from "sonner";
import { uploadPhase0Video, type Quick } from "@/lib/phase0";

export const Route = createFileRoute("/quicks")({
  component: QuicksPage,
  head: () => ({ meta: [{ title: "Quicks — 416 Records" }] }),
});

type PublicProfile = {
  id: string; display_name: string | null;
  artist_name: string | null; account_type: "free" | "premium" | "artist";
};

function QuicksPage() {
  const { user, loading: authLoading } = useAuth();
  const { isArtist } = useSubscription();
  const [quicks, setQuicks] = useState<Quick[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "quick" | "clip">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quicks")
      .select("*")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data as Quick[]) ?? [];
    setQuicks(list);
    // Profils publics (vue sans emails) pour les badges « Artiste vérifié »
    const ids = [...new Set(list.map((q) => q.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id,display_name,artist_name,account_type")
        .in("id", ids);
      const map: Record<string, PublicProfile> = {};
      for (const p of (profs as PublicProfile[]) ?? []) map[p.id] = p;
      setProfiles(map);
    } else setProfiles({});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = quicks.filter((q) => filter === "all" || (q as Quick & { kind?: string }).kind === filter || (filter === "quick" && !(q as Quick & { kind?: string }).kind));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Nouveau
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold mt-2">Quicks</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
              Des talks, des coulisses, des punchlines : tout ce que 416 fait vite et bien.
              60 secondes max, du vertical, du direct.
            </p>
          </div>
          {authLoading ? null : user ? (
            <PublishQuickDialog isArtist={isArtist} onPublished={() => toast.success("Envoyé ! Ce sera visible après validation.")} />
          ) : (
            <Button asChild><Link to="/login">S'abonner pour publier</Link></Button>
          )}
        </section>

        {/* Filtres quicks / clips */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {([
            { key: "all", label: "Tout", icon: <Zap className="h-3.5 w-3.5" /> },
            { key: "quick", label: "Quicks", icon: <Zap className="h-3.5 w-3.5" /> },
            { key: "clip", label: "Clips", icon: <Music2 className="h-3.5 w-3.5" /> },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : shown.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <p>{filter === "clip" ? "Aucun clip pour l'instant." : "Aucun quick pour l'instant."}</p>
            <p className="text-sm mt-1">Le premier est à toi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {shown.map((q) => (
              <QuickCard key={q.id} quick={q} profile={q.user_id ? profiles[q.user_id] : undefined} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function QuickCard({ quick, profile }: { quick: Quick; profile?: PublicProfile }) {
  const [views, setViews] = useState(quick.views);
  const countedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const kind = (quick as Quick & { kind?: string }).kind ?? "quick";
  const isArtistPost = profile?.account_type === "artist";

  // compteur de vues : 1 vue par session de navigation
  useEffect(() => {
    if (countedRef.current) return;
    const key = `quick_view_${quick.id}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      countedRef.current = true;
      setViews((v) => v + 1);
      supabase
        .from("quicks")
        .update({ views: quick.views + 1 })
        .eq("id", quick.id)
        .then(() => undefined, () => undefined);
    }
  }, [quick.id, quick.views]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] group">
      <video
        ref={videoRef}
        src={quick.video_url}
        loop
        muted
        playsInline
        preload="metadata"
        onPointerEnter={() => videoRef.current?.play().catch(() => undefined)}
        onPointerLeave={() => videoRef.current?.pause()}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        {isArtistPost && (
          <p className="text-white text-[10px] font-bold flex items-center gap-1 mb-0.5">
            <BadgeCheck className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{profile?.artist_name || profile?.display_name || "Artiste"} · vérifié</span>
          </p>
        )}
        <p className="text-white text-xs font-semibold truncate">{quick.title}</p>
        <p className="text-white/70 text-[10px] flex items-center gap-1 mt-0.5">
          <Eye className="h-3 w-3" /> {views} vues
        </p>
      </div>
      <div className="absolute top-2 left-2 flex gap-1.5">
        {quick.featured && (
          <span className="text-[9px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            À la une
          </span>
        )}
        {kind === "clip" && (
          <span className="text-[9px] font-bold uppercase bg-black/70 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Music2 className="h-2.5 w-2.5" /> Clip
          </span>
        )}
      </div>
    </div>
  );
}

function PublishQuickDialog({ isArtist, onPublished }: { isArtist: boolean; onPublished: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"quick" | "clip">("quick");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Choisis ta vidéo (≤ 60 s, vertical)."); return; }
    if (!title.trim()) { toast.error("Donne un titre à ta vidéo."); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no-user");
      const url = await uploadPhase0Video("quicks", user.id, file);
      const { error } = await supabase.from("quicks").insert({
        user_id: user.id,
        title: title.trim(),
        video_url: url,
        kind,
      });
      if (error) throw error;
      setOpen(false);
      setTitle(""); setFile(null); setKind("quick");
      onPublished();
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> {isArtist ? "Publier (artiste)" : "Publier un quick"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isArtist && <BadgeCheck className="h-4 w-4 text-primary" />}
            {isArtist ? "Nouvelle publication artiste" : "Nouveau quick"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {isArtist && (
            <div className="space-y-1.5">
              <Label>Type de post</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setKind("quick")}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-semibold transition-colors ${kind === "quick" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                  <Zap className="h-5 w-5" /> Quick
                  <span className="text-[10px] font-normal opacity-70">≤ 60 s, vertical</span>
                </button>
                <button type="button" onClick={() => setKind("clip")}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-semibold transition-colors ${kind === "clip" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                  <Music2 className="h-5 w-5" /> Clip
                  <span className="text-[10px] font-normal opacity-70">clip musical</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Tes posts s'affichent avec le badge « Artiste vérifié ».</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="qtitle">Titre</Label>
            <Input id="qtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "clip" ? "Ex. Freestyle — Titre du morceau" : "Ex. Punchline du jour"} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qvideo">Vidéo ({kind === "clip" ? "clip musical" : "≤ 60 s, vertical"})</Label>
            <input
              id="qvideo"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5"
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} — {(file.size / 1024 / 1024).toFixed(1)} Mo</p>}
          </div>
          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><LoaderIcon className="h-4 w-4" /> Publier</>}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {isArtist
              ? "Ton post sera visible après validation de l'équipe 416, avec ton badge artiste."
              : "Ton quick sera visible après validation de l'équipe 416 (anti-contenu indésirable)."}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
