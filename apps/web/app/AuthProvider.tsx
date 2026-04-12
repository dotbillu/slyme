"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "@/services/auth/service";

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await getMe();
        setUser(data);
        setChecked(true);
      } catch {
        setUser(null);
        setChecked(true);
      }
    };

    check();
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, checked }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
