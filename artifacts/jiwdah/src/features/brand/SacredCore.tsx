import { withBase } from "@/lib/base-path";

export type SacredCoreProps = {
  mode: "orbit" | "world";
  /** Changing focusKey restarts the small acknowledgement flare in LENA World. */
  focusKey?: string | null;
};

/**
 * LENA Sacred Core
 *
 * The artwork is intentionally static. The living behavior is layered above it:
 * a rare blink, restrained pupil breath, acknowledgement flare on World focus,
 * and a stronger awakening during the homepage → World gateway transition.
 * This keeps the source artwork pristine while the runtime owns motion and
 * accessibility preferences.
 */
export default function SacredCore({ mode, focusKey = null }: SacredCoreProps) {
  return (
    <div
      className={`lena-sacred-core lena-sacred-core--${mode}${focusKey ? " is-reactive" : ""}`}
      data-focus={focusKey ?? undefined}
      aria-hidden="true"
    >
      <img
        className="lena-sacred-core-art"
        src={withBase("/lena-sacred-core.webp")}
        alt=""
        draggable={false}
      />

      <span className="lena-sacred-core-aura" />

      <span className="lena-sacred-eye">
        <span className="lena-sacred-eye-glow" />
        <span key={focusKey ?? "idle"} className="lena-sacred-eye-response" />
        <span className="lena-sacred-eye-lid lena-sacred-eye-lid--top" />
        <span className="lena-sacred-eye-lid lena-sacred-eye-lid--bottom" />
      </span>
    </div>
  );
}
