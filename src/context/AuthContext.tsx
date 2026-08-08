"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OperationsUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role_id: string;
  role_name: string;
  department: string | null;
  status: string;
  requires_password_change: boolean;
  created_at: string;
  last_login: string | null;
  last_password_change: string | null;
}

interface AuthContextType {
  user: OperationsUser | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSuperAdmin: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OperationsUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  const fetchOperationsUser = useCallback(async (authUserId: string): Promise<OperationsUser | null> => {
    const { data } = await supabase
      .from("operations_users")
      .select("*, roles(name)")
      .eq("id", authUserId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      role_id: data.role_id,
      role_name: data.roles?.name || "Unknown",
      department: data.department,
      status: data.status,
      requires_password_change: data.requires_password_change,
      created_at: data.created_at,
      last_login: data.last_login,
      last_password_change: data.last_password_change,
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const opUser = await fetchOperationsUser(session.user.id);
      setUser(opUser);
    }
  }, [fetchOperationsUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }, [router]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!isPublicPath) {
            router.push("/login");
          }
          setIsLoading(false);
          return;
        }

        const opUser = await fetchOperationsUser(session.user.id);

        if (!opUser) {
          // Not an operations user — sign them out
          await supabase.auth.signOut();
          if (!isPublicPath) router.push("/login");
          setIsLoading(false);
          return;
        }

        if (opUser.status !== "Active") {
          await supabase.auth.signOut();
          if (!isPublicPath) router.push("/login");
          setIsLoading(false);
          return;
        }

        if (opUser.requires_password_change && pathname !== "/change-password") {
          setUser(opUser);
          router.push("/change-password");
          setIsLoading(false);
          return;
        }

        setUser(opUser);
        localStorage.setItem("user", JSON.stringify({
          id: opUser.id,
          email: opUser.email,
          name: opUser.full_name,
          role: opUser.role_name,
        }));
      } catch (err) {
        console.error("Auth init error:", err);
        if (!isPublicPath) router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, isPublicPath, router, fetchOperationsUser]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("user");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Inactivity timeout
  useEffect(() => {
    if (!user || isPublicPath) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        signOut();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, isPublicPath, signOut]);

  const isSuperAdmin = user?.role_name === "Super Admin";

  // Show nothing while checking auth on protected routes
  if (isLoading && !isPublicPath) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isSuperAdmin, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
