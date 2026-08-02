"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@shared/lib/supabase";
import {
  Search,
  Filter,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  role_name: string | null;
  action: string;
  module: string;
  details: Record<string, any> | null;
  ip_address: string | null;
  browser: string | null;
  status: string;
  created_at: string;
  operations_users?: {
    full_name: string;
    email: string;
  } | null;
}

const ITEMS_PER_PAGE = 20;

const MODULE_OPTIONS = [
  "All",
  "Authentication",
  "Admin Management",
  "Users",
  "Books",
  "Authors",
  "Founding Writers",
  "Applications",
  "Moderation",
  "Settings",
];

const ACTION_OPTIONS = [
  "All",
  "Login",
  "Logout",
  "Password Change",
  "Created Admin",
  "Disabled Admin",
  "Deleted Admin",
  "Approved",
  "Rejected",
  "Updated",
];

export default function ActivityPage() {
  const { user, isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from("activity_logs")
      .select("*, operations_users(full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    if (moduleFilter !== "All") query = query.eq("module", moduleFilter);
    if (actionFilter !== "All") query = query.eq("action", actionFilter);
    if (statusFilter !== "All") query = query.eq("status", statusFilter);
    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
    if (search) query = query.or(`action.ilike.%${search}%,module.ilike.%${search}%`);

    // Non-Super Admins can only see their own logs
    if (!isSuperAdmin && user) {
      query = query.eq("user_id", user.id);
    }

    const { data, count } = await query;

    setLogs(data || []);
    setTotalCount(count || 0);
    setIsLoading(false);
  }, [page, moduleFilter, actionFilter, statusFilter, dateFrom, dateTo, search, isSuperAdmin, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Time", "User", "Role", "Action", "Module", "Status", "IP Address"];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.operations_users?.full_name || "Unknown",
      log.role_name || "—",
      log.action,
      log.module,
      log.status,
      log.ip_address || "—",
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("All");
    setActionFilter("All");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Activity Logs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isSuperAdmin ? "Complete audit trail of all operations actions." : "Your activity history."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
              showFilters ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <Filter size={12} /> Filters
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by action or module..."
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filters</span>
            <button onClick={clearFilters} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 flex items-center gap-1">
              <X size={10} /> Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Module</label>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setPage(0); }}
                className="w-full px-2 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="w-full px-2 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full px-2 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="All">All</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full px-2 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="w-full px-2 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Time</th>
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">User</th>
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Role</th>
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Action</th>
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Module</th>
              <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 size={20} className="animate-spin mx-auto text-zinc-400" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-400 text-xs uppercase tracking-widest">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-zinc-700">
                    {log.operations_users?.full_name || "System"}
                  </td>
                  <td className="px-5 py-3 text-[10px] text-zinc-500">{log.role_name || "—"}</td>
                  <td className="px-5 py-3 text-xs font-bold text-zinc-800">{log.action}</td>
                  <td className="px-5 py-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      log.status === "Success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-zinc-100 bg-zinc-50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Page {page + 1} of {totalPages} • {totalCount} total
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 border border-zinc-200 rounded hover:bg-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={14} className="text-zinc-500" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-zinc-200 rounded hover:bg-white transition-colors disabled:opacity-30"
              >
                <ChevronRight size={14} className="text-zinc-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
