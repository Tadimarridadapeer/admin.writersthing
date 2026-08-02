"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@shared/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import {
  UserPlus,
  Loader2,
  X,
  RefreshCw,
  Shield,
  ShieldCheck,
  MoreVertical,
  Eye,
  Ban,
  Trash2,
  KeyRound,
  Copy,
} from "lucide-react";

function generatePassword(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  status: string;
  created_at: string;
  last_login: string | null;
  roles: { name: string } | null;
}

export default function UsersPage() {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("operations_users")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });
    setAdmins(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleStatusChange = async (adminId: string, newStatus: string) => {
    if (!isSuperAdmin) return;
    const { error } = await supabase
      .from("operations_users")
      .update({ status: newStatus })
      .eq("id", adminId);

    if (!error) {
      await logActivity({
        userId: user?.id,
        roleName: user?.role_name,
        action: `${newStatus === "Active" ? "Activated" : newStatus === "Disabled" ? "Disabled" : "Suspended"} Admin`,
        module: "Admin Management",
        details: { targetAdminId: adminId, newStatus },
      });
      fetchAdmins();
    }
    setActionMenuId(null);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!isSuperAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this admin account? This action cannot be undone.")) return;

    const { error } = await supabase
      .from("operations_users")
      .delete()
      .eq("id", adminId);

    if (!error) {
      await logActivity({
        userId: user?.id,
        roleName: user?.role_name,
        action: "Deleted Admin",
        module: "Admin Management",
        details: { targetAdminId: adminId },
      });
      fetchAdmins();
    }
    setActionMenuId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Admin Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isSuperAdmin ? "Create, manage, and control admin accounts." : "View admin team members."}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            <UserPlus size={14} /> Create Admin
          </button>
        )}
      </div>

      {/* Admin Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Name</th>
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Email</th>
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Role</th>
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Department</th>
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
              <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Last Login</th>
              {isSuperAdmin && (
                <th className="text-right px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 size={20} className="animate-spin mx-auto text-zinc-400" />
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-400 text-xs uppercase tracking-widest">
                  No admin accounts found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-600">
                        {admin.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{admin.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest">
                      {admin.roles?.name === "Super Admin" ? (
                        <><ShieldCheck size={10} className="text-amber-600" /> <span className="text-amber-700">Super Admin</span></>
                      ) : (
                        <><Shield size={10} className="text-zinc-400" /> <span className="text-zinc-600">Admin</span></>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{admin.department || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      admin.status === "Active" ? "bg-emerald-50 text-emerald-700" :
                      admin.status === "Suspended" ? "bg-amber-50 text-amber-700" :
                      admin.status === "Disabled" ? "bg-red-50 text-red-700" :
                      "bg-zinc-100 text-zinc-500"
                    }`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : "Never"}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right relative">
                      {admin.roles?.name !== "Super Admin" && (
                        <>
                          <button
                            onClick={() => setActionMenuId(actionMenuId === admin.id ? null : admin.id)}
                            className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
                          >
                            <MoreVertical size={14} className="text-zinc-400" />
                          </button>
                          {actionMenuId === admin.id && (
                            <div className="absolute right-6 top-12 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 w-48">
                              <button
                                onClick={() => handleStatusChange(admin.id, admin.status === "Active" ? "Disabled" : "Active")}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <Ban size={12} />
                                {admin.status === "Active" ? "Disable" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleStatusChange(admin.id, "Suspended")}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <Ban size={12} /> Suspend
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && <CreateAdminModal onClose={() => { setShowCreateModal(false); fetchAdmins(); }} userId={user?.id} roleName={user?.role_name} />}
    </div>
  );
}

function CreateAdminModal({ onClose, userId, roleName }: { onClose: () => void; userId?: string; roleName?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!tempPassword) {
        throw new Error("Please generate or enter a temporary password.");
      }

      // 1. Create user in Supabase Auth via the admin API endpoint
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account.");

      // 2. Get the Admin role ID
      const { data: adminRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "Admin")
        .single();

      if (!adminRole) throw new Error("Admin role not found in database. Please run the schema migration.");

      // 3. Insert into operations_users
      const { error: insertError } = await supabase.from("operations_users").insert({
        id: authData.user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        role_id: adminRole.id,
        department: department || null,
        status: "Active",
        requires_password_change: true,
        created_by: userId || null,
      });

      if (insertError) throw insertError;

      // 4. Log the activity
      await logActivity({
        userId,
        roleName,
        action: "Created Admin",
        module: "Admin Management",
        details: { newAdminEmail: email, newAdminName: fullName },
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-zinc-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">Create New Admin</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded transition-colors">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Admin Created Successfully</h3>
            <p className="text-xs text-zinc-500 mb-4">
              An account has been created for <span className="font-bold text-zinc-700">{email}</span>
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded p-4 mb-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Temporary Password</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-sm font-mono bg-zinc-100 px-3 py-1 rounded text-zinc-800">{tempPassword}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); }}
                  className="p-1.5 hover:bg-zinc-200 rounded transition-colors"
                >
                  <Copy size={14} className={copied ? "text-emerald-600" : "text-zinc-400"} />
                </button>
              </div>
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-2">
                Share this securely. The admin must change it on first login.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                placeholder="admin@writersthing.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                  placeholder="Engineering"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Temporary Password *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="flex-grow px-3 py-2.5 border border-zinc-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                  placeholder="Click Generate →"
                />
                <button
                  type="button"
                  onClick={() => setTempPassword(generatePassword())}
                  className="px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Generate
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-center">
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Create Admin</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
