import { useMemo, useState } from "react";
import { ArrowUpRight, MessageCircle, Search } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import { SITE_CONFIG } from "@/config/site";
import { HELP_TOPICS, faqJsonLd, searchArticles } from "@/content/help";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

const COPY = {
  ar: {
    eyebrow: "المساعدة",
    searchLabel: "ابحث في الأسئلة",
    searchPlaceholder: "اكتب كلمة مثل: الرد، الأسعار، بياناتي",
    noResults: "لا توجد إجابة مطابقة. راسلنا مباشرة وسنجيبك.",
    stillStuck: "لم تجد إجابتك؟",
    stillStuckBody: "راسلنا على واتساب وسنرد خلال يوم عمل واحد.",
    whatsapp: "المراسلة عبر واتساب",
    contact: "إرسال استفسار مكتوب",
    resultCount: (n: number) => `${n} إجابة`,
  },
  en: {
    eyebrow: "Help",
    searchLabel: "Search the questions",
    searchPlaceholder: "Try a word like: reply, pricing, my data",
    noResults: "No matching answer. Message us directly and we will answer.",
    stillStuck: "Did not find your answer?",
    stillStuckBody: "Message us on WhatsApp and we will reply within one business day.",
    whatsapp: "Message on WhatsApp",
    contact: "Send a written inquiry",
    resultCount: (n: number) => `${n} answers`,
  },
} as const;

export default function Help() {
  const { locale } = usePreferences();
  const text = COPY[locale];
  const seo = pageSeo("help", locale);
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchArticles(query, locale), [query, locale]);
  const visibleTopics = useMemo(
    () =>
      HELP_TOPICS.map((topic) => ({
        ...topic,
        articles: results.filter((article) => article.topic === topic.id),
      })).filter((topic) => topic.articles.length > 0),
    [results],
  );

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/help" jsonLd={faqJsonLd(locale)} />

      <section className="lena-page lena-container">
        <p className="lena-kicker">{text.eyebrow}</p>
        <h1 className="lena-page-title">{seo.title}</h1>
        <p className="lena-lead">{seo.description}</p>

        <div className="lena-help-search">
          <label htmlFor="help-search">
            <Search size={16} aria-hidden="true" />
            <span>{text.searchLabel}</span>
          </label>
          <input
            id="help-search"
            type="search"
            value={query}
            placeholder={text.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="lena-help-count" role="status" aria-live="polite">
            {text.resultCount(results.length)}
          </p>
        </div>
      </section>

      <section className="lena-section">
        <div className="lena-container lena-help-body">
          {visibleTopics.length === 0 ? (
            <p className="lena-help-empty">{text.noResults}</p>
          ) : (
            visibleTopics.map((topic) => (
              <section key={topic.id} className="lena-help-topic" aria-labelledby={`help-topic-${topic.id}`}>
                <h2 id={`help-topic-${topic.id}`} className="lena-help-topic-title">
                  {topic.label[locale]}
                </h2>
                <div className="lena-help-list">
                  {topic.articles.map((article) => (
                    <details className="lena-glass lena-help-item" key={article.id} id={article.id}>
                      <summary>{article.question[locale]}</summary>
                      <div className="lena-help-answer">
                        <p>{article.answer[locale]}</p>
                        {article.link && (
                          <Link className="lena-more" to={article.link.to}>
                            {article.link.label[locale]}
                            <ArrowUpRight size={15} />
                          </Link>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}

          <aside className="lena-glass lena-help-aside">
            <h2>{text.stillStuck}</h2>
            <p>{text.stillStuckBody}</p>
            <div className="lena-actions">
              <a className="lena-primary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} />
                {text.whatsapp}
              </a>
              <Link className="lena-secondary" to="/contact">
                {text.contact}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <LenaCta />
    </PublicShell>
  );
}
