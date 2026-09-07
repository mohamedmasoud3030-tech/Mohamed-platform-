import { useEffect, useState } from "react";
import { Languages, Menu, Moon, Sun, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { PUBLIC_NAVIGATION } from "@/content/navigation";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { track } from "@/lib/analytics";
import { usePreferences } from "@/providers/preferences";

export default function FloatingHeader() {
  const copy = useSiteCopy();
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [pathname]);

  // Track scroll for header style
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

  const active = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);
  const startLabel = copy.nav.start;

  return (
    <header className={`lena-header${scrolled ? " lena-header-scrolled" : ""}`}>
      <nav
        className="lena-glass lena-nav"
        aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
      >
        <Link to="/" className="lena-brand-link">
          <LenaLogo />
        </Link>

        <div className="lena-desktop-nav">
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              key={item.to}
              className={`lena-nav-link${active(item.to) ? " active" : ""}`}
              to={item.to}
            >
              {copy.nav[item.copyKey]}
            </Link>
          ))}
        </div>

        <div className="lena-nav-actions">
          <button
            type="button"
            className="lena-icon-button"
            onClick={() => {
              track("language_switched", { locale, surface: "header" });
              toggleLocale();
            }}
            aria-label={
              locale === "ar" ? "Switch to English" : "التبديل إلى العربية"
            }
          >
            <Languages size={17} />
          </button>

          <button
            type="button"
            className="lena-icon-button"
            onClick={toggleTheme}
            aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            className="lena-primary lena-nav-cta"
            onClick={() =>
              track("primary_action_clicked", { surface: "header", locale })
            }
            to="/contact"
          >
            {startLabel}
          </Link>

          <button
            type="button"
            className="lena-icon-button lena-menu-toggle"
            aria-expanded={open}
            aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lena-glass lena-mobile-menu">
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              key={item.to}
              className={`lena-mobile-link${active(item.to) ? " active" : ""}`}
              to={item.to}
            >
              {copy.nav[item.copyKey]}
            </Link>
          ))}

          <Link
            className="lena-primary lena-mobile-cta"
            onClick={() =>
              track("primary_action_clicked", {
                surface: "mobile_menu",
                locale,
              })
            }
            to="/contact"
          >
            {startLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
