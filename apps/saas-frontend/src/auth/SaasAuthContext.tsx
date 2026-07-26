import { createContext, ReactNode, useContext, useSyncExternalStore } from "react";
import { SaasAdminUser } from "@hrm-plus/shared";
import * as authApi from "../api/auth";
import { clearSession, getSession, setSession, subscribe } from "./saasAuthStore";

interface SaasAuthContextValue {
  admin: SaasAdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SaasAuthContext = createContext<SaasAuthContextValue | undefined>(undefined);

export function SaasAuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession);

  const value: SaasAuthContextValue = {
    admin: session?.admin ?? null,
    isAuthenticated: Boolean(session),
    login: async (email, password) => {
      const result = await authApi.login(email, password);
      setSession({ token: result.accessToken, admin: result.admin });
    },
    logout: () => clearSession(),
  };

  return <SaasAuthContext.Provider value={value}>{children}</SaasAuthContext.Provider>;
}

export function useSaasAuth(): SaasAuthContextValue {
  const ctx = useContext(SaasAuthContext);
  if (!ctx) throw new Error("useSaasAuth must be used within a SaasAuthProvider");
  return ctx;
}
