"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
} from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
];

export default function SetupPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [missingServiceKey, setMissingServiceKey] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const allRulesPass = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword;
  const canSubmit = fullName.trim() && email.trim() && allRulesPass && passwordsMatch;

  // On mount: check if Super Admin already exists
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/setup");
        const data = await res.json();

        if (data.error && data.error.includes("service role")) {
          setMissingServiceKey(true);
          setChecking(false);
          return;
        }

        if (!data.configured) {
          setNotConfigured(true);
          setChecking(false);
          return;
        }

        if (data.exists) {
          setAlreadyExists(true);
          setChecking(false);
          // DO NOT auto-redirect — show the locked screen so user knows setup is done
          return;
        }

        setChecking(false);
      } catch {
        setChecking(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-zinc-600 animate-spin" />
      </div>
    );
  }

  // ── Missing service role key ───────────────────────────────────────────────
  if (missingServiceKey) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 mb-6">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-2">
          Configuration Required
        </h2>
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
          <p className="text-xs text-zinc-400 font-medium mb-4">
            To create the Super Admin account, you need to add your Supabase Service Role Key to{" "}
            <code className="text-white bg-zinc-800 px-1 py-0.5 rounded text-[10px]">.env.local</code>:
          </p>
          <pre className="bg-black border border-zinc-800 rounded p-3 text-[11px] text-emerald-400 overflow-x-auto">
            {`SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`}
          </pre>
          <p className="text-[10px] text-zinc-600 mt-4">
            Get it from:{" "}
            <span className="text-zinc-400">
              Supabase Dashboard → Settings → API → service_role
            </span>
          </p>
          <p className="text-[10px] text-zinc-600 mt-2">
            After adding, restart the dev server and refresh this page.
          </p>
        </div>
      </div>
    );
  }

  // ── DB not configured ─────────────────────────────────────────────────────
  if (notConfigured) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 mb-6">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-2">
          Database Not Ready
        </h2>
        <p className="text-zinc-500 text-xs text-center max-w-sm mt-2">
          The operations schema has not been set up. Please run{" "}
          <code className="text-white">operations_schema.sql</code> in your Supabase SQL Editor first.
        </p>
      </div>
    );
  }

  // ── Super Admin already exists ──────────────────────────────────────────────────────
  if (alreadyExists) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 mb-6">
          <Lock size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-2">
          Setup Complete
        </h2>
        <p className="text-zinc-500 text-xs text-center max-w-sm mt-2">
          A Super Admin account already exists. This setup page is permanently locked.
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="mt-8 px-6 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded hover:bg-zinc-200 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <CheckCircle2 size={56} className="text-emerald-500 mb-6" />
        <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-2">
          Account Created
        </h2>
        <p className="text-zinc-500 text-xs text-center max-w-sm">
          Your Super Admin account has been created. Redirecting to login...
        </p>
      </div>
    );
  }

  // ── Setup Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
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
          Create Your Super Admin Account
        </p>
        <div className="mt-4 mx-auto max-w-xs">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <p className="text-center text-[9px] text-zinc-600 uppercase tracking-widest mt-3">
            One-time setup · This page locks after account creation
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div>
              <label
                htmlFor="full-name"
                className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
              >
                Full Name
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User size={14} className="text-zinc-600" />
                </div>
                <input
                  id="full-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white text-sm transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400"
              >
                Email Address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail size={14} className="text-zinc-600" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-9 pr-3 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white text-sm transition-all"
                  placeholder="admin@yourcompany.com"
                />
              </div>
            </div>

            {/* Password */}
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 pr-10 py-3 border border-zinc-800 rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white text-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Password strength */}
              {password && (
                <div className="mt-3 space-y-1.5">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          rule.test(password) ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      />
                      <span
                        className={`text-[9px] uppercase tracking-widest font-bold transition-colors ${
                          rule.test(password) ? "text-emerald-500" : "text-zinc-600"
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
                  className={`appearance-none block w-full px-3 pr-10 py-3 border rounded bg-black text-white placeholder-zinc-600 focus:outline-none focus:ring-1 text-sm transition-all ${
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-[11px] font-black uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Create Super Admin Account"
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[9px] text-zinc-700 uppercase tracking-widest">
            This is a one-time setup. This page will lock permanently after account creation.
          </p>
        </div>
      </div>
    </div>
  );
}
