import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LenaLogo from "@/design-system/brand/LenaLogo";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { usePreferences } from "@/providers/preferences";
export default function Login() { const { locale } = usePreferences(); const seo = pageSeo("login", locale); return <div className="lena-login min-h-screen flex items-center justify-center bg-surface" dir="rtl"><SeoHead title={seo.title} description={seo.description} path="/login" noindex /><Card className="w-full max-w-sm border-gold/20 bg-surface-light"><CardHeader className="text-center"><div className="flex justify-center mb-4"><LenaLogo /></div><CardTitle className="text-cream text-xl">مرحباً بك</CardTitle><CardDescription className="text-cream-muted text-sm">سجّل دخولك للوصول إلى لوحة تحكم LENA</CardDescription></CardHeader><CardContent><Button className="w-full btn-gold" size="lg" onClick={() => { window.location.href = "/api/oauth/login"; }}>تسجيل الدخول</Button></CardContent></Card></div>; }
