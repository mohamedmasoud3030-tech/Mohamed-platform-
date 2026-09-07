import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Shield,
  Zap,
  Users,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import SystemGrid from "@/components/SystemGrid";
import DigitalHouseOrbit from "@/features/home/DigitalHouseOrbit";
import ProcessSection from "@/features/home/ProcessSection";
import { useGatewayToWorld } from "@/features/home/HomeGatewayTransition";
import WorldContinuation from "@/features/world/spatial/WorldContinuation";
import { worldRegistry } from "@/features/world/registry";
import PublicShell from "@/layouts/PublicShell";
import { pageSeo } from "@/content/seo";
import { organizationJsonLd } from "@/lib/seo";
import {
  resolveContinuation,
  resolveRememberedFocus,
  useWorldMemory,
} from "@/lib/spatial";
import { usePreferences } from "@/providers/preferences";

/* ─── useInView hook ─── */
function useInView(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(element);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
}

/* ─── Animated counter ─── */
function AnimatedCounter({
  target,
  suffix = "",
  duration = 1500,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useInView({ threshold: 0.3 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const steps = 30;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span className="lena-counter-value" ref={ref as React.RefObject<HTMLSpanElement>}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Live counter section ─── */
function LiveCounter({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="lena-counter">
      <AnimatedCounter target={value} suffix={suffix} />
      <span className="lena-counter-label">{label}</span>
    </div>
  );
}

/* ─── AI Recommender ─── */
function AiRecommender() {
  const { locale } = usePreferences();
  const isAr = locale === "ar";
  const [ref, isInView] = useInView();

  return (
    <section
      ref={ref}
      className={`lena-section lena-recommender scroll-animate ${isInView ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <p className="lena-kicker">{isAr ? "🤖 دليل ذكي" : "🤖 Smart guide"}</p>
        <h2 className="lena-section-title">
          {isAr
            ? "مش متأكد أي نظام يناسبك؟"
            : "Not sure which system fits your business?"}
        </h2>
        <p className="lena-section-lead">
          {isAr
            ? "اختار نوع مشروعك وهنوريك النظام المناسب."
            : "Pick your business type and we'll show you the right system."}
        </p>
        <div className="lena-recommender-flow scroll-stagger">
          {(isAr
            ? ["عقارات", "مركز تجميل/سبا", "ضيافة/فنادق", "حاجة تانية"]
            : ["Real Estate", "Beauty & Spa", "Hospitality", "Something else"]
          ).map((option) => (
            <Link
              key={option}
              className="lena-glass lena-recommender-option"
              to="/world"
            >
              <span>{option}</span>
              <ChevronRight size={16} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Founder's promise section ─── */
function FounderPromise() {
  const { locale } = usePreferences();
  const isAr = locale === "ar";
  const [ref, isInView] = useInView();

  const points = isAr
    ? [
        { icon: <Shield size={22} />, text: "تتكلم مع الباني مباشرة — لا وسطاء ولا فريق مبيعات" },
        { icon: <Zap size={22} />, text: "كل نظام اتبنى من مشكلة حقيقية شفتها بعيني" },
        { icon: <Users size={22} />, text: "أفهم يومك الأول، وبعدين أبني اللي يختصره" },
      ]
    : [
        { icon: <Shield size={22} />, text: "Talk directly to the builder — no middlemen, no sales team" },
        { icon: <Zap size={22} />, text: "Every system was built from a real problem I lived myself" },
        { icon: <Users size={22} />, text: "I understand your day first, then build what shortens it" },
      ];

  return (
    <section
      ref={ref}
      className={`lena-section lena-founder-section scroll-animate ${isInView ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <p className="lena-kicker">{isAr ? "السلاح السري" : "The secret weapon"}</p>
        <h2 className="lena-section-title">
          {isAr
            ? "ليه LENA مختلفة عن أي حد تاني؟"
            : "Why LENA is unlike anyone else"}
        </h2>
        <div className="lena-founder-points scroll-stagger">
          {points.map((point) => (
            <article className="lena-glass lena-founder-point" key={point.text}>
              <span className="lena-founder-point-icon">{point.icon}</span>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
        <div className="lena-founder-quote">
          <p>
            {isAr
              ? '"محمد مسعود — خريج حاسبات ونظم معلومات. قبل ما أكتب أول سطر كود، كنت أدير مكتب تشغيل أصول عقارية. من هناك عرفت فين بيضيع الفلوس والوقت فعلاً."'
              : '"Mohamed Masoud — computers & MIS graduate. Before I wrote my first line of code, I managed a real-estate operations office. That\'s where I learned where money and time actually leak."'}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Timeline section ─── */
function BuildTimeline() {
  const { locale } = usePreferences();
  const isAr = locale === "ar";
  const [ref, isInView] = useInView();

  const milestones = isAr
    ? [
        { year: "2022", title: "البداية", desc: "مكتب تشغيل أصول عقارية — من هنا فهمت المشكلة الحقيقية" },
        { year: "2023", title: "أول سطر كود", desc: "بدأت أبني أنظمة تحل المشاكل اللي عشتها بنفسي" },
        { year: "2024", title: "Malek", desc: "أول نظام إدارة عقارات متكامل — شغال مع عملاء حقيقيين" },
        { year: "2025", title: "Lara Beauty + جودة", desc: "نظامين جديدين — سبا وضيافة. كل واحد من مشكلة حقيقية" },
        { year: "2026", title: "LENA World", desc: "عالم واحد يربط كل الأنظمة — ورؤية أكبر" },
      ]
    : [
        { year: "2022", title: "The start", desc: "A real-estate operations office — where I learned the real problem" },
        { year: "2023", title: "First line of code", desc: "Started building systems for the problems I lived myself" },
        { year: "2024", title: "Malek", desc: "First complete property management system — live with real clients" },
        { year: "2025", title: "Lara Beauty + Jouda", desc: "Two new systems — spa and hospitality. Each from a real problem" },
        { year: "2026", title: "LENA World", desc: "One world connecting every system — and a bigger vision" },
      ];

  return (
    <section
      ref={ref}
      className={`lena-section lena-timeline-section scroll-animate ${isInView ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <p className="lena-kicker">{isAr ? "الرحلة" : "The journey"}</p>
        <h2 className="lena-section-title">
          {isAr
            ? "من مكتب صغير لأنظمة بتغير قواعد اللعبة"
            : "From a small office to systems changing the game"}
        </h2>
        <div className="lena-timeline scroll-stagger">
          {milestones.map((milestone, i) => (
            <div className="lena-timeline-item" key={milestone.year}>
              <div className="lena-timeline-marker">
                <span className="lena-timeline-dot" />
                {i < milestones.length - 1 && <span className="lena-timeline-line" />}
              </div>
              <div className="lena-timeline-content">
                <span className="lena-timeline-year">{milestone.year}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials placeholder ─── */
function Testimonials() {
  const { locale } = usePreferences();
  const isAr = locale === "ar";
  const [ref, isInView] = useInView();

  const testimonials = isAr
    ? [
        {
          quote: "النظام وفّر علينا ساعات كتير كانت بتضيع في الشغل اليدوي والمتابعة.",
          author: "عميل Malek",
          role: "إدارة عقارات",
        },
        {
          quote: "أخيراً نظام فاهم شغلنا مش بنحاول يفهمنا شغله.",
          author: "عميل Lara Beauty",
          role: "مركز تجميل وسبا",
        },
      ]
    : [
        {
          quote: "The system saved us hours that were wasted on manual work and follow-ups.",
          author: "Malek client",
          role: "Property management",
        },
        {
          quote: "Finally a system that understands our work instead of forcing us into its workflow.",
          author: "Lara Beauty client",
          role: "Beauty & Spa center",
        },
      ];

  return (
    <section
      ref={ref}
      className={`lena-section lena-testimonials-section scroll-animate ${isInView ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <p className="lena-kicker">{isAr ? "آراء العملاء" : "Client voices"}</p>
        <h2 className="lena-section-title">
          {isAr
            ? "ناس حقيقية، نتائج حقيقية"
            : "Real people, real results"}
        </h2>
        <div className="lena-testimonials-grid scroll-stagger">
          {testimonials.map((t) => (
            <article className="lena-glass lena-testimonial-card" key={t.author}>
              <div className="lena-testimonial-quote">"</div>
              <p className="lena-testimonial-text">{t.quote}</p>
              <div className="lena-testimonial-author">
                <strong>{t.author}</strong>
                <span>{t.role}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="lena-testimonials-note">
          {isAr
            ? "شهادات حقيقية من عملاء حقيقيين. هنضيف المزيد قريباً."
            : "Real testimonials from real clients. More coming soon."}
        </p>
      </div>
    </section>
  );
}

/* ─── Main Home page ─── */
export default function Home() {
  const { locale } = usePreferences();
  const gateway = useGatewayToWorld();
  const seo = pageSeo("home", locale);
  const isAr = locale === "ar";

  const memory = useWorldMemory();
  const continuation = useMemo(
    () => resolveContinuation(memory, worldRegistry),
    [memory],
  );
  const rememberedSystemId = useMemo(
    () => resolveRememberedFocus(memory, worldRegistry),
    [memory],
  );
  const isReturning = memory !== null;

  const [countersRef, countersInView] = useInView({ threshold: 0.3 });
  const [systemsRef, systemsInView] = useInView();

  return (
    <PublicShell>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/"
        jsonLd={organizationJsonLd(locale)}
      />

      {/* ━━━ HERO ━━━ */}
      <section className="lena-hero lena-container">
        <div className="lena-hero-copy">
          <p className="lena-kicker">LENA DIGITAL HOUSE</p>

          {isReturning ? (
            <p className="lena-return-line">
              {isAr ? "مرحبًا بعودتك إلى العالم." : "Welcome back to the world."}
            </p>
          ) : null}

          <h1>
            {isAr ? (
              <>
                كل نظام بدأ من{" "}
                <span>مشكلة حقيقية</span>
                <br />
                مش من فكرة على ورقة
              </>
            ) : (
              <>
                Every system started from a{" "}
                <span>real problem</span>
                <br />
                not a concept on a page
              </>
            )}
          </h1>

          <p className="lena-lead">
            {isAr
              ? isReturning
                ? "العالم يتذكر مكانك. تابع رحلتك، أو ابدأ من جديد — القرار لك."
                : "أنظمة تشغيل حقيقية لست صناعات. اتبنت من أرض الواقع، مش من مكتب بعيد. تتكلم مع الباني مباشرة — لا وسطاء."
              : isReturning
                ? "The world remembers where you were. Continue your journey, or start again — the choice is yours."
                : "Real operating systems for six industries. Built from the ground, not from a distant office. You talk to the builder directly — no middlemen."}
          </p>

          <div className="lena-actions">
            <Link
              className="lena-primary"
              to="/world"
              onClick={(event) => {
                event.preventDefault();
                gateway();
              }}
            >
              {isAr ? "شوف الأنظمة" : "See the systems"}
              <ArrowUpRight size={16} />
            </Link>
            <Link className="lena-secondary" to="/portfolio">
              {isAr ? "شوف المشاريع" : "See the work"}
            </Link>
            {continuation ? (
              <WorldContinuation continuation={continuation} />
            ) : null}
          </div>

          <a className="lena-scroll" href="#counters">
            <ArrowDown size={15} />
            {isAr ? "اكتشف القصة كاملة" : "Discover the full story"}
          </a>
        </div>

        <DigitalHouseOrbit />
      </section>

      {/* ━━━ LIVE COUNTERS ━━━ */}
      <section
        ref={countersRef}
        id="counters"
        className={`lena-section lena-counters-section scroll-animate ${countersInView ? "is-visible" : ""}`}
      >
        <div className="lena-container">
          <div className="lena-counters-row">
            <LiveCounter value={3} label={isAr ? "أنظمة شغالة" : "Live systems"} />
            <LiveCounter value={6} label={isAr ? "صناعات" : "Industries"} />
            <LiveCounter value={1} label={isAr ? "شخص بيبني" : "Person building"} />
            <LiveCounter value={3} label={isAr ? "سنوات بناء" : "Years building"} suffix="+" />
          </div>
        </div>
      </section>

      {/* ━━━ SYSTEMS ━━━ */}
      <section
        ref={systemsRef}
        className={`lena-section scroll-animate ${systemsInView ? "is-visible" : ""}`}
        id="systems"
      >
        <div className="lena-container">
          <p className="lena-kicker">
            {isAr ? "الأنظمة الشغالة" : "Live operating systems"}
          </p>
          <h2 className="lena-section-title">
            {isAr
              ? "أنظمة مختلفة. جذور تشغيلية مشتركة. عالم واحد."
              : "Different systems. Shared operating roots. One world."}
          </h2>
          <p className="lena-section-lead">
            {isAr
              ? "كل نظام حل مشكلة حقيقية لصاحب بيزنس حقيقي. اختر نظام لترى التفاصيل."
              : "Each system solves a real problem for a real business owner. Pick one to see the details."}
          </p>
          <SystemGrid visitedSystemId={rememberedSystemId} />
        </div>
      </section>

      {/* ━━━ AI RECOMMENDER ━━━ */}
      <AiRecommender />

      {/* ━━━ FOUNDER PROMISE ━━━ */}
      <FounderPromise />

      {/* ━━━ TESTIMONIALS ━━━ */}
      <Testimonials />

      {/* ━━━ TIMELINE ━━━ */}
      <BuildTimeline />

      {/* ━━━ PROCESS ━━━ */}
      <ProcessSection />

      {/* ━━━ CTA ━━━ */}
      <LenaCta />
    </PublicShell>
  );
}
