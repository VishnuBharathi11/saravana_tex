import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { adminUser } from "@/data/mock";
import { useCrm, crm } from "@/lib/store";
import type { Employee } from "@/types";

interface AuthState {
  user: Employee | null;
  isAdmin: boolean;
  login: (email: string) => void;
  loginAs: (id: string) => void;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const KEY = "st-crm-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [ready, setReady] = useState(false);

  const { employees } = useCrm();

  useEffect(() => {
    const id = localStorage.getItem(KEY);
    const found = id ? employees.find((e) => e.id === id) : null;
    setUser(found ?? null);
    setReady(true);
  }, [employees]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      isAdmin: user?.role === "Admin",
      login: (email: string) => {
        const found = crm.state.employees.find(
          (e) => e.email.toLowerCase() === email.trim().toLowerCase(),
        );
        const next = found ?? adminUser;
        localStorage.setItem(KEY, next.id);
        setUser(next);
      },
      loginAs: (id: string) => {
        const found = crm.state.employees.find((e) => e.id === id) ?? adminUser;
        localStorage.setItem(KEY, found.id);
        setUser(found);
      },
      logout: () => {
        localStorage.removeItem(KEY);
        setUser(null);
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
