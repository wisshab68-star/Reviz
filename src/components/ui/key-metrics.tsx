import type { KeyMetric } from "@/types/sheet";

interface KeyMetricsProps {
  metrics: KeyMetric[];
}

export function KeyMetrics({ metrics }: KeyMetricsProps) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))`,
        gap: 10,
        marginTop: 16,
      }}
    >
      {metrics.map((metric) => (
        <div
          key={`${metric.label}-${metric.value}`}
          style={{
            border: "3px solid #050505",
            borderRadius: 24,
            padding: "12px 14px",
            background: "var(--accent-soft)",
            boxShadow: "8px 8px 0 #050505",
          }}
        >
          <div
            style={{
              fontFamily: "var(--display-font)",
              fontSize: 28,
              fontWeight: 800,
              color: "#050505",
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
            }}
          >
            {metric.value}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--blue-deep)",
              marginTop: 6,
              lineHeight: 1.45,
            }}
          >
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
