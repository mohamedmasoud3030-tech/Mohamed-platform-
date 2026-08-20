import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageSeo } from "@/content/seo";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { usePreferences } from "@/providers/preferences";

const COPY = {
  ar: {
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

  const signInHref = `/api/oauth/login${next !== DEFAULT_NEXT ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="lena-login min-h-screen flex items-center justify-center bg-surface" dir={direction}>
      <SeoHead title={seo.title} description={seo.description} path="/login" noindex />
      <Card className="w-full max-w-sm border-gold/20 bg-surface-light">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LenaLogo />
          </div>
          <CardTitle className="text-cream text-xl">{text.welcome}</CardTitle>
          <CardDescription className="text-cream-muted text-sm">{text.intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionExpired && !errorMessage && (
            <p className="lena-success text-sm" role="status">
              {text.sessionExpired}
            </p>
          )}
          {errorMessage && (
            <p className="lena-error text-sm" role="alert">
              {errorMessage}
            </p>
          )}
          <Button
            className="w-full btn-gold"
            size="lg"
            onClick={() => {
              window.location.href = signInHref;
            }}
          >
            <ShieldCheck size={17} />
            {text.action}
          </Button>
          <p className="text-cream-muted text-xs text-center">{text.note}</p>
          <Link to="/" className="text-cream-muted text-xs flex items-center justify-center gap-2 min-h-11">
            <ArrowLeft size={14} />
            {text.back}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
