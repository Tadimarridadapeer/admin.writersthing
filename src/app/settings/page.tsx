"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Lock, Bell, CheckCircle2, AlertCircle, Loader2, Server } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences" | "system">("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  
  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // System Settings State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const { isSuperAdmin } = useAuth(); // Import useAuth at the top if needed, or just define it. Wait, I'll need to import useAuth.

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from("operations_users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        setUser(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setDepartment(data.department || "");
        
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
        setErrorMsg(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
      setSuccessMsg("System settings updated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update system settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("operations_users")
        .update({
          full_name: fullName,
          phone,
          department,
        })
        .eq("id", user.id);

      if (error) throw error;
      setSuccessMsg("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      setSuccessMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update password.");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your admin profile and account preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-4 lg:pb-0">
            <button
              onClick={() => { setActiveTab("profile"); setSuccessMsg(null); setErrorMsg(null); }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <User className="h-4 w-4" />
              Profile details
            </button>
            <button
              onClick={() => { setActiveTab("security"); setSuccessMsg(null); setErrorMsg(null); }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Lock className="h-4 w-4" />
              Security
            </button>
            <button
              onClick={() => { setActiveTab("preferences"); setSuccessMsg(null); setErrorMsg(null); }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "preferences"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Bell className="h-4 w-4" />
              Preferences
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
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

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 px-6 py-5">
                <h2 className="text-base font-semibold text-zinc-900">Profile Details</h2>
                <p className="mt-1 text-sm text-zinc-500">Update your administrative information and contact details.</p>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700">Full Name</label>
                      <input
                        type="text"
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email Address <span className="text-xs text-zinc-500 font-normal ml-1">(Read-only)</span></label>
                      <input
                        type="email"
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 shadow-sm cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="department" className="block text-sm font-medium text-zinc-700">Department</label>
                      <input
                        type="text"
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 px-6 py-5">
                <h2 className="text-base font-semibold text-zinc-900">Change Password</h2>
                <p className="mt-1 text-sm text-zinc-500">Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <div className="px-6 py-6">
                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-zinc-700">New Password</label>
                    <input
                      type="password"
                      id="new_password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-700">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  
                  <div className="flex pt-2">
                    <button
                      type="submit"
                      disabled={saving || !newPassword || !confirmPassword}
                      className="inline-flex justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-zinc-200 px-6 py-5">
                <h2 className="text-base font-semibold text-zinc-900">Notification Preferences</h2>
                <p className="mt-1 text-sm text-zinc-500">Choose what system events you want to be notified about.</p>
              </div>
              <div className="px-6 py-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">Failed Payout Alerts</h3>
                    <p className="text-sm text-zinc-500">Receive an email when an author withdrawal fails.</p>
                  </div>
                  <button type="button" className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-900 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2" role="switch" aria-checked="true">
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">New Author Applications</h3>
                    <p className="text-sm text-zinc-500">Get notified when a new founding writer applies.</p>
                  </div>
                  <button type="button" className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2" role="switch" aria-checked="false">
                    <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">Daily Analytics Digest</h3>
                    <p className="text-sm text-zinc-500">Receive a daily summary of platform revenue and views.</p>
                  </div>
                  <button type="button" className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-900 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2" role="switch" aria-checked="true">
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-start gap-3 rounded-lg bg-blue-50 p-4 text-blue-800">
                  <Bell className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Note about preferences</h4>
                    <p className="mt-1 text-sm text-blue-700">These preferences are currently in beta and some email notifications may not be fully active yet.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
