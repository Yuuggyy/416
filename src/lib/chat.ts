/**
 * Chat communautaire 416 — helpers
 * Messages texte + vocaux, tags @, notifications de mention.
 */
import { supabase } from "@/lib/supabase";

export type PublicProfile = {
  id: string;
  display_name: string | null;
  artist_name: string | null;
  account_type: string | null;
};

export type ChatMessage = {
  id: string;
  room: string;
  sender_id: string;
  content: string | null;
  audio_url: string | null;
  audio_seconds: number | null;
  mentions: string[];
  created_at: string;
};

/** Nom affichable d'un profil (nom d'artiste > display_name > "Abonné") */
export function displayName(p: { display_name?: string | null; artist_name?: string | null }): string {
  if (p.artist_name && p.artist_name.trim()) return p.artist_name.trim();
  if (p.display_name && p.display_name.trim()) return p.display_name.trim();
  return "Abonné";
}

/** Charger les profils publics (autocomplétion des tags) */
export async function fetchProfiles(): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, display_name, artist_name, account_type")
    .order("artist_name", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

/** Envoyer un message texte (avec mentions) */
export async function sendChatMessage(opts: {
  userId: string;
  content: string;
  mentions?: string[];
}): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room: "community",
      sender_id: opts.userId,
      content: opts.content,
      mentions: opts.mentions ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

/** Uploader un vocal puis l'envoyer */
export async function uploadChatAudio(userId: string, blob: Blob, seconds: number): Promise<ChatMessage> {
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  const path = `chat/${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("media")
    .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: blob.type || "audio/webm" });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  const { data: msg, error } = await supabase
    .from("chat_messages")
    .insert({
      room: "community",
      sender_id: userId,
      audio_url: data.publicUrl,
      audio_seconds: Math.round(seconds),
      mentions: [],
    })
    .select()
    .single();
  if (error) throw error;
  return msg as ChatMessage;
}

/** Derniers messages du salon */
export async function fetchMessages(limit = 80): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room", "community")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).reverse() as ChatMessage[];
}

/** Nombre de notifications non lues (tags) */
export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

/** Marquer toutes les notifications comme lues */
export async function markAllRead(): Promise<void> {
  await supabase.from("user_notifications").update({ read: true }).eq("read", false);
}

/** Extraire les ids mentionnés depuis un texte (@Nom) en se basant sur les profils */
export function extractMentions(text: string, profiles: PublicProfile[]): { content: string; mentionIds: string[] } {
  const mentionIds: string[] = [];
  let content = text;
  for (const p of profiles) {
    const name = displayName(p);
    if (name === "Abonné") continue;
    // correspondance @Nom exact (insensible à la casse, tirets/espaces inclus)
    const re = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$|[^\\p{L}\\p{N}])`, "iu");
    if (re.test(content)) mentionIds.push(p.id);
  }
  return { content, mentionIds: [...new Set(mentionIds)] };
}
