import type { CSSProperties } from "react";

export type InnerConstellationProps = {
  systemName: string;
  operations: string[];
  ariaLabel: string;
};

/**
 * Inner Constellation — a factual spatial map of what one system actually runs.
 *
 * The center is the selected product identity. Every surrounding node comes
 * directly from the canonical `BusinessSystem.does` list; no inferred workflow,
 * ordering or synthetic capability is introduced. Geometry is deterministic and
 * static after the short Chamber arrival, so the page remains calm while still
 * revealing that each LENA system has an internal operating structure.
 */
export default function InnerConstellation({
  systemName,
  operations,
  ariaLabel,
}: InnerConstellationProps) {
  const count = Math.max(operations.length, 1);

  return (
    <section className="lena-inner-constellation" aria-label={ariaLabel}>
      <div className="lena-inner-field" aria-hidden="true">
        <i className="lena-inner-ring inner-ring-a" />
        <i className="lena-inner-ring inner-ring-b" />
        <i className="lena-inner-ring inner-ring-c" />
        <i className="lena-inner-origin" />
      </div>

      <div className="lena-inner-core" aria-hidden="true">
        <span className="lena-inner-core-marks" />
        <span className="lena-inner-core-light" />
      </div>
      <strong className="lena-inner-core-label">{systemName}</strong>

      {operations.map((operation, index) => {
        const angle = -90 + (360 / count) * index;
        const radians = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(radians) * 38;
        const y = 50 + Math.sin(radians) * 38;
        return (
          <span className="lena-inner-operation" key={operation}>
            <i
              className="lena-inner-link"
              aria-hidden="true"
              style={
                {
                  "--inner-angle": `${angle.toFixed(2)}deg`,
                  "--inner-i": `${index * 0.06}s`,
                } as CSSProperties
              }
            />
            <span
              className="lena-inner-node"
              style={
                {
                  left: `${x.toFixed(2)}%`,
                  top: `${y.toFixed(2)}%`,
                  "--inner-i": `${index * 0.06}s`,
                } as CSSProperties
              }
            >
              <i aria-hidden="true" />
              <span>{operation}</span>
            </span>
          </span>
        );
      })}
    </section>
  );
}
