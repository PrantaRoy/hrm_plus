import { createContext, ReactNode, useContext, useSyncExternalStore } from "react";
import { AuthUser } from "@hrm-plus/shared";
import * as authApi from "../api/auth";
import { clearSession, getSession, setMustChangePassword, setSession, subscribe } from "./authStore";

interface AuthContextValue {
  user: AuthUser | null;
  tenantSlug: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    tenantSlug: session?.tenantSlug ?? null,
    isAuthenticated: Boolean(session),
    mustChangePassword: session?.mustChangePassword ?? false,
    login: async (tenantSlug, email, password) => {
      const result = await authApi.login(tenantSlug, email, password);
      setSession({
        token: result.accessToken,
        user: result.user,
        tenantSlug: result.tenantSlug,
        mustChangePassword: result.mustChangePassword,
      });
    },
    changePassword: async (currentPassword, newPassword) => {
      await authApi.changePassword({ currentPassword, newPassword });
      setMustChangePassword(false);
    },
    logout: () => clearSession(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
