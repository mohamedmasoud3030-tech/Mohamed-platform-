type LenaLogoProps = { compact?: boolean; className?: string };

export default function LenaLogo({ compact = false, className = "" }: LenaLogoProps) {
  return (
    <span className={`lena-logo ${compact ? "lena-logo-compact" : ""} ${className}`.trim()} aria-label="LENA Digital House">
      <svg className="lena-logo-mark" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <path d="M14 10.5v20.2c0 3.75 3.04 6.8 6.8 6.8H36" />
        <path d="M14 17.5c7.15 0 12.95 5.8 12.95 12.95" />
        <circle cx="14" cy="10.5" r="2.5" />
      </svg>
      {!compact && (
        <span className="lena-logo-copy">
          <strong>LENA</strong>
          <small>DIGITAL HOUSE</small>
        </span>
      )}
    </span>
  );
}
