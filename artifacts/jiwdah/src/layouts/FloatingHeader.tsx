import { useEffect, useState } from "react";
import { Languages, Menu, Moon, Sun, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { PUBLIC_NAVIGATION } from "@/content/navigation";
import { usePreferences } from "@/providers/preferences";

export default function FloatingHeader() {
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let isScrolled = window.scrollY > 20;
    setScrolled(isScrolled);
    const update = () => {
      const nextScrolled = window.scrollY > 20;
      if (nextScrolled === isScrolled) return;
      isScrolled = nextScrolled;
      setScrolled(nextScrolled);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const active = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <header className={`lena-header${scrolled ? " lena-header-scrolled" : ""}`}>
      <nav className="lena-glass lena-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
        <Link to="/" className="lena-brand-link"><LenaLogo /></Link>
        <div className="lena-desktop-nav">
          {PUBLIC_NAVIGATION.map((item) => <Link key={item.to} className={`lena-nav-link${active(item.to) ? " active" : ""}`} to={item.to}>{locale === "ar" ? item.ar : item.en}</Link>)}
        </div>
        <div className="lena-nav-actions">
          <button type="button" className="lena-icon-button" onClick={toggleLocale} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}><Languages size={17} /></button>
          <button type="button" className="lena-icon-button" onClick={toggleTheme} aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <Link className="lena-primary lena-nav-cta" to="/contact">{locale === "ar" ? "لنتحدث" : "Let's talk"}</Link>
          <button type="button" className="lena-icon-button lena-menu-toggle" aria-expanded={open} aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </nav>
      {open && <div className="lena-glass lena-mobile-menu">{PUBLIC_NAVIGATION.map((item) => <Link key={item.to} className={`lena-mobile-link${active(item.to) ? " active" : ""}`} to={item.to}>{locale === "ar" ? item.ar : item.en}</Link>)}<Link className="lena-primary lena-mobile-cta" to="/contact">{locale === "ar" ? "لنتحدث" : "Let's talk"}</Link></div>}
    </header>
  );
}
