import { CheckCircle2 } from "lucide-react";
import FounderCard from "@/components/FounderCard";
import LenaCta from "@/components/LenaCta";
import ProcessSection from "@/features/home/ProcessSection";
import PublicShell from "@/layouts/PublicShell";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";

export default function About() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const seo = pageSeo("about", locale);

  return (
    <PublicShell>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/about"
      />

      {/* Hero */}
      <section className="lena-page lena-container">
        <p className="lena-kicker">{copy.about.eyebrow}</p>
        <h1 className="lena-page-title">{copy.about.title}</h1>
        <p className="lena-lead">{copy.about.intro}</p>
      </section>

      {/* Founder */}
      <section className="lena-section">
        <div className="lena-container">
          <FounderCard />
        </div>
      </section>

      {/* Approach */}
      <section className="lena-section">
        <div className="lena-container lena-bento">
          {copy.about.approach.map((item, index) => (
            <article
              className={`lena-glass lena-principle${index === 0 ? " wide" : ""}`}
              key={item}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <CheckCircle2 size={18} />
              <h2>{item}</h2>
            </article>
          ))}
        </div>
      </section>

      <ProcessSection />
      <LenaCta />
    </PublicShell>
  );
}
