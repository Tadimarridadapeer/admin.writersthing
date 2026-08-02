"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { logActivity } from "@/lib/activityLogger";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    {
      label: "One special character (!@#$%^&*)",
      test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    },
  ];

  const allRulesPass = passwordRules.every((rule) => rule.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!allRulesPass) {
      setError("Password does not meet all security requirements.");
      return;
    }

    setIsLoading(true);

    try {
      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Mark password as changed
        await supabase
          .from("operations_users")
          .update({
            requires_password_change: false,
            last_password_change: new Date().toISOString(),
          })
          .eq("id", user.id);

        await logActivity({
          userId: user.id,
          action: "Password Change",
          module: "Authentication",
          details: { firstLogin: true },
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
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
          Change Password
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          You must set a new password before continuing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <p className="text-white font-bold uppercase tracking-widest text-sm">
                Password Changed
              </p>
              <p className="text-zinc-500 text-xs mt-2">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleChangePassword}>

              {/* Current Password */}
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Current Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="appearance-none block w-full px-3 pr-10 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  New Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 pr-10 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Password strength rules */}
                {newPassword && (
                  <div className="mt-3 space-y-1.5">
                    {passwordRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            rule.test(newPassword) ? "bg-emerald-500" : "bg-zinc-700"
                          }`}
                        />
                        <span
                          className={`text-[9px] uppercase tracking-widest font-bold transition-colors ${
                            rule.test(newPassword) ? "text-emerald-500" : "text-zinc-600"
                          }`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  Confirm Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 pr-10 py-3 border rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-800 focus:ring-red-800 focus:border-red-800"
                        : confirmPassword && passwordsMatch
                        ? "border-emerald-800 focus:ring-emerald-700 focus:border-emerald-700"
                        : "border-zinc-800 focus:ring-white focus:border-white"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-2">
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && passwordsMatch && (
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-2">
                    Passwords match
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-900 rounded text-center">
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !allRulesPass || !passwordsMatch}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-[11px] font-black uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
