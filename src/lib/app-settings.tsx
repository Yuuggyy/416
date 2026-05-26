import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

type Settings = { app_name: string; logo_url: string };

const DEFAULTS: Settings = { app_name: "416 Records", logo_url: "" };

type Ctx = {
  settings: Settings;
  refresh: () => Promise<void>;
  update: (key: keyof Settings, value: string) => Promise<void>;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  const refresh = async () => {
    const { data } = await supabase.from("app_settings").select("key,value");
    if (data) {
      const next: Settings = { ...DEFAULTS };
      for (const row of data as { key: string; value: string | null }[]) {
        if (row.key in next) (next as any)[row.key] = row.value ?? "";
      }
      setSettings(next);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const update = async (key: keyof Settings, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    setSettings((s) => ({ ...s, [key]: value }));
  };

  return <SettingsCtx.Provider value={{ settings, refresh, update }}>{children}</SettingsCtx.Provider>;
}

export function useAppSettings() {
  const v = useContext(SettingsCtx);
  if (!v) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return v;
}