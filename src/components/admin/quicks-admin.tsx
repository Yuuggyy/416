/**
 * Admin — onglet Quicks
 * Validation des quicks soumis, mise à la une, suppression, vues.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Star, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadPhase0Video, type Quick } from "@/lib/phase0";

export function QuicksAdmin() {
  const [quicks, setQuicks] = useState<Quick[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setQuicks((data as Quick[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function update(id: string, patch: Partial<Quick>) {
    const { error } = await supabase.from("quicks").update(patch).eq("id", id);
    if (error) { toast.error("Mise à jour impossible."); return; }
    setQuicks((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("quicks").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible."); return; }
    setQuicks((prev) => prev.filter((q) => q.id !== id));
    toast.success("Quick supprimé.");
  }

  const pending = quicks.filter((q) => q.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-lg border border-border bg-card px-3 py-1.5">
          Total : <strong>{quicks.length}</strong>
        </span>
        <span className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 px-3 py-1.5">
          En attente : <strong>{pending.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : quicks.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucun quick.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quicks.map((q) => (
            <div key={q.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
              <video src={q.video_url} controls preload="metadata" className="w-full aspect-[9/16] bg-black object-cover" />
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <p className="font-semibold text-sm truncate">
                  {q.title}
                  {(q as { kind?: string }).kind === "clip" && (
                    <span className="ml-1.5 text-[9px] font-bold uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded-full align-middle">Clip</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {q.views} vues</p>
                {q.status === "pending" && (
                  <span className="text-[10px] font-bold uppercase text-yellow-600 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full w-max">En attente</span>
                )}
                {q.status === "rejected" && (
                  <span className="text-[10px] font-bold uppercase text-red-600 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full w-max">Rejeté</span>
                )}
                {q.status === "approved" && (
                  <span className="text-[10px] font-bold uppercase text-green-600 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full w-max">Approuvé</span>
                )}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {q.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" className="gap-1" onClick={() => update(q.id, { status: "approved" })}><Check className="h-3.5 w-3.5" /> Approuver</Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => update(q.id, { status: "rejected" })}><X className="h-3.5 w-3.5" /> Rejeter</Button>
                    </>
                  )}
                  {q.status === "approved" && (
                    <Button
                      size="sm"
                      variant={q.featured ? "secondary" : "outline"}
                      className="gap-1"
                      onClick={() => update(q.id, { featured: !q.featured })}
                    >
                      <Star className={`h-3.5 w-3.5 ${q.featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      {q.featured ? "Retirer de la une" : "À la une"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => remove(q.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Suppr.
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
