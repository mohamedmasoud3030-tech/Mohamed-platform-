import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG, whatsappUrlFor } from "@/config/site";
import { PUBLIC_NAVIGATION } from "@/content/navigation";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
import { worldMemory } from "@/lib/spatial";

export default function PublicFooter() {
  const { locale } = usePreferences();
  const copy = useSiteCopy();
  const [justReset, setJustReset] = useState(false);

  // The spatial-memory reset seam: deliberately small and quiet. It exists
  // for user control, tests and demos — one tap erases what the world
  // remembers, nothing more.
  const resetSpatialMemory = () => {
    worldMemory.reset();
    setJustReset(true);
    window.setTimeout(() => setJustReset(false), 2400);
  };

  return (
    <footer className="lena-footer">
      <div className="lena-footer-grid">
        <div><Link to="/" className="lena-brand-link"><LenaLogo /></Link><p>{copy.footer.description}</p></div>
        <div><h2>{copy.footer.links}</h2><div className="lena-footer-links">{PUBLIC_NAVIGATION.map((item) => <Link key={item.to} to={item.to}>{locale === "ar" ? item.ar : item.en}</Link>)}<Link to="/help">{locale === "ar" ? "المساعدة" : "Help"}</Link><Link to="/privacy">{locale === "ar" ? "بياناتك وخصوصيتك" : "Your data and privacy"}</Link></div></div>
        <div><h2>{copy.footer.contact}</h2><div className="lena-footer-links">{SITE_CONFIG.channels.map((channel) => <a key={channel.id} href={whatsappUrlFor(channel)} target="_blank" rel="noreferrer"><MessageCircle size={15} /><span dir="ltr">{channel.display}</span><small>{channel.region[locale]}</small></a>)}<a href={SITE_CONFIG.emailUrl}><Mail size={15} /><span dir="ltr">{SITE_CONFIG.email}</span></a></div></div>
      </div>
      <div className="lena-footer-base">
        <small>© {new Date().getFullYear()} LENA Digital House — {SITE_CONFIG.servesLabel[locale]}</small>
        <button
          type="button"
          className="lena-memory-reset"
          onClick={resetSpatialMemory}
          title={
            locale === "ar"
              ? "امسح ما تذكّره LENA عن رحلتك المكانية (اختياري)"
              : "Erase what LENA remembers about your spatial journey (optional)"
          }
        >
          {justReset
            ? locale === "ar"
              ? "تمت إعادة الضبط"
              : "Spatial memory reset"
            : locale === "ar"
              ? "إعادة ضبط الذاكرة المكانية"
              : "Reset spatial memory"}
        </button>
      </div>
    </footer>
  );
}
