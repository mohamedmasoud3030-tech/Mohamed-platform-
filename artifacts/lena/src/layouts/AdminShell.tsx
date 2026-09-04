import type { ReactNode } from "react";
import { FolderKanban, Languages, LayoutDashboard, Moon, Sun } from "lucide-react";
import { Link } from "react-router";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { usePreferences } from "@/providers/preferences";
import AmbientBackdrop from "./AmbientBackdrop";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences();
  return <div className="lena-admin"><AmbientBackdrop /><a className="skip-link" href="#admin-content">{locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a><header className="lena-admin-header"><Link to="/" className="lena-brand-link"><LenaLogo /></Link><div className="lena-nav-actions"><Link className="lena-icon-button" to="/dashboard" aria-label={locale === "ar" ? "لوحة التحكم" : "Dashboard"}><LayoutDashboard size={17} /></Link><Link className="lena-icon-button" to="/dashboard/projects-editor" aria-label={locale === "ar" ? "محرر المشاريع" : "Projects editor"}><FolderKanban size={17} /></Link><button type="button" className="lena-icon-button" onClick={toggleLocale} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}><Languages size={17} /></button><button type="button" className="lena-icon-button" onClick={toggleTheme} aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></div></header><main id="admin-content" className="lena-admin-main">{children}</main></div>;
}
