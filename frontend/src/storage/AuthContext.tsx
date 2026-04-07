import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthService, Session } from "../services/AuthService";

export interface UserProfile {
  displayName: string;
  email: string;
  avatar: string;
  joinDate: string;
  rank: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  session: Session | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  googleAuthRequest: any;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function sessionToProfile(session: Session): UserProfile {
  const meta = session.user.user_metadata || {};
  return {
    displayName: (
      meta.display_name ||
      meta.full_name ||
      meta.name ||
      session.user.email?.split("@")[0] ||
      "PLAYER"
    ).toUpperCase(),
    email: session.user.email || "",
    avatar: meta.avatar_url || meta.picture || "",
    joinDate: session.user.created_at || new Date().toISOString(),
    rank: "STRATEGIST II",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const subscription = AuthService.onAuthStateChange(
      (_event, authSession) => {
        if (authSession?.user) {
          setSession(authSession);
          setUser(sessionToProfile(authSession));
          setIsAuthenticated(true);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      },
    );

    AuthService.getSession().then((authSession) => {
      if (authSession?.user) {
        setSession(authSession);
        setUser(sessionToProfile(authSession));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await AuthService.signInWithPassword(email, password);
    if (result.error) return { success: false, error: result.error };
    if (result.session?.user) {
      setSession(result.session);
      setUser(sessionToProfile(result.session));
      setIsAuthenticated(true);
    }
    return { success: true };
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await AuthService.signUp(name, email, password);
      if (result.error) return { success: false, error: result.error };
      if (result.session?.user) {
        setSession(result.session);
        setUser(sessionToProfile(result.session));
        setIsAuthenticated(true);
      }
      return { success: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const metadata: Record<string, string> = {};
    if (updates.displayName) metadata.display_name = updates.displayName;
    if (updates.email) metadata.email = updates.email;

    if (Object.keys(metadata).length > 0) {
      await AuthService.updateUser({ data: metadata });
    }

    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await AuthService.resetPasswordForEmail(email);
    if (result.error) return { success: false, error: result.error };
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    const result = await AuthService.updatePassword(newPassword);
    if (result.error) return { success: false, error: result.error };
    return { success: true };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await AuthService.signInWithGoogle();
      if (result.session?.user) {
        setSession(result.session);
        setUser(sessionToProfile(result.session));
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: result.error || "Google sign in failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Google sign in failed" };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        session,
        login,
        signup,
        logout,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        signInWithGoogle,
        googleAuthRequest: {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
