import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
} from "@/api/auth";
import { setCurrentUser } from "@/lib/store";
import type { Employee } from "@/types";

interface AuthState {
  user: Employee | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  ready: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Employee | null>(null);
  const [ready, setReady] = useState(false);

  const setAuthenticatedUser = (nextUser: Employee | null) => {
    setUserState(nextUser);
    setCurrentUser(nextUser);
  };

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await getCurrentUser();

        if (!cancelled) {
          setAuthenticatedUser(response.employee);
        }
      } catch {
        if (!cancelled) {
          setAuthenticatedUser(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      isAdmin: user?.role === "Admin",
      login: async (email, password) => {
        const response = await apiLogin(email, password);
        setAuthenticatedUser(response.employee);
      },
      logout: async () => {
        try {
          await apiLogout();
        } finally {
          setAuthenticatedUser(null);
        }
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
