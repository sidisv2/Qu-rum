import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase/client";
import { User } from "../types";

export interface AuthSession {
  user: User | null;
  supabaseUser: any | null;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  dataMode: "local" | "supabase";
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getDataMode = (): "local" | "supabase" => {
  const anyMeta = import.meta as any;
  const envMode = (typeof anyMeta !== "undefined" && anyMeta.env)
    ? anyMeta.env.VITE_DATA_MODE
    : (typeof process !== "undefined" && process.env ? process.env.VITE_DATA_MODE : "");
  return envMode === "supabase" && isSupabaseConfigured() ? "supabase" : "local";
};

const LOCAL_DEMO_USER: User = {
  id: "usr-1",
  email: "valentin@direx.app",
  fullName: "Valentín Morales",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  createdAt: "2026-01-01T00:00:00.000Z"
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataMode] = useState<"local" | "supabase">(getDataMode());
  const [user, setUser] = useState<User | null>(dataMode === "local" ? LOCAL_DEMO_USER : null);
  const [session, setSession] = useState<AuthSession | null>(
    dataMode === "local" ? { user: LOCAL_DEMO_USER, supabaseUser: null, token: "local-token" } : null
  );
  const [loading, setLoading] = useState<boolean>(dataMode === "supabase");

  useEffect(() => {
    if (dataMode === "local" || !supabase) {
      setLoading(false);
      return;
    }

    // Inicializar sesión real con Supabase
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        const u: User = {
          id: s.user.id,
          email: s.user.email || "",
          fullName: s.user.user_metadata?.full_name || s.user.email?.split("@")[0] || "Usuario",
          avatarUrl: s.user.user_metadata?.avatar_url || "",
          createdAt: s.user.created_at
        };
        setUser(u);
        setSession({ user: u, supabaseUser: s.user, token: s.access_token });
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        const u: User = {
          id: s.user.id,
          email: s.user.email || "",
          fullName: s.user.user_metadata?.full_name || s.user.email?.split("@")[0] || "Usuario",
          avatarUrl: s.user.user_metadata?.avatar_url || "",
          createdAt: s.user.created_at
        };
        setUser(u);
        setSession({ user: u, supabaseUser: s.user, token: s.access_token });
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dataMode]);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (dataMode === "local") {
      setUser(LOCAL_DEMO_USER);
      setSession({ user: LOCAL_DEMO_USER, supabaseUser: null, token: "local-token" });
      return {};
    }
    if (!supabase) return { error: "Supabase no configurado" };

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, pass: string, fullName: string): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    if (dataMode === "local") {
      const u: User = { ...LOCAL_DEMO_USER, email, fullName };
      setUser(u);
      setSession({ user: u, supabaseUser: null, token: "local-token" });
      return {};
    }
    if (!supabase) return { error: "Supabase no configurado" };

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) return { error: error.message };
    if (!data.session) {
      return { requiresEmailConfirmation: true };
    }
    return {};
  };

  const signOut = async (): Promise<void> => {
    if (dataMode === "supabase" && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (dataMode === "local") return {};
    if (!supabase) return { error: "Supabase no configurado" };

    const redirectUrl = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AUTH_REDIRECT_URL) || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) return { error: error.message };
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user,
        dataMode,
        signIn,
        signUp,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
