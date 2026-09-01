import { withBase } from "@/lib/base-path";

export type SacredCoreReaction = "idle" | "live" | "beta" | "forming";

export type SacredCoreProps = {
  surface?: "orbit" | "world";
  reaction?: SacredCoreReaction;
  className?: string;
};

/**
 * The shared LENA Sacred Core.
 *
 * One identity anchor is used by both the homepage Orbit and LENA World. The
 * illustration remains static and brand-authored; life is added by restrained
 * runtime layers around the eye (rare blink, core pulse, awakening flare).
 * This keeps the source art reusable while motion remains accessible and
 * controllable by prefers-reduced-motion.
 */
export default function SacredCore({
  surface = "world",
  reaction = "idle",
  className = "",
}: SacredCoreProps) {
  const classes = [
    "lena-sacred-core",
    `is-${surface}`,
    `reaction-${reaction}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <span className="lena-sacred-aura" />
      <img
        className="lena-sacred-art"
        src={withBase("/lena-sacred-core.webp")}
        alt=""
        draggable={false}
      />

      <span className="lena-sacred-eye">
        <span className="lena-sacred-iris" />
        <span className="lena-sacred-flare" />
        <span className="lena-sacred-lid lena-sacred-lid-upper" />
        <span className="lena-sacred-lid lena-sacred-lid-lower" />
      </span>

      <span className="lena-sacred-energy lena-sacred-energy-a" />
      <span className="lena-sacred-energy lena-sacred-energy-b" />
    </span>
  );
}
