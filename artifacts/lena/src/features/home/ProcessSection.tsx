import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/providers/preferences";

const STEPS = [
  { ar: "نفهم سير العمل الحقيقي", en: "Understand the real workflow" },
  { ar: "نحدد الكيانات والقواعد ونقاط التعطل", en: "Map entities, rules, and friction" },
  { ar: "نبني نظام التشغيل حول العمل اليومي", en: "Build the operating system around daily work" },
  { ar: "نثبت الاستخدام ثم نستخرج ما يتكرر", en: "Prove usage, then extract what repeats" },
];

export default function ProcessSection() {
  const { locale } = usePreferences();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`lena-section scroll-animate ${isVisible ? "is-visible" : ""}`}
    >
      <div className="lena-container">
        <p className="lena-kicker">
          {locale === "ar" ? "من العمل الحقيقي إلى النظام" : "From real work to operating system"}
        </p>
        <h2 className="lena-section-title">
          {locale === "ar"
            ? "لا نبدأ بالشكل. نبدأ بكيف يعمل العمل فعلًا."
            : "We do not start with the surface. We start with how the work actually runs."}
        </h2>
        <div className="lena-process scroll-stagger">
          {STEPS.map((step, index) => (
            <article className="lena-glass" key={step.en}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <h3>{step[locale]}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
