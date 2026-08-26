import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  statusColor?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  statusColor = "primary",
  icon,
  actionText,
  onAction
}) => {
  const borderLeftColors = {
    primary: "var(--color-primary)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    info: "var(--color-info)"
  };

  return (
    <div
      className="card"
      style={{
        borderLeft: "4px solid " + borderLeftColors[statusColor],
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        minHeight: "130px"
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {title}
          </span>
          {icon && <div style={{ color: "var(--color-text-muted)" }}>{icon}</div>}
        </div>

        <div style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.25rem" }} className="tabular-nums">
          {value}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
          {trend && (
            <span style={{ fontWeight: 600, color: trend.isPositive ? "var(--color-success-text)" : "var(--color-danger-text)", marginRight: "0.5rem" }}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle}
        </div>

        {actionText && onAction && (
          <button
            onClick={onAction}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0
            }}
          >
            {actionText} →
          </button>
        )}
      </div>
    </div>
  );
};
