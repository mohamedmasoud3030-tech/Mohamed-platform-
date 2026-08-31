import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router";
import SeoHead from "@/components/SeoHead";
import AmbientBackdrop from "@/layouts/AmbientBackdrop";
import { pageSeo } from "@/content/seo";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { usePreferences } from "@/providers/preferences";
import { withBase } from "@/lib/base-path";
import { withLocale } from "@/lib/locale";

const COPY = {
  ar: {
    eyebrow: "لوحة تحكم LENA",
    welcome: "لوحة تحكم LENA",
    intro: "الدخول مخصص لفريق LENA لمراجعة الاستفسارات وإدارة المشاريع.",
    action: "متابعة تسجيل الدخول",
    note: "سيتم تحويلك إلى صفحة تسجيل دخول آمنة، ثم تعود إلى المكان الذي كنت فيه.",
    back: "العودة إلى الموقع",
    sessionExpired: "انتهت صلاحية جلستك. سجّل الدخول مرة أخرى للمتابعة.",
    errors: {
      cancelled: "تم إلغاء تسجيل الدخول. يمكنك المحاولة مرة أخرى في أي وقت.",
      provider: "رفض مزوّد الدخول إتمام العملية. حاول مرة أخرى.",
      incomplete: "لم تكتمل عملية الدخول. ابدأ من جديد.",
      expired: "انتهت مهلة محاولة الدخول. ابدأ من جديد.",
      failed: "تعذر إكمال تسجيل الدخول. حاول مرة أخرى بعد قليل.",
      unavailable: "خدمة تسجيل الدخول غير متاحة حاليًا. حاول لاحقًا.",
    } as Record<string, string>,
  },
  en: {
    eyebrow: "LENA DASHBOARD",
    welcome: "LENA dashboard",
    intro: "Sign-in is reserved for the LENA team to review inquiries and manage projects.",
    action: "Continue to sign in",
    note: "You will be taken to a secure sign-in page, then returned to where you were.",
    back: "Back to the site",
    sessionExpired: "Your session has expired. Sign in again to continue.",
    errors: {
      cancelled: "Sign-in was cancelled. You can try again at any time.",
      provider: "The sign-in provider refused the request. Please try again.",
      incomplete: "The sign-in did not complete. Please start again.",
      expired: "The sign-in attempt timed out. Please start again.",
      failed: "Could not complete sign-in. Please try again shortly.",
      unavailable: "The sign-in service is unavailable right now. Try again later.",
    } as Record<string, string>,
  },
} as const;

const DEFAULT_NEXT = "/dashboard";

function safeNext(value: string | null): string {
  if (!value) return DEFAULT_NEXT;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT;
  return /^\/dashboard(?:\/[A-Za-z0-9\-._~/]*)?$/.test(value) ? value : DEFAULT_NEXT;
}

export default function Login() {
  const { locale, direction } = usePreferences();
  const { search } = useLocation();
  const text = COPY[locale];
  const seo = pageSeo("login", locale);

  const params = new URLSearchParams(search);
  const next = safeNext(params.get("next"));
  const errorCode = params.get("error");
  const errorMessage = errorCode ? (text.errors[errorCode] ?? text.errors.failed) : null;
  const sessionExpired = params.get("reason") === "session";

  const publicNext = withLocale(locale, next);
  const signInHref = `${withBase("/api/oauth/login")}?next=${encodeURIComponent(publicNext)}`;

  return (
    <div className="lena-login" dir={direction}>
      <AmbientBackdrop />
      <SeoHead title={seo.title} description={seo.description} path="/login" noindex />
      <main className="lena-login-card-wrap">
        <div className="lena-glass lena-login-card">
          <LenaLogo />
          <p className="lena-kicker">{text.eyebrow}</p>
          <h1>{text.welcome}</h1>
          <p className="lena-login-intro">{text.intro}</p>

          {sessionExpired && !errorMessage && (
            <p className="lena-success lena-login-status" role="status">
              {text.sessionExpired}
            </p>
          )}
          {errorMessage && (
            <p className="lena-error lena-login-status" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            className="lena-primary lena-login-cta"
            onClick={() => {
              window.location.href = signInHref;
            }}
          >
            <ShieldCheck size={17} />
            {text.action}
          </button>
          <p className="lena-login-note">{text.note}</p>
          <Link to="/" className="lena-login-back">
            <ArrowLeft size={14} />
            {text.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
