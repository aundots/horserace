import { useT } from "../i18n/LangContext";
import { getTipGradeMeta, resolveTipGrade } from "../lib/tipGrade";
import type { STRINGS } from "../i18n/strings";

type TipGradeBadgeProps = {
  grade: string;
  compact?: boolean;
};

function gradeLabel(t: (typeof STRINGS)["ko"], grade: string): string {
  const resolved = resolveTipGrade(grade);
  if (resolved === "SURE") return t.gradeSure;
  if (resolved === "LIKELY") return t.gradeLikely;
  if (resolved === "TRAP") return t.gradeTrap;
  return t.gradeRumor;
}

export function TipGradeBadge({ grade, compact = false }: TipGradeBadgeProps) {
  const t = useT();
  const meta = getTipGradeMeta(grade);

  return (
    <span
      title={meta.hint}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 3 : 4,
        padding: compact ? "2px 6px" : "3px 8px",
        borderRadius: 6,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        lineHeight: 1.2,
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          fontSize: compact ? 10 : 11,
          letterSpacing: meta.arrows.length > 1 ? "-0.12em" : 0,
        }}
        aria-hidden
      >
        {meta.arrows}
      </span>
      <span>{gradeLabel(t, grade)}</span>
    </span>
  );
}

export function TipGradeLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 10,
      }}
    >
      {(["SURE", "LIKELY", "RUMOR", "TRAP"] as const).map((g) => (
        <TipGradeBadge key={g} grade={g} compact />
      ))}
    </div>
  );
}
