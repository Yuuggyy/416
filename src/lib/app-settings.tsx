import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

type Settings = {
  app_name: string;
  logo_url: string;
  landing_eyebrow: string;
  landing_title_1: string;
  landing_title_2: string;
  landing_subtitle: string;
  landing_cta_primary: string;
  landing_cta_secondary: string;
};

const DEFAULTS: Settings = {
  app_name: "416 Records",
  logo_url: "",
  landing_eyebrow: "Maison de production",
  landing_title_1: "Films, musique,",
  landing_title_2: "une seule maison.",
  landing_subtitle:
    "Découvrez les films, les artistes et le merch officiel de 416 Records. Tout l'univers du label, en un seul endroit.",
  landing_cta_primary: "Entrer dans l'univers",
  landing_cta_secondary: "Déjà membre ?",
};

type Ctx = {
  settings: Settings;
  refresh: () => Promise<void>;
  update: (key: keyof Settings, value: string) => Promise<void>;
};

const SettingsCtx = createContext<Ctx | null>(null);

// Cache module-level : évite de refetch à chaque navigation
let settingsCache: Settings | null = null;
let cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(settingsCache ?? DEFAULTS);
  const fetching = useRef(false);

  const refresh = async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const { data } = await supabase.from("app_settings").select("key,value");
      if (data) {
        const next: Settings = { ...DEFAULTS };
        for (const row of data as { key: string; value: string | null }[]) {
          if (row.key in next && row.value != null && row.value !== "") {
            (next as any)[row.key] = row.value;
          }
        }
        settingsCache = next;
        cacheTs = Date.now();
        setSettings(next);
      }
    } finally {
      fetching.current = false;
    }
  };

  useEffect(() => {
    // Ne refetch que si le cache est expiré
    if (settingsCache && Date.now() - cacheTs < CACHE_TTL) {
      setSettings(settingsCache);
      return;
    }
    refresh();
  }, []);

  const update = async (key: keyof Settings, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    const next = { ...(settingsCache ?? settings), [key]: value };
    settingsCache = next;
    setSettings(next);
  };

  return <SettingsCtx.Provider value={{ settings, refresh, update }}>{children}</SettingsCtx.Provider>;
}

export function useAppSettings() {
  const v = useContext(SettingsCtx);
  if (!v) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return v;
}
