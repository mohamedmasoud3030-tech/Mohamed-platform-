import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { TRPCProvider } from "./providers/trpc";
import { PreferencesProvider } from "./providers/preferences";
import "./index.css";
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <PreferencesProvider>
        <TRPCProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TRPCProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  </StrictMode>,
);
