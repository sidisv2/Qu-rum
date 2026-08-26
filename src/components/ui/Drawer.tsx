import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "460px"
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: width,
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "var(--shadow-drawer)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.2s ease"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-border-default)",
              backgroundColor: "var(--color-bg-base)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem"
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
