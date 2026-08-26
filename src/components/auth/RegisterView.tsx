import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface RegisterViewProps {
  onNavigateToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessConfirmation, setIsSuccessConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await signUp(email.trim(), password, fullName.trim());
    if (res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    } else if (res.requiresEmailConfirmation) {
      setIsSuccessConfirmation(true);
      setIsLoading(false);
    }
  };

  if (isSuccessConfirmation) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <CheckCircle2 size={48} style={{ color: "var(--color-success)", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            ¡Cuenta creada exitosamente!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Te enviamos un correo de confirmación a <strong>{email}</strong>. Por favor verificá tu bandeja de entrada para activar tu cuenta.
          </p>
          <Button
            variant="primary"
            onClick={onNavigateToLogin}
            style={{ width: "100%", marginTop: "1.5rem" }}
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1.5rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2.25rem", boxShadow: "var(--shadow-lg)" }}>
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
            Crear tu Cuenta
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Empezá a gestionar tu empresa con inteligencia y control
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
              Nombre y Apellido
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <User size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                required
                placeholder="Valentín Morales"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem 0.65rem 2.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              />
            </div>
          </div>

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
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
              Contraseña
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Mínimo 6 caracteres"
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

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.35rem" }}>
              Confirmar Contraseña
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Repetí tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem 0.65rem 2.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !fullName.trim() || !email.trim() || !password.trim()}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }}
            icon={<ArrowRight size={16} />}
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            ¿Ya tenés una cuenta?{" "}
            <button
              onClick={onNavigateToLogin}
              style={{ background: "none", border: "none", color: "var(--color-accent)", fontWeight: 700, cursor: "pointer", fontSize: "0.8125rem" }}
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
