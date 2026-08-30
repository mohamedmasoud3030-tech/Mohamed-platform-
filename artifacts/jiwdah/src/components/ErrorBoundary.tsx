import { Component, type ErrorInfo, type ReactNode } from "react";
import { SITE_CONFIG } from "@/config/site";
import { withBase } from "@/lib/base-path";
import { APP_BUILD, createErrorReference } from "@/lib/support";
import { normaliseRoute, track } from "@/lib/analytics";

type Props = { children: ReactNode };
type State = { hasError: boolean; reference: string; route: string };

const COPY = {
  ar: {
    title: "حدث خطأ غير متوقع في هذه الصفحة",
    body: "لم يضع شيء من عملك. أعد تحميل الصفحة، وإن تكرر الخطأ أرسل لنا رقم المرجع أدناه على واتساب وسنعالجه.",
    reference: "رقم المرجع",
    reload: "إعادة تحميل الصفحة",
    home: "العودة إلى البداية",
    whatsapp: "إبلاغنا عبر واتساب",
  },
  en: {
    title: "Something went wrong on this page",
    body: "Nothing you were working on was lost. Reload the page, and if it happens again send us the reference below on WhatsApp and we will fix it.",
    reference: "Reference",
    reload: "Reload the page",
    home: "Back to home",
    whatsapp: "Report on WhatsApp",
  },
} as const;

function activeLocale(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  return document.documentElement.lang === "en" ? "en" : "ar";
}

/**
 * Last line of defence: without this, a render error leaves a blank white page
 * with no explanation and no way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, reference: "", route: "" };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const reference = createErrorReference();
    const route = typeof window !== "undefined" ? window.location.pathname : "unknown";
    this.setState({ reference, route });
    // Kept in the browser console only — never transmitted anywhere automatically.
    console.error(`[LENA ${reference}] ${route} @ ${APP_BUILD}`, error, info.componentStack);
    // Records only that a crash happened, and where by route shape. Never the error.
    track("app_error_shown", { route: normaliseRoute(route) });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const locale = activeLocale();
    const text = COPY[locale];
    const report = `${text.reference}: ${this.state.reference} | ${this.state.route} | ${APP_BUILD}`;
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.primaryWhatsApp}?text=${encodeURIComponent(report)}`;

    return (
      <div className="lena-public">
        <main className="lena-page lena-container" id="main-content">
          <p className="lena-kicker">LENA</p>
          <h1 className="lena-page-title">{text.title}</h1>
          <p className="lena-lead">{text.body}</p>
          <p className="lena-support-reference">
            {text.reference}: <strong dir="ltr">{this.state.reference}</strong>
          </p>
          <div className="lena-actions">
            <button type="button" className="lena-primary" onClick={() => window.location.reload()}>
              {text.reload}
            </button>
            <a className="lena-secondary" href={withBase("/")}>
              {text.home}
            </a>
            <a className="lena-secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
              {text.whatsapp}
            </a>
          </div>
        </main>
      </div>
    );
  }
}
