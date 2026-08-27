import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login"
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { signIn, signUp, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else if (mode === "register") {
        if (!fullName.trim()) {
          setError("Ingresá tu nombre completo");
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.requiresEmailConfirmation) {
          setSuccessMsg("¡Cuenta creada! Te enviamos un correo de confirmación. Revisá tu bandeja de entrada.");
        } else {
          onClose();
        }
      } else if (mode === "forgot") {
        const res = await resetPassword(email);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMsg("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2rem",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)"
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "var(--color-primary-light, #eef2ff)",
              color: "var(--color-primary, #4f46e5)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem"
            }}
          >
            <Sparkles size={22} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {mode === "login"
              ? "Iniciar Sesión en Direx"
              : mode === "register"
              ? "Crear Cuenta en Direx"
              : "Recuperar Contraseña"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {mode === "login"
              ? "Accedé a tu director administrativo y financiero"
              : mode === "register"
              ? "Comenzá tu prueba gratuita para tu PyME"
              : "Ingresá tu correo para recibir las instrucciones"}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem"
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem"
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {mode === "register" && (
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
                Nombre y Apellido
              </label>
              <div style={{ position: "relative" }}>
                <UserIcon size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem 0.6rem 2.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-border-default, #e5e7eb)",
                    fontSize: "0.875rem"
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
              Correo electrónico
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="email"
                required
                placeholder="tu@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem 0.6rem 2.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-border-default, #e5e7eb)",
                  fontSize: "0.875rem"
                }}
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  Contraseña
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    style={{ background: "none", border: "none", fontSize: "0.75rem", color: "var(--color-primary, #4f46e5)", cursor: "pointer", fontWeight: 600 }}
                  >
                    ¿Olvidaste tu clave?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem 0.6rem 2.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-border-default, #e5e7eb)",
                    fontSize: "0.875rem"
                  }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            icon={<ArrowRight size={16} />}
            style={{ width: "100%", padding: "0.7rem", marginTop: "0.5rem" }}
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Ingresar"
              : mode === "register"
              ? "Crear Cuenta"
              : "Enviar Enlace"}
          </Button>
        </form>

        {/* Footer Alternador */}
        <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          {mode === "login" ? (
            <span>
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); setSuccessMsg(null); }}
                style={{ background: "none", border: "none", color: "var(--color-primary, #4f46e5)", fontWeight: 700, cursor: "pointer" }}
              >
                Registrate acá
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tenés cuenta?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
                style={{ background: "none", border: "none", color: "var(--color-primary, #4f46e5)", fontWeight: 700, cursor: "pointer" }}
              >
                Iniciá sesión acá
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
