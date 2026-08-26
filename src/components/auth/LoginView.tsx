import React, { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface LoginViewProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword
}) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await signIn(email.trim(), password);
    if (res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.25rem", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 800, fontSize: "0.875rem" }}>
              D
            </div>
            <span style={{ fontSize: "1.375rem", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--color-primary)" }}>
              DIREX
            </span>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Iniciar Sesión
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Director Administrativo e Inteligencia para tu PyME
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "0.8125rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{errorMessage}</span>
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

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                style={{ background: "none", border: "none", color: "var(--color-accent)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 2.5rem 0.65rem 2.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "0.75rem", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !email.trim() || !password.trim()}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
            icon={<ArrowRight size={16} />}
          >
            {isLoading ? "Ingresando..." : "Ingresar a Direx"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            ¿No tenés una cuenta?{" "}
            <button
              onClick={onNavigateToRegister}
              style={{ background: "none", border: "none", color: "var(--color-accent)", fontWeight: 700, cursor: "pointer", fontSize: "0.8125rem" }}
            >
              Crear cuenta
            </button>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "1.25rem", color: "var(--color-text-muted)", fontSize: "0.6875rem" }}>
          <ShieldCheck size={14} style={{ color: "var(--color-success)" }} />
          <span>Acceso seguro protegido por Row Level Security (RLS)</span>
        </div>
      </div>
    </div>
  );
};
