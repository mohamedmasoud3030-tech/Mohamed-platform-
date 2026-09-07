import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Monitor, Smartphone } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

const DESKTOP_SCREENS = [
  { src: "/lara-beauty/desktop-01-login.png", label: { ar: "تسجيل الدخول", en: "Login" } },
  { src: "/lara-beauty/desktop-03-dashboard.png", label: { ar: "لوحة التحكم", en: "Dashboard" } },
  { src: "/lara-beauty/desktop-04-appointments.png", label: { ar: "المواعيد", en: "Appointments" } },
  { src: "/lara-beauty/desktop-05-pos.png", label: { ar: "نقطة البيع", en: "Point of Sale" } },
  { src: "/lara-beauty/desktop-06-customers.png", label: { ar: "العملاء", en: "Customers" } },
  { src: "/lara-beauty/desktop-07-services.png", label: { ar: "الخدمات", en: "Services" } },
  { src: "/lara-beauty/desktop-08-reports.png", label: { ar: "التقارير", en: "Reports" } },
];

const MOBILE_SCREENS = [
  { src: "/lara-beauty/mobile-03-dashboard.png", label: { ar: "لوحة التحكم", en: "Dashboard" } },
  { src: "/lara-beauty/mobile-04-appointments.png", label: { ar: "المواعيد", en: "Appointments" } },
  { src: "/lara-beauty/mobile-05-pos.png", label: { ar: "نقطة البيع", en: "Point of Sale" } },
];

const FEATURES = {
  ar: [
    "إدارة المواعيد والحجوزات اليومية",
    "نقطة بيع سريعة لموظفي الاستقبال",
    "قاعدة بيانات عملاء مع سجل الزيارات",
    "إدارة الخدمات والأسعار والعاملين",
    "تقارير يومية وشهرية للإيرادات",
    "واجهة عربية كاملة تعمل على الموبايل",
  ],
  en: [
    "Daily appointments and booking management",
    "Fast point-of-sale for reception staff",
    "Customer database with visit history",
    "Services, pricing, and staff management",
    "Daily and monthly revenue reports",
    "Full Arabic interface, mobile-ready",
  ],
};

function useInView(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
}

