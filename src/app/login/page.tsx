"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logActivity, logLoginHistory } from "@/lib/activityLogger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // On mount: if no Super Admin exists yet, redirect to setup
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/setup");
        if (!res.ok) {
          // API error — go to setup (setup page will lock itself if SA exists)
          router.replace("/setup");
          return;
        }
        const data = await res.json();
        // If Super Admin does NOT exist, go to setup
        if (!data.exists) {
          router.replace("/setup");
          return;
        }
        // Super Admin exists — stay on login
        setCheckingSetup(false);
      } catch {
        // Network error — go to setup (safe fallback)
        router.replace("/setup");
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        await logLoginHistory({ success: false, failureReason: authError.message });
        throw authError;
      }

      if (data?.user) {
        // Fetch operations_user details
        const { data: opUser } = await supabase
          .from("operations_users")
          .select("*, roles(name)")
          .eq("id", data.user.id)
          .single();

        if (!opUser) {
          await supabase.auth.signOut();
          await logLoginHistory({
            userId: data.user.id,
            success: false,
            failureReason: "Not an operations user",
          });
          throw new Error("Unauthorized. This portal is restricted to Operations personnel.");
        }

        if (opUser.status !== "Active") {
          await supabase.auth.signOut();
          await logLoginHistory({
            userId: data.user.id,
            success: false,
            failureReason: `Account status: ${opUser.status}`,
          });
          throw new Error(
            `Your account is ${opUser.status.toLowerCase()}. Contact your administrator.`
          );
        }

        // Log successful login
        await logLoginHistory({ userId: data.user.id, success: true });
        await logActivity({
          userId: data.user.id,
          roleName: opUser.roles?.name,
          action: "Login",
          module: "Authentication",
        });

        // Update last_login timestamp
        await supabase
          .from("operations_users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.user.id);

        // Store user in localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: opUser.id,
            email: opUser.email,
            name: opUser.full_name,
            role: opUser.roles?.name,
          })
        );

        // Check if password change is required
        if (opUser.requires_password_change) {
          router.push("/change-password");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  // Show spinner while checking setup state
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="text-zinc-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-white uppercase">
          Operations Portal
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Authorized Personnel Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
              >
                Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                  placeholder="admin@writersthing.com"
                />
              </div>
            </div>

            {/* Password with eye toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 pr-10 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                  placeholder="••••••••"
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-3 focus:outline-none"
                  >
                    <Eye size={18} className={showPassword ? "opacity-50" : ""} />
                  </button>
              </div>
            </div>

            {/* Remember me + forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-white focus:ring-white border-zinc-800 rounded bg-black"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-900 rounded text-center">
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-[11px] font-black uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
