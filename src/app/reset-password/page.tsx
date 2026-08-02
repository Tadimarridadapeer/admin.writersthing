"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@shared/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];

  const allRulesPass = passwordRules.every(rule => rule.test(newPassword));

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!allRulesPass) {
      setError("Password does not meet security requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("operations_users")
          .update({
            requires_password_change: false,
            last_password_change: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-black tracking-tight text-white uppercase">
          Set New Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <p className="text-white font-bold uppercase tracking-widest text-sm">Password Reset</p>
              <p className="text-zinc-500 text-xs mt-2">Redirecting to login...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label htmlFor="new-password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  New Password
                </label>
                <div className="mt-2">
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="mt-3 space-y-1">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${newPassword && rule.test(newPassword) ? "bg-emerald-500" : "bg-zinc-700"}`} />
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${newPassword && rule.test(newPassword) ? "text-emerald-500" : "text-zinc-600"}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Confirm Password
                </label>
                <div className="mt-2">
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-900 rounded text-center">
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !allRulesPass || newPassword !== confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-[11px] font-black uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
