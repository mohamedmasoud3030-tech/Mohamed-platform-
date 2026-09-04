import LenaLogo from "@/design-system/brand/LenaLogo";

export default function RouteFallback() {
  return (
    <div className="lena-route-fallback" role="status" aria-live="polite">
      <LenaLogo />
      <span className="lena-route-fallback-dots">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
