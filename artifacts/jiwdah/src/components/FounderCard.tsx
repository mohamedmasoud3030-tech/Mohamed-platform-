import { useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG } from "@/config/site";
import { FOUNDER, hasFounderBio } from "@/content/founder";
import { usePreferences } from "@/providers/preferences";

/**
 * The founder card.
 *
 * Renders correctly in three states: with a photograph, without one (a brand
 * monogram), and with a photograph that fails to load. The biography block is
 * absent rather than empty until real text exists.
 */
export default function FounderCard() {
  const { locale } = usePreferences();
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(FOUNDER.photo) && !photoFailed;

  return (
    <article className="lena-glass lena-founder">
      <div className="lena-founder-portrait">
        {showPhoto ? (
          <img
            src={FOUNDER.photo}
            alt={FOUNDER.photoAlt[locale]}
            width={220}
            height={220}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <span className="lena-founder-monogram" aria-hidden="true">
            {FOUNDER.initials}
          </span>
        )}
      </div>

      <div className="lena-founder-body">
        <p className="lena-kicker">{locale === "ar" ? "من يقف خلف LENA" : "The person behind LENA"}</p>
        <h2>{FOUNDER.name[locale]}</h2>
        <p className="lena-founder-role">{FOUNDER.role[locale]}</p>

        {hasFounderBio(locale) && <p className="lena-founder-bio">{FOUNDER.bio[locale]}</p>}

        <p className="lena-founder-note">
          {locale === "ar"
            ? "تتحدث مباشرة مع من يبني المشروع — لا وسيط ولا فريق مبيعات."
            : "You talk directly to the person who builds the work — no intermediary, no sales team."}
        </p>

        <div className="lena-actions">
          <Link className="lena-primary" to="/contact">
            {locale === "ar" ? "ابدأ محادثة" : "Start a conversation"}
            <ArrowUpRight size={16} />
          </Link>
          <a className="lena-secondary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={15} />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
