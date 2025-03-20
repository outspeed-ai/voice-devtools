import { type User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

import Loader from "@/components/ui/Loader";
import { env } from "@/config/env";
import { getSupabase } from "@/config/supabase";

type AuthContextType = {
  currentUser: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabase();

  useEffect(() => {
    if (!env.OUTSPEED_HOSTED) {
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      console.error("Supabase client not found");
      setIsLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
      } catch (error) {
        console.error("Error getting session:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) {
      console.error("signOut(): Supabase client not found");
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred while signing out");
      }
    }
  };

  if (isLoading) {
    return <Loader fullscreen />;
  }

  const value = { currentUser, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
