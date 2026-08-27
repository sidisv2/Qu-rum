import React, { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2 } from "lucide-react";
import { useOrg } from "../../context/OrgContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface FeedbackWidgetProps {
  currentView: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "sugerencia" | "otro">("sugerencia");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { currentOrg } = useOrg();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const feedbackPayload = {
        organizationId: currentOrg?.id || "org-unknown",
        userId: user?.id || "anonymous",
        feedbackType,
        currentView,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };

      const existingFeedback = JSON.parse(localStorage.getItem("direx_beta_feedback") || "[]");
      existingFeedback.push(feedbackPayload);
      localStorage.setItem("direx_beta_feedback", JSON.stringify(existingFeedback));

      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setIsOpen(false);
        setMessage("");
      }, 2000);
    } catch (_err) {
      // Fallback seguro
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999 }}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--color-primary, #4f46e5)",
              color: "#ffffff",
              padding: "0.65rem 1rem",
              borderRadius: "9999px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8125rem",
              transition: "transform 0.2s ease"
            }}
          >
            <MessageSquarePlus size={16} />
            <span>Sugerencia / Bug</span>
          </button>
        )}

        {isOpen && (
          <div
            className="card"
            style={{
              width: "320px",
              padding: "1.25rem",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                Feedback de Beta
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {isSent ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--color-success-text, #16a34a)" }}>
                <CheckCircle2 size={32} style={{ margin: "0 auto 0.5rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>¡Muchas gracias!</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Tu comentario ayuda a mejorar Direx.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {(["sugerencia", "bug", "otro"] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFeedbackType(t)}
                      style={{
                        flex: 1,
                        padding: "0.35rem",
                        fontSize: "0.7rem",
                        borderRadius: "0.375rem",
                        border: "1px solid",
                        borderColor: feedbackType === t ? "var(--color-primary, #4f46e5)" : "#e5e7eb",
                        backgroundColor: feedbackType === t ? "#eef2ff" : "#f9fafb",
                        color: feedbackType === t ? "var(--color-primary, #4f46e5)" : "#4b5563",
                        fontWeight: feedbackType === t ? 700 : 500,
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={3}
                  placeholder={feedbackType === "bug" ? "¿Qué problema encontraste?" : "¿Cómo podemos mejorar esta sección?"}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.8125rem",
                    resize: "none"
                  }}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !message.trim()}
                  icon={<Send size={14} />}
                  style={{ width: "100%", padding: "0.5rem" }}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Comentario"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
};
