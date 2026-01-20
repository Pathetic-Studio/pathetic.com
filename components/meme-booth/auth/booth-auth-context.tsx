// components/meme-booth/auth/booth-auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  credits: number | null;
};

type AuthContextValue = AuthState & {
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  setCredits: (credits: number) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function BoothAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    credits: null,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const supabase = createClient();

  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }

      setState((prev) => ({ ...prev, credits: data?.credits ?? 0 }));
    } catch (err) {
      console.error("Error fetching credits:", err);
    }
  }, [supabase]);

  const refreshCredits = useCallback(async () => {
    if (state.user?.id) {
      await fetchCredits(state.user.id);
    }
  }, [state.user?.id, fetchCredits]);

  const setCredits = useCallback((credits: number) => {
    setState((prev) => ({ ...prev, credits }));
  }, []);

  useEffect(() => {
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.loading) {
          console.warn("Auth loading timeout - setting to not loading");
          return { ...prev, loading: false };
        }
        return prev;
      });
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      clearTimeout(timeout);
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user?.id) {
        fetchCredits(session.user.id);
      }
    }).catch((err: Error) => {
      clearTimeout(timeout);
      console.error("Error getting session:", err);
      setState((prev) => ({ ...prev, loading: false }));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user?.id) {
        await fetchCredits(session.user.id);
      } else {
        setState((prev) => ({ ...prev, credits: null }));
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchCredits]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setIsAuthModalOpen(false);
      return { error: null };
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/booth`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      setIsAuthModalOpen(false);
      return { error: null };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/booth`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState((prev) => ({
      ...prev,
      user: null,
      session: null,
      credits: null,
    }));
  }, [supabase]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshCredits,
        setCredits,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useBoothAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useBoothAuth must be used within a BoothAuthProvider");
  }
  return context;
}
