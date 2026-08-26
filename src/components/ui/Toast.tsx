import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
          maxWidth: "380px"
        }}
      >
        {toasts.map(toast => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          return (
            <div
              key={toast.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                backgroundColor: isSuccess ? "#0f172a" : isError ? "var(--color-danger-bg)" : "var(--color-info-bg)",
                color: isSuccess ? "#ffffff" : isError ? "var(--color-danger-text)" : "var(--color-info-text)",
                border: isSuccess ? "none" : isError ? "1px solid var(--color-danger-border)" : "1px solid var(--color-info-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                fontSize: "0.875rem",
                fontWeight: 500,
                animation: "slideIn 0.2s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {isSuccess ? (
                  <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
                ) : isError ? (
                  <AlertCircle size={16} />
                ) : (
                  <Info size={16} />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  opacity: 0.7,
                  cursor: "pointer",
                  padding: "0.2rem",
                  display: "flex"
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
