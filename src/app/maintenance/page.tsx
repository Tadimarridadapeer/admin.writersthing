"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Server, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function MaintenancePage() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Fetch platform settings
        const { data: sysData, error: sysError } = await supabase
          .from("platform_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();
          
        if (sysData && !sysError) {
          setIsMaintenanceMode(sysData.is_maintenance_mode);
          setMaintenanceMessage(sysData.maintenance_message || "");
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        setErrorMsg("Failed to load maintenance settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUpdateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          is_maintenance_mode: isMaintenanceMode,
          maintenance_message: maintenanceMessage,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1);

      if (error) throw error;
      setSuccessMsg("Maintenance Mode updated successfully! The public website has been updated.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update system settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only Super Admins can access Maintenance settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Platform Maintenance</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage platform-wide settings and block access to the public website.</p>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-800 border border-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="rounded-xl border border-rose-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-5">
          <h2 className="text-base font-semibold text-rose-900 flex items-center gap-2">
            <Server className="h-5 w-5" />
            Global System Status
          </h2>
          <p className="mt-1 text-sm text-rose-700">These settings take effect immediately across all users on the live platform.</p>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleUpdateSystem} className="space-y-6">
            <div className={`flex items-center justify-between border-2 p-6 rounded-xl transition-colors ${isMaintenanceMode ? "border-rose-500 bg-rose-50/50" : "border-zinc-200"}`}>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Maintenance Mode</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-md">
                  Enable this to instantly block all users from accessing the live website. The Operations Portal will remain accessible.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${isMaintenanceMode ? "bg-rose-600" : "bg-zinc-200"}`}
              >
                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMaintenanceMode ? "translate-x-6" : "translate-x-0"}`}></span>
              </button>
            </div>

            <div>
              <label htmlFor="maintenance_message" className="block text-sm font-medium text-zinc-700 mb-1">
                Maintenance Screen Message
              </label>
              <p className="text-xs text-zinc-500 mb-3">This message will be displayed prominently to any user who tries to visit the website while Maintenance Mode is active.</p>
              <textarea
                id="maintenance_message"
                rows={4}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="We are currently upgrading our systems. We'll be back shortly!"
                disabled={!isMaintenanceMode}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
              />
            </div>
            
            <div className="flex justify-end pt-6 border-t border-zinc-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center gap-2 rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Applying..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