export default function LaraBeauty() {
  const { locale } = usePreferences();
  const isAr = locale === "ar";

  const [heroRef, heroVisible] = useInView();
  const [problemRef, problemVisible] = useInView();
  const [screensRef, screensVisible] = useInView();
  const [mobileRef, mobileVisible] = useInView();
  const [featuresRef, featuresVisible] = useInView();

  return (
    <PublicShell>
      <SeoHead
        title={isAr ? "Lara Beauty — نظام إدارة مراكز التجميل" : "Lara Beauty — beauty & spa management system"}
        description={
          isAr
            ? "نظام متكامل لإدارة مراكز التجميل والسبا: مواعيد، نقطة بيع، عملاء، خدمات، وتقارير."
            : "Complete system for beauty & spa centers: appointments, POS, customers, services, and reports."
        }
        path="/lara-beauty"
      />

      {/* ━━━ HERO ━━━ */}
      <section
        ref={heroRef}
        className={`lena-page lena-container scroll-animate ${heroVisible ? "is-visible" : ""}`}
      >
        <p className="lena-kicker">{isAr ? "دراسة حالة · نظام شغال" : "CASE STUDY · LIVE SYSTEM"}</p>
        <h1 className="lena-page-title">
          {isAr ? "Lara Beauty" : "Lara Beauty"}
        </h1>
        <p className="lena-lead">
          {isAr
            ? "نظام إدارة مراكز التجميل والسبا. يدير المواعيد والعملاء والمبيعات اليومية من شاشة واحدة — مبني من مشكلة حقيقية في مركز تجميل حقيقي."
            : "Beauty & spa management system. Runs appointments, customers, and daily sales from one screen — built from a real problem in a real beauty center."}
        </p>
        <div className="lena-actions">
          <a className="lena-primary" href="#screenshots">
            {isAr ? "شوف النظام من الداخل" : "See the system inside"}
            <ArrowUpRight size={16} />
          </a>
          <Link className="lena-secondary" to="/world">
            {isAr ? "العودة لعالم LENA" : "Back to LENA World"}
          </Link>
        </div>
      </section>

      {/* ━━━ PROBLEM → SOLUTION ━━━ */}
      <section
        ref={problemRef}
        className={`lena-section scroll-animate ${problemVisible ? "is-visible" : ""}`}
      >
        <div className="lena-container">
          <div className="lena-split">
            <article className="lena-glass lena-info-panel">
              <p className="lena-kicker">{isAr ? "المشكلة" : "THE PROBLEM"}</p>
              <h2>
                {isAr
                  ? "مركز تجميل يدير مواعيده بالورق وواتساب — حجوزات متضاربة، عملاء منسيين، ومفيش تقرير واضح في آخر اليوم."
                  : "A beauty center running appointments on paper and WhatsApp — conflicting bookings, forgotten clients, and no clear end-of-day report."}
              </h2>
            </article>
            <article className="lena-glass lena-info-panel">
              <p className="lena-kicker">{isAr ? "الحل" : "THE SOLUTION"}</p>
              <h2>
                {isAr
                  ? "نظام واحد يدير كل حاجة: مواعيد، عملاء، خدمات، مبيعات، وتقارير. يشتغل على الكمبيوتر والموبايل. بالعربي."
                  : "One system for everything: appointments, customers, services, sales, and reports. Works on desktop and mobile. In Arabic."}
              </h2>
            </article>
          </div>
        </div>
      </section>

      {/* ━━━ DESKTOP SCREENSHOTS ━━━ */}
      <section
        ref={screensRef}
        id="screenshots"
        className={`lena-section scroll-animate ${screensVisible ? "is-visible" : ""}`}
      >
        <div className="lena-container">
          <p className="lena-kicker">
            <Monitor size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            {" "}
            {isAr ? "من الداخل — Desktop" : "From the inside — Desktop"}
          </p>
          <h2 className="lena-section-title">
            {isAr
              ? "شاشات النظام الحقيقية على الكمبيوتر"
              : "Real system screens on desktop"}
          </h2>
          <div className="lena-screenshot-grid">
            {DESKTOP_SCREENS.map((screen) => (
              <figure className="lena-screenshot" key={screen.src}>
                <img
                  src={screen.src}
                  alt={screen.label[locale]}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>{screen.label[locale]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ MOBILE SCREENSHOTS ━━━ */}
      <section
        ref={mobileRef}
        className={`lena-section scroll-animate ${mobileVisible ? "is-visible" : ""}`}
      >
        <div className="lena-container">
          <p className="lena-kicker">
            <Smartphone size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            {" "}
            {isAr ? "على الموبايل" : "On mobile"}
          </p>
          <h2 className="lena-section-title">
            {isAr
              ? "نفس النظام يشتغل في جيب الموظف"
              : "The same system in the employee's pocket"}
          </h2>
          <div className="lena-screenshot-grid lena-screenshot-mobile">
            {MOBILE_SCREENS.map((screen) => (
              <figure className="lena-screenshot" key={screen.src}>
                <img
                  src={screen.src}
                  alt={screen.label[locale]}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>{screen.label[locale]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section
        ref={featuresRef}
        className={`lena-section scroll-animate ${featuresVisible ? "is-visible" : ""}`}
      >
        <div className="lena-container">
          <p className="lena-kicker">{isAr ? "القدرات" : "CAPABILITIES"}</p>
          <h2 className="lena-section-title">
            {isAr ? "إيه اللي يديره النظام" : "What the system runs"}
          </h2>
          <ul className="lena-features-list">
            {FEATURES[locale].map((feature) => (
              <li key={feature}>
                <CheckCircle2 size={18} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LenaCta service="wellness" />
    </PublicShell>
  );
}
