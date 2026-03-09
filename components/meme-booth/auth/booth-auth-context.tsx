// components/meme-booth/auth/booth-auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

  // Use ref for supabase client to avoid dependency issues
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Fetch credits from the server
  const fetchCredits = useCallback(async (userId: string) => {
    console.log("[BoothAuth] Fetching credits for user:", userId);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[BoothAuth] Error fetching credits:", error);
        // If user doesn't exist yet, set to 0 and try again in a moment
        if (error.code === "PGRST116") {
          console.log("[BoothAuth] User not found, will retry...");
          setState((prev) => ({ ...prev, credits: 0 }));
          // Retry after a short delay (trigger might be creating the user)
          setTimeout(() => fetchCredits(userId), 1000);
        }
        return;
      }

      console.log("[BoothAuth] Credits fetched:", data?.credits);
      setState((prev) => ({ ...prev, credits: data?.credits ?? 0 }));
    } catch (err) {
      console.error("[BoothAuth] Error fetching credits:", err);
    }
  }, [supabase]);

  // Refresh credits for current user
  const refreshCredits = useCallback(async () => {
    const currentUser = state.user;
    if (currentUser?.id) {
      await fetchCredits(currentUser.id);
    }
  }, [state.user, fetchCredits]);

  // Set credits directly (used by generation hook)
  const setCredits = useCallback((credits: number) => {
    console.log("[BoothAuth] Setting credits to:", credits);
    setState((prev) => ({ ...prev, credits }));
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setState((prev) => {
          if (prev.loading) {
            console.warn("[BoothAuth] Auth loading timeout");
            return { ...prev, loading: false };
          }
          return prev;
        });
      }
    }, 5000);

    // Get initial session
    const initAuth = async () => {
      try {
        console.log("[BoothAuth] Getting initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[BoothAuth] Error getting session:", error);
        }

        if (!mounted) return;

        clearTimeout(timeout);

        console.log("[BoothAuth] Initial session:", session ? "found" : "none");

        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        if (session?.user?.id) {
          fetchCredits(session.user.id);
        }
      } catch (err) {
        console.error("[BoothAuth] Error initializing auth:", err);
        if (mounted) {
          clearTimeout(timeout);
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log("[BoothAuth] Auth state changed:", event, session ? "has session" : "no session");

      if (!mounted) return;

      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user?.id) {
        // Small delay to ensure user row is created by trigger
        setTimeout(() => {
          if (mounted) {
            fetchCredits(session.user.id);
          }
        }, 100);
      } else {
        setState((prev) => ({ ...prev, credits: null }));
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchCredits]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      console.log("[BoothAuth] Signing in with email...");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[BoothAuth] Sign in error:", error);
        return { error: error.message };
      }

      console.log("[BoothAuth] Sign in successful");
      setIsAuthModalOpen(false);
      return { error: null };
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      console.log("[BoothAuth] Signing up with email...");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/booth`,
        },
      });

      if (error) {
        console.error("[BoothAuth] Sign up error:", error);
        return { error: error.message };
      }

      console.log("[BoothAuth] Sign up successful");
      setIsAuthModalOpen(false);
      return { error: null };
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    console.log("[BoothAuth] Signing in with Google...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/booth`,
      },
    });

    if (error) {
      console.error("[BoothAuth] Google sign in error:", error);
      return { error: error.message };
    }

    return { error: null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    console.log("[BoothAuth] Signing out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[BoothAuth] Sign out error:", error);
      }
      console.log("[BoothAuth] Sign out complete");
    } catch (err) {
      console.error("[BoothAuth] Sign out exception:", err);
    }
    // Always clear state even if there's an error
    setState({
      user: null,
      session: null,
      loading: false,
      credits: null,
    });
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
