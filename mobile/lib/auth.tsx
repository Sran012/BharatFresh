import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

type User = {
  id: string;
  phone: string;
  role: "buyer" | "seller" | null;
  name: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (phone: string, code: string) => Promise<{ needsRegistration: boolean }>;
  register: (data: { name: string; role: "buyer" | "seller"; shopName?: string; serviceLat?: number; serviceLng?: number; serviceRadiusKm?: number }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.setOnUnauthorized(() => {
      setUser(null);
      setToken(null);
    });

    (async () => {
      const savedToken = await api.loadToken();
      if (savedToken) {
        setToken(savedToken);
        try {
          const me = await api.get<User>("/auth/me");
          setUser(me);
        } catch {
          await api.setToken(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (phone: string, code: string) => {
    const result = await api.post<{ token: string; user: User & { needsRegistration: boolean } }>("/auth/verify-otp", { phone, code });
    await api.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return { needsRegistration: result.user.needsRegistration };
  };

  const register = async (data: { name: string; role: "buyer" | "seller"; shopName?: string; serviceLat?: number; serviceLng?: number; serviceRadiusKm?: number }) => {
    const result = await api.post<{ token: string; user: User }>("/auth/register", data);
    await api.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const signOut = async () => {
    await api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, register, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
