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
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setError(res.error);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Error al autenticar con Google");
      setGoogleLoading(false);
    }
  };

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

        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border-default, #e5e7eb)",
                backgroundColor: "#ffffff",
                color: "var(--color-text-primary, #1e293b)",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.625rem",
                cursor: loading || googleLoading ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                transition: "background-color 0.15s ease",
                marginBottom: "1rem"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? "Conectando con Google..." : mode === "login" ? "Continuar con Google" : "Registrarse con Google"}</span>
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "0 0 1rem 0",
                gap: "0.75rem"
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-default, #e5e7eb)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94a3b8)", fontWeight: 500 }}>
                o continuar con email
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-default, #e5e7eb)" }} />
            </div>
          </>
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
