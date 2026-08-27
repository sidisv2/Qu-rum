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

const readEnv = (key: string): string => {
  try {
    const meta = import.meta as any;
    if (meta && meta.env && typeof meta.env[key] !== "undefined") {
      return meta.env[key] || "";
    }
  } catch (_e) {
    // fallback
  }
  if (typeof process !== "undefined" && process.env && typeof process.env[key] !== "undefined") {
    return process.env[key] || "";
  }
  return "";
};

const getDataMode = (): "local" | "supabase" => {
  const envMode = readEnv("VITE_DATA_MODE");
  if (envMode === "local") return "local";
  return isSupabaseConfigured() ? "supabase" : "local";
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
      authListener?.subscription.unsubscribe();
    };
  }, [dataMode]);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    if (dataMode === "local" || !supabase) {
      setUser(LOCAL_DEMO_USER);
      setSession({ user: LOCAL_DEMO_USER, supabaseUser: null, token: "local-token" });
      return {};
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const u: User = {
        id: data.user.id,
        email: data.user.email || "",
        fullName: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario",
        avatarUrl: data.user.user_metadata?.avatar_url || "",
        createdAt: data.user.created_at
      };
      setUser(u);
      setSession({ user: u, supabaseUser: data.user, token: data.session?.access_token || null });
    }

    return {};
  };

  const signUp = async (
    email: string,
    pass: string,
    fullName: string
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    if (dataMode === "local" || !supabase) {
      const newUser: User = {
        id: "usr-" + Date.now(),
        email,
        fullName,
        createdAt: new Date().toISOString()
      };
      setUser(newUser);
      setSession({ user: newUser, supabaseUser: null, token: "local-token" });
      return {};
    }

    const redirectUrl = readEnv("VITE_AUTH_REDIRECT_URL") || "https://quorum-psi-three.vercel.app/";

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session?.user) {
      const u: User = {
        id: data.user!.id,
        email: data.user!.email || "",
        fullName: fullName,
        createdAt: data.user!.created_at
      };
      setUser(u);
      setSession({ user: u, supabaseUser: data.user, token: data.session.access_token });
      return {};
    }

    // Si requiere confirmación de email
    return { requiresEmailConfirmation: true };
  };

  const signOut = async (): Promise<void> => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    if (!supabase) return {};
    const redirectUrl = readEnv("VITE_AUTH_REDIRECT_URL") || "https://quorum-psi-three.vercel.app/";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
