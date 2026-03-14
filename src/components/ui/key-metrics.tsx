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
            borderBottom: "1px solid var(--line)",
            padding: "10px 0",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {metric.value}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
