import { useId } from "react";

type LenaLogoProps = {
  compact?: boolean;
  className?: string;
  /** "mark" evolves the original L glyph; "house" is the connected-systems house. */
  variant?: "mark" | "house";
};

/**
 * The LENA platform logo.
 *
 * The glyph is drawn on the same 512 grid as the master files in
 * `public/brand/`, so the component and the exported assets stay identical.
 */
export default function LenaLogo({ compact = false, className = "", variant = "mark" }: LenaLogoProps) {
  const uid = useId().replace(/:/g, "");
  const tile = `${uid}tile`;
  const glow = `${uid}glow`;
  const stroke = `${uid}stroke`;

  return (
    <span
      className={`lena-logo ${compact ? "lena-logo-compact" : ""} ${className}`.trim()}
      aria-label="LENA Digital House"
    >
      <svg className="lena-logo-mark" viewBox="0 0 512 512" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={tile} x1="64" y1="32" x2="448" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#101E45" />
            <stop offset="1" stopColor="#04081A" />
          </linearGradient>
          <radialGradient id={glow} cx="30%" cy="16%" r="82%">
            <stop stopColor="#7FA0FF" stopOpacity=".22" />
            <stop offset="1" stopColor="#7FA0FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={stroke} x1="140" y1="96" x2="360" y2="372" gradientUnits="userSpaceOnUse">
            <stop stopColor="#72A5FF" />
            <stop offset=".48" stopColor="#9D7CFF" />
            <stop offset="1" stopColor="#FF83C3" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill={`url(#${tile})`} />
        <rect width="512" height="512" rx="120" fill={`url(#${glow})`} />
        <rect
          x="16"
          y="16"
          width="480"
          height="480"
          rx="106"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity=".07"
          strokeWidth="2"
        />
        {variant === "house" ? (
          <>
            <path
              d="M256 116 128 236v140h256V236Z"
              fill="none"
              stroke={`url(#${stroke})`}
              strokeWidth="26"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx="256" cy="300" r="54" fill="none" stroke="#51E1FF" strokeOpacity=".38" strokeWidth="6" />
            <circle cx="256" cy="300" r="34" fill={`url(#${stroke})`} />
            <g fill={`url(#${stroke})`}>
              <circle cx="256" cy="116" r="22" />
              <circle cx="128" cy="236" r="22" />
              <circle cx="384" cy="236" r="22" />
              <circle cx="128" cy="376" r="22" />
              <circle cx="384" cy="376" r="22" />
            </g>
          </>
        ) : (
          <>
            <g
              fill="none"
              stroke={`url(#${stroke})`}
              strokeWidth="44"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M156 112V292c0 22 18 40 40 40h120" />
              <path d="M156 190c54 0 98 44 98 98" />
            </g>
            <circle cx="156" cy="112" r="30" fill={`url(#${stroke})`} />
            <circle cx="225" cy="219" r="15" fill="#51E1FF" />
            <circle cx="254" cy="288" r="24" fill={`url(#${stroke})`} />
          </>
        )}
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
