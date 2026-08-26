import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LoginView } from "./LoginView";
import { RegisterView } from "./RegisterView";
import { ForgotPasswordView } from "./ForgotPasswordView";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", gap: "1rem" }}>
        <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
        <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
          Iniciando sesión segura en Direx...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === "register") {
      return <RegisterView onNavigateToLogin={() => setAuthView("login")} />;
    }
    if (authView === "forgot") {
      return <ForgotPasswordView onNavigateToLogin={() => setAuthView("login")} />;
    }
    return (
      <LoginView
        onNavigateToRegister={() => setAuthView("register")}
        onNavigateToForgotPassword={() => setAuthView("forgot")}
      />
    );
  }

  return <>{children}</>;
};
