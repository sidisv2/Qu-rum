import React, { useState } from "react";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface ForgotPasswordViewProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigateToLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await resetPassword(email.trim());
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setIsSuccess(true);
    }
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <CheckCircle2 size={48} style={{ color: "var(--color-success)", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Enlace de recuperación enviado
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Si el correo <strong>{email}</strong> está registrado, recibirás un enlace seguro para restablecer tu contraseña.
          </p>
          <Button
            variant="primary"
            onClick={onNavigateToLogin}
            style={{ width: "100%", marginTop: "1.5rem" }}
          >
            Volver a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.25rem", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={onNavigateToLogin}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", cursor: "pointer", marginBottom: "1rem" }}
          >
            <ArrowLeft size={14} />
            <span>Volver</span>
          </button>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Recuperar Contraseña
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Ingresá tu correo para recibir las instrucciones de restablecimiento.
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
              Correo electrónico
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
              <input
                type="email"
                required
                placeholder="tu@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem 0.65rem 2.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !email.trim()}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
            icon={<ArrowRight size={16} />}
          >
            {isLoading ? "Enviando..." : "Enviar Enlace"}
          </Button>
        </form>
      </div>
    </div>
  );
};
