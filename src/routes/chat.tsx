/**
 * Chat communautaire 416 — messages texte + vocaux
 * Statut "en train d'écrire / d'enregistrer" façon Snap (Realtime broadcast),
 * tags @ avec autocomplétion et notifications de mention.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchMessages, fetchProfiles, fetchUnreadCount, markAllRead,
  sendChatMessage, uploadChatAudio, extractMentions,
  displayName, type ChatMessage, type PublicProfile,
} from "@/lib/chat";
import {
  Loader2, Mic, Send, Trash2, BadgeCheck, X, Users, LogIn,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat — 416 Records" }] }),
});

type StatusState = { uid: string; name: string; state: "typing" | "recording"; at: number };

function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StatusState>>({});
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const statusChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingSentAtRef = useRef(0);

  const profileById = useMemo(() => {
    const m = new Map<string, PublicProfile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const nameOf = useCallback((uid: string) => {
    if (uid === user?.id) return "Toi";
    const p = profileById.get(uid);
    return p ? displayName(p) : "Abonné";
  }, [profileById, user?.id]);

  const isArtist = useCallback((uid: string) => profileById.get(uid)?.account_type === "artist", [profileById]);

  // ---------- chargement initial ----------
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const [msgs, profs, unread] = await Promise.all([
          fetchMessages(80), fetchProfiles(), fetchUnreadCount(),
        ]);
        if (!alive) return;
        setMessages(msgs);
        setProfiles(profs);
        if (unread > 0) {
          toast.info(`Tu as été taggé ${unread} fois dans le chat.`);
          markAllRead().catch(() => {});
        }
      } catch (e) {
        if (alive) toast.error("Impossible de charger le chat.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  // ---------- temps réel : nouveaux messages ----------
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("chat-messages-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.room !== "community") return;
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  // ---------- temps réel : statut écriture / vocal ----------
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("chat-status", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "status" }, ({ payload }) => {
        const p = payload as StatusState;
        if (!p?.uid || p.uid === user.id) return;
        setStatuses((prev) => ({ ...prev, [p.uid]: { ...p, at: Date.now() } }));
      })
      .subscribe();
    statusChannelRef.current = ch;
    // purge des statuts périmés (4 s sans rafraîchissement)
    const iv = setInterval(() => {
      setStatuses((prev) => {
        const now = Date.now();
        const next: Record<string, StatusState> = {};
        for (const [uid, s] of Object.entries(prev)) if (now - s.at < 4000) next[uid] = s;
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1500);
    return () => { clearInterval(iv); void supabase.removeChannel(ch); };
  }, [user]);

  // défilement automatique vers le bas
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const broadcastStatus = useCallback((state: "typing" | "recording" | "idle") => {
    const ch = statusChannelRef.current;
    if (!ch || !user) return;
    if (state === "typing") {
      const now = Date.now();
      if (now - typingSentAtRef.current < 1500) return; // throttle
      typingSentAtRef.current = now;
    }
    void ch.send({
      type: "broadcast", event: "status",
      payload: { uid: user.id, name: "user", state },
    });
  }, [user]);

  const onTextChange = (value: string) => {
    setText(value);
    // autocomplétion : dernier mot commençant par @
    const m = /@([\p{L}\p{N}_\- ]*)$/u.exec(value);
    setMentionQuery(m ? m[1].toLowerCase() : null);
    broadcastStatus("typing");
  };

  const applyMention = (p: PublicProfile) => {
    const name = displayName(p);
    setText((t) => t.replace(/@([\p{L}\p{N}_\- ]*)$/u, `@${name} `));
    setMentionQuery(null);
  };

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    return profiles
      .filter((p) => p.id !== user?.id)
      .map((p) => ({ p, name: displayName(p) }))
      .filter(({ name }) => name !== "Abonné" && name.toLowerCase().includes(mentionQuery))
      .slice(0, 6);
  }, [mentionQuery, profiles, user?.id]);

  const sendText = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      const { mentionIds } = extractMentions(text, profiles);
      const msg = await sendChatMessage({ userId: user.id, content: text.trim(), mentions: mentionIds });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setText("");
      broadcastStatus("idle");
    } catch (err) {
      toast.error((err as Error).message?.includes("row-level") ? "Connecte-toi pour écrire." : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  const deleteOwn = async (id: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (!error) setMessages((prev) => prev.filter((m) => m.id !== id));
    else toast.error("Suppression impossible.");
  };

  // ---------- enregistrement vocal ----------
  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const seconds = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        recorderRef.current = null;
        setRecording(false);
        setRecSeconds(0);
        if (!blob.size || seconds < 1) { toast.error("Vocal trop court."); return; }
        if (seconds > 120) { toast.error("Maximum 2 minutes."); return; }
        setSending(true);
        try {
          const msg = await uploadChatAudio(user!.id, blob, seconds);
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          broadcastStatus("idle");
        } catch (err) {
          toast.error("Envoi du vocal impossible.");
        } finally {
          setSending(false);
        }
      };
      startedAtRef.current = Date.now();
      rec.start();
      recorderRef.current = rec;
      setRecSeconds(0);
      setRecording(true);
      broadcastStatus("recording");
    } catch {
      toast.error("Micro indisponible. Vérifie l'autorisation du micro.");
    }
  };

  const stopRecording = (cancel: boolean) => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (cancel) {
      rec.onstop = () => rec.stream.getTracks().forEach((t) => t.stop());
      rec.state === "recording" && rec.stop();
      setRecording(false);
      setRecSeconds(0);
      broadcastStatus("idle");
      return;
    }
    rec.stop();
  };

  // ---------- rendu ----------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-md mx-auto px-6 pt-32 text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Le chat des abonnés</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Écris, envoie des vocaux et tague tes artistes préférés.
            Réservé aux abonnés de l'appli 416.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/login"><LogIn className="h-4 w-4" /> Se connecter / S'abonner </Link>
          </Button>
        </main>
      </div>
    );
  }

  const activeStatuses = Object.values(statuses);
  const typingNames = activeStatuses.filter((s) => s.state === "typing").map((s) => nameOf(s.uid));
  const recordingNames = activeStatuses.filter((s) => s.state === "recording").map((s) => nameOf(s.uid));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-0 flex flex-col"
            style={{ minHeight: "calc(100vh - 5rem)" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            Chat 416 <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">Abonnés</span>
          </h1>
          <p className="text-xs text-muted-foreground">{profiles.length} membres</p>
        </div>

        {/* liste des messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">
              Aucun message. Lance la conversation — premier message, premier tague !
            </p>
          ) : (
            messages.map((m) => {
              const own = m.sender_id === user.id;
              const parts = renderContent(m.content, profiles, own);
              return (
                <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
                    own ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-semibold ${own ? "text-primary-foreground/90" : "text-primary"}`}>
                        {nameOf(m.sender_id)}
                      </span>
                      {isArtist(m.sender_id) && (
                        <BadgeCheck className={`h-3.5 w-3.5 ${own ? "text-primary-foreground" : "text-primary"}`} />
                      )}
                      <span className={`text-[10px] ${own ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {own && (
                        <button
                          onClick={() => deleteOwn(m.id)}
                          className={`ml-1 ${own ? "text-primary-foreground/60 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                          aria-label="Supprimer">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {parts.length > 0 && <p className="text-sm leading-snug whitespace-pre-wrap break-words">{parts}</p>}
                    {m.audio_url && (
                      <audio controls preload="none" src={m.audio_url} className="mt-1.5 w-52 sm:w-64 h-10" />
                    )}
                    {m.audio_seconds ? (
                      <span className={`block text-[10px] mt-0.5 ${own ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        Vocal · {Math.floor(m.audio_seconds / 60)}:{String(m.audio_seconds % 60).padStart(2, "0")}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* statuts façon Snap */}
        <div className="h-6 px-2 pt-1 text-xs text-muted-foreground">
          {typingNames.length > 0 && (
            <span className="animate-pulse">
              {typingNames.join(", ")} {typingNames.length > 1 ? "écrivent" : "écrit"}…
            </span>
          )}
          {recordingNames.length > 0 && (
            <span className="ml-2 text-red-400 flex items-center gap-1 inline-flex animate-pulse">
              <Mic className="h-3 w-3" /> {recordingNames.join(", ")} {recordingNames.length > 1 ? "enregistrent" : "enregistre"} un vocal
            </span>
          )}
        </div>

        {/* saisie */}
        <div className="sticky bottom-0 bg-background border-t border-border py-2 pb-3 relative">
          {mentionCandidates.length > 0 && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
              {mentionCandidates.map(({ p, name }) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyMention(p)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-primary">@{name}</span>
                  {p.account_type === "artist" && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  <span className="text-xs text-muted-foreground">Tague cette personne</span>
                </button>
              ))}
            </div>
          )}
          {recording ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400 animate-pulse flex items-center gap-1">
                <Mic className="h-4 w-4" /> Enregistrement {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" className="gap-1" onClick={() => stopRecording(true)}>
                <X className="h-4 w-4" /> Annuler
              </Button>
              <Button size="sm" className="gap-1" onClick={() => stopRecording(false)}>
                <Send className="h-4 w-4" /> Envoyer
              </Button>
            </div>
          ) : (
            <form onSubmit={sendText} className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Écris un message… @ pour tager"
                className="flex-1"
                maxLength={500}
              />
              <Button type="button" size="icon" variant="ghost" aria-label="Vocal"
                      disabled={sending} onClick={startRecording}>
                <Mic className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Envoyer">
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

/** Rendu du texte avec tags @ en surbrillance */
function renderContent(content: string | null, profiles: PublicProfile[], own: boolean): React.ReactNode[] {
  if (!content) return [];
  const names = profiles
    .map((p) => displayName(p))
    .filter((n) => n !== "Abonné")
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (names.length === 0) return [content];
  const re = new RegExp(`(@(?:${names.join("|")}))`, "giu");
  const parts = content.split(re);
  return parts.map((part, i) =>
    part.startsWith("@") && re.test(part)
      ? <span key={i} className={`font-bold ${own ? "underline" : "text-primary"}`}>{part}</span>
      : <span key={i}>{part}</span>,
  );
}
