import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ugwsvksozygdzgqeiddc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd3N2a3NvenlnZHpncWVpZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjUwNTUsImV4cCI6MjA4MjY0MTA1NX0.N8LzEgN3I4OsV4lw1hUMLM_rW4rJd-uz-lUf-qTrKxc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});

export const ADMIN_EMAILS = ["guymuzongo1234@gmail.com"];

export const isAdminEmail = (email: string | null | undefined) =>
  !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());

export type Movie = {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string;
  category: string;
  genre: string | null;
  year: number | null;
  duration_minutes: number | null;
  featured: boolean;
  created_at: string;
};
