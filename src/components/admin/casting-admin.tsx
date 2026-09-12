/**
 * Admin — onglet Casting (Phase 0)
 * Gestion des candidatures : validation, grille jury /10, score composite
 * (jury 60% + likes 40%), sélection assistée 36 + 4 repêchés likes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Heart, Check, X, ClipboardList, Users } from "lucide-react";
import { toast } from "sonner";
import {
  CASTING,
  CRITERIA,
  computeSelection,
  juryTotal,
  type CastingApplication,
  type JuryScore,
} from "@/lib/phase0";

export function CastingAdmin() {
  const { user } = useAuth();
  const [apps, setApps] = useState<CastingApplication[]>([]);
  const [scores, setScores] = useState<JuryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("casting_applications").select("*, casting_votes(count)").order("created_at", { ascending: false }),
      supabase.from("jury_scores").select("*"),
    ]);
    setApps((a as unknown as CastingApplication[]) ?? []);
    setScores((s as JuryScore[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const likesOf = (a: CastingApplication) => a.votes?.[0]?.count ?? 0;
  const myScoreFor = (appId: string): JuryScore | undefined =>
    scores.find((s) => s.application_id === appId && user && s.jury_user_id === user.id);

  const { scored, selectedIds, repecheIds } = useMemo(
    () => computeSelection(apps, scoresByApp(scores)),
    [apps, scores]
  );
  const compositeOf = (appId: string) => scored.find((s) => s.application.id === appId)?.composite ?? 0;

  const pending = apps.filter((a) => a.status === "pending");
  const visible = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  async function setStatus(app: CastingApplication, status: CastingApplication["status"]) {
    const { error } = await supabase.from("casting_applications").update({ status }).eq("id", app.id);
    if (error) { toast.error("Mise à jour impossible."); return; }
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
    toast.success(status === "approved" ? "Candidature validée — visible et likable."
      : status === "rejected" ? "Candidature écartée."
      : status === "selected" ? "Marqué RETENU."
      : "Marqué REPÊCHÉ.");
  }

  /** Applique la sélection officielle : 36 composite + 4 likes, les autres reviennent à approved */
  async function applySelection() {
    const toSelected: string[] = [];
    const toRepeche: string[] = [];
    const toApproved: string[] = [];
    for (const s of scored) {
      if (selectedIds.has(s.application.id)) toSelected.push(s.application.id);
      else if (repecheIds.has(s.application.id)) toRepeche.push(s.application.id);
      else if (["approved"].includes(s.application.status)) toApproved.push(s.application.id);
    }
    const apply = async (ids: string[], status: string) => {
      for (const id of ids) await supabase.from("casting_applications").update({ status }).eq("id", id);
    };
    await apply(toSelected, "selected");
    await apply(toRepeche, "repeche");
    await apply(toApproved, "approved");
    await load();
    toast.success(`Sélection appliquée : ${toSelected.length} retenus + ${toRepeche.length} repêchés.`);
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Candidatures" value={`${apps.length} / ${CASTING.targetCandidates}`} />
        <MiniStat label="En attente" value={String(pending.length)} />
        <MiniStat label="Retenus + repêchés" value={String(apps.filter((a) => a.status === "selected" || a.status === "repeche").length) + " / " + CASTING.totalForE1} />
        <MiniStat label="Likes total" value={String(apps.reduce((s, a) => s + likesOf(a), 0))} />
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvées</SelectItem>
            <SelectItem value="selected">Retenues</SelectItem>
            <SelectItem value="repeche">Repêchées</SelectItem>
            <SelectItem value="rejected">Écartées</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-2" onClick={applySelection}>
          <ClipboardList className="h-4 w-4" /> Appliquer la sélection (36 + 4)
        </Button>
        <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
          Composite = jury /10 × 60 % + (likes ÷ max likes × 10) × 40 %
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucune candidature dans ce filtre.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3">Artiste / Titre</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-center"><Heart className="h-3.5 w-3.5 inline" /> Likes</th>
                <th className="p-3 text-center">Jury /10</th>
                <th className="p-3 text-center">Composite</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((app) => {
                const my = myScoreFor(app.id);
                const avg = scores.filter((s) => s.application_id === app.id);
                const juryAvg = avg.length ? (avg.reduce((s, x) => s + juryTotal(x), 0) / avg.length).toFixed(1) : "—";
                const likes = likesOf(app);
                return (
                  <tr key={app.id} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-semibold">{app.artist_name}</p>
                      <p className="text-xs text-muted-foreground">{app.track_title}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3 text-center">{likes}</td>
                    <td className="p-3 text-center">{my ? `${juryTotal(my)}/10 (moi)` : juryAvg}</td>
                    <td className="p-3 text-center font-semibold">{compositeOf(app.id).toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {app.status === "pending" && (
                          <>
                            <Button size="sm" variant="default" className="gap-1" onClick={() => setStatus(app, "approved")}><Check className="h-3.5 w-3.5" /> Valider</Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => setStatus(app, "rejected")}><X className="h-3.5 w-3.5" /> Écarter</Button>
                          </>
                        )}
                        <ScoreDialog app={app} myScore={my} onSaved={load} />
                        {!["selected", "repeche"].includes(app.status) && app.status === "approved" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setStatus(app, "selected")}>Retenir</Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(app, "repeche")}>Repêcher</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function scoresByApp(scores: JuryScore[]): Record<string, JuryScore[]> {
  const map: Record<string, JuryScore[]> = {};
  for (const s of scores) (map[s.application_id] ??= []).push(s);
  return map;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Users className="h-3 w-3" /> {label}
      </p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    approved: "bg-muted text-muted-foreground border-border",
    selected: "bg-green-500/10 text-green-600 border-green-500/30",
    repeche: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  const labels: Record<string, string> = {
    pending: "En attente", approved: "Approuvée", selected: "Retenue", repeche: "Repêchée", rejected: "Écartée",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.approved}`}>
      {labels[status] ?? status}
    </span>
  );
}

/* ---------- Fenêtre de notation jury ---------- */
function ScoreDialog({ app, myScore, onSaved }: { app: CastingApplication; myScore?: JuryScore; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(() =>
    myScore
      ? { ecriture: myScore.ecriture, choix_prod: myScore.choix_prod, prestance: myScore.prestance, potentiel_video: myScore.potentiel_video }
      : { ecriture: 0, choix_prod: 0, prestance: 0, potentiel_video: 0 }
  );
  const [comment, setComment] = useState(myScore?.comment ?? "");
  const [saving, setSaving] = useState(false);

  const total = CRITERIA.reduce((s, c) => s + (values[c.key] ?? 0), 0);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = {
      application_id: app.id,
      jury_user_id: user.id,
      ecriture: values.ecriture,
      choix_prod: values.choix_prod,
      prestance: values.prestance,
      potentiel_video: values.potentiel_video,
      comment: comment || null,
    };
    const { error } = myScore
      ? await supabase.from("jury_scores").update(payload).eq("id", myScore.id)
      : await supabase.from("jury_scores").insert(payload);
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible."); return; }
    toast.success(`Note enregistrée : ${total}/10`);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
        <ClipboardList className="h-3.5 w-3.5" /> {myScore ? `${juryTotal(myScore)}/10` : "Noter"}
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grille jury — {app.artist_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <video src={app.video_url} controls className="w-full rounded-md bg-black aspect-video" />
          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">
                    {c.label} <span className="text-muted-foreground">/ {c.max}</span>
                    <span className="block text-[10px] text-muted-foreground font-normal">{c.hint}</span>
                  </Label>
                  <span className="font-bold text-sm">{values[c.key] ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={c.max}
                  step={1}
                  value={values[c.key] ?? 0}
                  onChange={(e) => setValues((v) => ({ ...v, [c.key]: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="juryComment" className="text-xs">Commentaire (optionnel)</Label>
            <Textarea id="juryComment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Une force, une faiblesse…" />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-bold">{total}/10</p>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {myScore ? "Modifier ma note" : "Enregistrer ma note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
