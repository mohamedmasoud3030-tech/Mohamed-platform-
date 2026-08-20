import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { TRPCProvider } from "./providers/trpc";
import { PreferencesProvider, usePreferences } from "./providers/preferences";
import { bootstrapLocale } from "./lib/locale";
import { configureAnalytics } from "./lib/analytics";
import "./index.css";
import "./App.css";

/**
 * Resolve the language before the app mounts, and move unprefixed links
 * (including every URL shared before languages had their own address) onto a
 * prefixed one without losing the query string or hash.
 */
/**
 * Measurement is instrumented but collects nothing: no sink is installed, so
 * every track() call is a validated no-op. Turning collection on is a single
 * configureAnalytics({ sink, enabled: true }) call, and needs owner approval
 * (PRODUCT_MEASUREMENT_PLAN.md §8).
 */
configureAnalytics({ sink: null, enabled: false });

const { locale, redirectTo } = bootstrapLocale(window.location);
if (redirectTo) window.history.replaceState(null, "", redirectTo);

/**
 * The router's basename is the language segment, so every existing link such as
 * `to="/services"` resolves to `/ar/services` or `/en/services` automatically.
 * Remounting on language change is intentional: it is the moment the address,
 * the direction and the content all switch together.
 */
function LocalizedRouter() {
  const { locale: active } = usePreferences();
  return (
    <BrowserRouter basename={`/${active}`} key={active}>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <PreferencesProvider initialLocale={locale}>
        <TRPCProvider>
          <LocalizedRouter />
        </TRPCProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  </StrictMode>,
);
