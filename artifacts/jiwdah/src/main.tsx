import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { TRPCProvider } from "./providers/trpc";
import { PreferencesProvider, usePreferences } from "./providers/preferences";
import { bootstrapLocale, routerBasename } from "./lib/locale";
import { configureAnalytics } from "./lib/analytics";
import { firstPartySink } from "./lib/analytics/sink";
import "./index.css";
import "./App.css";

/**
 * Resolve the language before the app mounts, and move unprefixed links
 * (including every URL shared before languages had their own address) onto a
 * prefixed one without losing the query string or hash.
 */
/**
 * Measurement: aggregate counters on this site's own API. No third party, no
 * cookie, no identifier. The layer still filters development and preview hosts,
 * automated browsers and Do Not Track before anything is sent
 * (PRODUCT_MEASUREMENT_PLAN.md §5).
 */
configureAnalytics({ sink: firstPartySink, enabled: true });

const { locale, redirectTo } = bootstrapLocale(window.location);
if (redirectTo) window.history.replaceState(null, "", redirectTo);

/**
 * The router's basename is the deployment base path plus the language segment,
 * so every existing link such as `to="/services"` resolves to `/ar/services`
 * standalone or `/lena/ar/services` when mounted under MALEK.
 * Remounting on language change is intentional: it is the moment the address,
 * the direction and the content all switch together.
 */
function LocalizedRouter() {
  const { locale: active } = usePreferences();
  return (
    <BrowserRouter basename={routerBasename(active)} key={active}>
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
