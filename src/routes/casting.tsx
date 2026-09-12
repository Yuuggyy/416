/**
 * Casting — Phase 0 du concours 416 Records
 *
 * Parcours : s'abonner → envoyer sa vidéo (bouton « Participer ») →
 * mobiliser ses amis (abonnés uniquement) pour liker.
 * 140 candidats sérieux visés ; 36 sélectionnés au composite (jury 60% +
 * likes 40%) + 4 repêchés par les likes = 40 au parking (E1, 26 nov 2026).
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, Heart, Users, Video, Trophy, Loader, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import {
  CASTING,
  uploadPhase0Video,
  type CastingApplication,
} from "@/lib/phase0";

export const Route = createFileRoute("/casting")({
  component: CastingPage,
  head: () => ({ meta: [{ title: "Casting — 416 Records" }] }),
});

function CastingPage() {
  const { user, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<CastingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);
  const sessionLikesRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("casting_applications")
      .select("*, casting_votes(count)")
      .in("status", ["approved", "selected", "repeche"])
      .order("created_at", { ascending: false });
    setApps((data as unknown as CastingApplication[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // mes votes déjà placés
  useEffect(() => {
    if (!user) return;
    supabase
      .from("casting_votes")
      .select("application_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setVotedIds(new Set(data.map((v: { application_id: string }) => v.application_id)));
      });
  }, [user]);

  async function like(app: CastingApplication) {
    if (!user) { toast.error("Crée un compte pour liker — c'est gratuit."); return; }
    if (votedIds.has(app.id)) return;
    const { error } = await supabase
      .from("casting_votes")
      .insert({ application_id: app.id, user_id: user.id });
    if (error) {
      toast.error(error.code === "23505" ? "Tu as déjà liké ce candidat." : "Erreur lors du vote.");
      return;
    }
    setVotedIds((prev) => new Set(prev).add(app.id));
    setApps((prev) =>
      prev.map((a) =>
        a.id === app.id ? { ...a, votes: [{ count: (a.votes?.[0]?.count ?? 0) + 1 }] } : a
      )
    );
    sessionLikesRef.current += 1;
    if (sessionLikesRef.current === 1) {
      // Premier like de la session : invitation officielle au vote
      toast.success("Vote enregistré !");
      setInviteOpen(true);
    } else {
      const nudges = [
        "Encore un vote ! Le public compte pour 40 % de la sélection.",
        "Continue — 4 candidats seront repêchés par les likes seuls.",
        "Chaque like fait monter ton artiste au classement.",
        "Ton vote peut envoyer quelqu'un au parking de l'Épisode 1.",
      ];
      toast.success(nudges[(sessionLikesRef.current - 2) % nudges.length]);
    }
  }

  const totalLikes = apps.reduce((sum, a) => sum + (a.votes?.[0]?.count ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        {/* ---------- HERO ---------- */}
        <section className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Phase 0 — Casting digital</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-2">
            Fais-toi repérer avant le parking.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base">
            Les 40 places de l'épisode 1 se jouent ici. Envoie ta vidéo, mobilise tes potes —
            seuls les abonnés de l'appli peuvent liker — et défends ta place.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Stat icon={<Video className="h-4 w-4" />} label="Candidatures" value={`${apps.length}/${CASTING.targetCandidates}`} />
            <Stat icon={<Heart className="h-4 w-4" />} label="Likes total" value={String(totalLikes)} />
            <Stat icon={<Users className="h-4 w-4" />} label="Places en jeu" value={`${CASTING.totalForE1}`} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Repêchés likes" value={`${CASTING.repecheByLikes}`} />
          </div>
        </section>

        {/* ---------- COMMENT ÇA MARCHE ---------- */}
        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          <Step n={1} title="Abonne-toi" text="Crée ton compte gratuit sur l'appli 416. Sans abonnement, pas de vote, pas de casting." />
          <Step n={2} title="Envoie ta vidéo" text="Appuie sur « Participer », envoie ton meilleur son en vidéo. Le jury la note (écriture, prod, prestance, potentiel vidéo) sur 10." />
          <Step n={3} title="Mobilise tes likes" text="Tes amis s'abonnent aussi et likent ta page. 36 places au score composite (jury 60% + likes 40%), 4 sauvés par les likes seuls." />
        </section>

        {/* ---------- BOUTON PARTICIPER ---------- */}
        <section className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <ParticipateDialog onSubmitted={load} />
          ) : (
            <Button asChild size="lg">
              <Link to="/login">S'abonner pour participer</Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Candidature = 1 vidéo d'un son déjà sorti. Deadline : 15 novembre 2026.
          </p>
        </section>

        {/* ---------- INVITATION AU VOTE (s'ouvre au premier like) ---------- */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2">
                <MousePointerClick className="h-5 w-5 text-primary" />
                Ton like compte !
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-1">
                <p>
                  Tu viens de voter pour un artiste. Scrolle la galerie et like
                  tes artistes préférés : <strong>le public pèse 40 % du score final</strong>,
                  et <strong>4 candidats seront repêchés rien que par les likes</strong>.
                </p>
                <p className="text-xs">
                  36 places se jouent au score composite (jury 60 % + likes 40 %),
                  4 autres au classement des likes. Vote jusqu'au 15 novembre 2026.
                </p>
              </DialogDescription>
            </DialogHeader>
            <Button
              className="w-full gap-2"
              onClick={() => {
                setInviteOpen(false);
                document.getElementById("casting-gallery")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Heart className="h-4 w-4" /> Scroller et liker mes préférés
            </Button>
          </DialogContent>
        </Dialog>

        {/* ---------- GALERIE ---------- */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : apps.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Aucune candidature validée pour l'instant. Sois le premier à participer.
          </p>
        ) : (
          <div id="casting-gallery" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-28">
            {apps.map((app) => {
              const likes = app.votes?.[0]?.count ?? 0;
              const voted = votedIds.has(app.id);
              return (
                <div key={app.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
                  <video
                    src={app.video_url}
                    controls
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{app.artist_name}</p>
                      {app.status === "selected" && <BadgeTone tone="green">Retenu</BadgeTone>}
                      {app.status === "repeche" && <BadgeTone tone="blue">Repêché</BadgeTone>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{app.track_title}</p>
                    <Button
                      variant={voted ? "secondary" : "default"}
                      size="sm"
                      className="mt-auto w-full gap-2"
                      onClick={() => like(app)}
                      disabled={voted}
                    >
                      <Heart className={`h-4 w-4 ${voted ? "fill-current" : ""}`} />
                      {voted ? `Liké — ${likes}` : `Liker — ${likes}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ============== SOUS-COMPOSANTS ============== */

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm mb-2">{n}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function BadgeTone({ children, tone }: { children: React.ReactNode; tone: "green" | "blue" }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
        tone === "green"
          ? "bg-green-500/10 text-green-500 border-green-500/30"
          : "bg-blue-500/10 text-blue-500 border-blue-500/30"
      }`}
    >
      {children}
    </span>
  );
}

function ParticipateDialog({ onSubmitted }: { onSubmitted: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Choisis ta vidéo."); return; }
    if (!artistName.trim() || !trackTitle.trim()) { toast.error("Nom d'artiste et titre requis."); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/login" }); return; }
      const url = await uploadPhase0Video("casting", user.id, file);
      const { error } = await supabase.from("casting_applications").insert({
        user_id: user.id,
        artist_name: artistName.trim(),
        track_title: trackTitle.trim(),
        description: description.trim() || null,
        video_url: url,
      });
      if (error) throw error;
      toast.success("Candidature envoyée ! Elle sera visible dès sa validation. Partage-la pour récolter les likes.");
      setOpen(false);
      setArtistName(""); setTrackTitle(""); setDescription(""); setFile(null);
      onSubmitted();
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'envoi. Vérifie ta connexion et réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2"><Send className="h-4 w-4" /> Participer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ma candidature Phase 0</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="artist">Nom d'artiste</Label>
            <Input id="artist" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Ex. Yuggy" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du son</Label>
            <Input id="title" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} placeholder="Ex. Kinshasa Makuta" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">En quelques mots (optionnel)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ton parcours, ce que défend ce son…" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video">Ta vidéo (un son déjà sorti, format vertical ou paysage, ≤ 3 min)</Label>
            <input
              ref={fileRef}
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5"
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} — {(file.size / 1024 / 1024).toFixed(1)} Mo</p>}
          </div>
          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Send className="h-4 w-4" /> Envoyer ma candidature</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
