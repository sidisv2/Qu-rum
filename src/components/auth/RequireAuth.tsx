import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "./AuthModal";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(true);

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
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-base)", padding: "1rem" }}>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(true)} // Keep open until authenticated when gating full app
          initialMode="login"
        />
      </div>
    );
  }

  return <>{children}</>;
};
