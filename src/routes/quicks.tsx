/**
 * Quicks — le feed vertical de 416 Records
 * (les « Reels » d'Insta, les « Shorts » de YouTube ; ici : les Quicks.)
 * Format ≤ 60 s, défilement vertical, vues comptées, publication ouverte
 * aux abonnés (validation admin avant affichage).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Zap, Plus, Eye, Loader as LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadPhase0Video, type Quick } from "@/lib/phase0";

export const Route = createFileRoute("/quicks")({
  component: QuicksPage,
  head: () => ({ meta: [{ title: "Quicks — 416 Records" }] }),
});

function QuicksPage() {
  const { user, loading: authLoading } = useAuth();
  const [quicks, setQuicks] = useState<Quick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quicks")
      .select("*")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setQuicks((data as Quick[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
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
            <PublishQuickDialog onPublished={() => toast.success("Quick envoyé ! Il sera visible après validation.")} />
          ) : (
            <Button asChild><Link to="/login">S'abonner pour publier</Link></Button>
          )}
        </section>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : quicks.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <p>Aucun quick pour l'instant.</p>
            <p className="text-sm mt-1">Le premier est à toi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {quicks.map((q) => (
              <QuickCard key={q.id} quick={q} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function QuickCard({ quick }: { quick: Quick }) {
  const [views, setViews] = useState(quick.views);
  const countedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        <p className="text-white text-xs font-semibold truncate">{quick.title}</p>
        <p className="text-white/70 text-[10px] flex items-center gap-1 mt-0.5">
          <Eye className="h-3 w-3" /> {views} vues
        </p>
      </div>
      {quick.featured && (
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
          À la une
        </span>
      )}
    </div>
  );
}

function PublishQuickDialog({ onPublished }: { onPublished: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Choisis ta vidéo (≤ 60 s, vertical)."); return; }
    if (!title.trim()) { toast.error("Donne un titre à ton quick."); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no-user");
      const url = await uploadPhase0Video("quicks", user.id, file);
      const { error } = await supabase.from("quicks").insert({
        user_id: user.id,
        title: title.trim(),
        video_url: url,
      });
      if (error) throw error;
      setOpen(false);
      setTitle(""); setFile(null);
      onPublished();
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'envoi du quick.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Publier un quick</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau quick</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qtitle">Titre</Label>
            <Input id="qtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Punchline du jour" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qvideo">Vidéo (≤ 60 s, vertical)</Label>
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
            Ton quick sera visible après validation de l'équipe 416 (anti-contenu indésirable).
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
