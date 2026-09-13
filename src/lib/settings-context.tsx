"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Locale, translate } from "@/lib/i18n";

export type FontSize = "small" | "medium" | "large";

export interface Settings {
  locale: Locale;
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  notifications: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  locale: "pt",
  fontSize: "medium",
  highContrast: false,
  reducedMotion: false,
  notifications: true,
};

const STORAGE_KEY = "eco-verify-settings";

interface SettingsContextValue {
  settings: Settings;
  setSettings: (partial: Partial<Settings>) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {
      // localStorage indisponível ou dado corrompido: mantém padrão.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignora falha de persistência (ex.: modo privado).
    }
  }, [settings, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("contrast-high", settings.highContrast);
    root.classList.toggle("motion-reduce-force", settings.reducedMotion);
    root.dataset.fontSize = settings.fontSize;
    root.lang = settings.locale;
  }, [settings.highContrast, settings.reducedMotion, settings.fontSize, settings.locale]);

  const setSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...partial }));
  }, []);

  const t = useCallback((key: string) => translate(settings.locale, key), [settings.locale]);

  const value = useMemo(() => ({ settings, setSettings, t }), [settings, setSettings, t]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
