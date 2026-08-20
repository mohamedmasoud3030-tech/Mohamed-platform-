import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
  storeLocale,
  stripLocale,
  withLocale,
} from "@/lib/locale";

export type AppTheme = "dark" | "light";
export type AppLocale = SupportedLocale;

type PreferencesContextValue = {
  theme: AppTheme;
  locale: AppLocale;
  direction: "rtl" | "ltr";
  setTheme: (theme: AppTheme) => void;
  setLocale: (locale: AppLocale) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const THEME_STORAGE_KEY = "lena-digital-house.theme";

function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function PreferencesProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
}) {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = direction;
  }, [direction, locale]);

  /**
   * Changing language changes the address. The visitor stays on the page they
   * were reading — only the language segment of the URL is swapped.
   */
  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState((current) => {
      if (current === next) return current;
      storeLocale(next);
      if (typeof window !== "undefined") {
        const { pathname, search, hash } = window.location;
        window.history.pushState(null, "", `${withLocale(next, pathname)}${search}${hash}`);
      }
      return next;
    });
  }, []);

  // Back/forward between language versions must be honoured, not fought.
  useEffect(() => {
    function onPopState() {
      const fromUrl = window.location.pathname.split("/")[1];
      if (fromUrl === "ar" || fromUrl === "en") setLocaleState(fromUrl);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      locale,
      direction,
      setTheme,
      setLocale,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    }),
    [direction, locale, setLocale, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider");
  return value;
}

/** Router-relative path of the current page, i.e. without the language segment. */
export function currentRoutePath(): string {
  return typeof window === "undefined" ? "/" : stripLocale(window.location.pathname);
}
