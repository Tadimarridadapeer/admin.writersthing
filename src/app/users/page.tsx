"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  Users, 
  UserPlus, 
  Activity, 
  LogIn, 
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X
} from "lucide-react";

function formatSafeDate(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    let normalized = dateString;
    if (!normalized.endsWith('Z') && !normalized.match(/[+-]\d{2}:?\d{2}$/)) {
      normalized = normalized + 'Z';
    }
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "Unknown Date";
    return format(date, "dd MMM yyyy, hh:mm a");
  } catch (err) {
    return "Invalid Date";
  }
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  lastLoginAt: string | null;
  status: string;
}

interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  loginsToday: number;
}

export default function PublicUsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [loginFilter, setLoginFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`),
        fetch('/api/admin/stats')
      ]);
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
      setIsStatsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Apply Registration Date Filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter(u => {
        if (!u.joinedAt) return false;
        let normJoined = u.joinedAt;
        if (!normJoined.endsWith('Z') && !normJoined.match(/[+-]\d{2}:?\d{2}$/)) {
          normJoined += 'Z';
        }
        const joined = new Date(normJoined);
        if (isNaN(joined.getTime())) return false;
        
        if (dateFilter === "today") {
          return joined.toDateString() === now.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return joined >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          return joined >= monthAgo;
        }
        return true;
      });
    }

    // Apply Login Date Filter
    if (loginFilter !== "all") {
      const now = new Date();
      result = result.filter(u => {
        if (loginFilter === "never") {
          return !u.lastLoginAt;
        }
        
        if (!u.lastLoginAt) return false;
        let normLogin = u.lastLoginAt;
        if (!normLogin.endsWith('Z') && !normLogin.match(/[+-]\d{2}:?\d{2}$/)) {
          normLogin += 'Z';
        }
        const lastLogin = new Date(normLogin);
        if (isNaN(lastLogin.getTime())) return false;
        
        if (loginFilter === "today") {
          return lastLogin.toDateString() === now.toDateString();
        } else if (loginFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastLogin >= weekAgo;
        }
        return true;
      });
    }

    return result;
  }, [users, dateFilter, loginFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and view public platform users.
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers} 
          icon={<Users size={20} className="text-blue-600" />} 
          loading={isStatsLoading} 
        />
        <StatCard 
          title="New Today" 
          value={stats?.newUsersToday} 
          icon={<UserPlus size={20} className="text-emerald-600" />} 
          loading={isStatsLoading} 
        />
        <StatCard 
          title="New This Week" 
          value={stats?.newUsersThisWeek} 
          icon={<Activity size={20} className="text-purple-600" />} 
          loading={isStatsLoading} 
        />
        <StatCard 
          title="Logins Today" 
          value={stats?.loginsToday} 
          icon={<LogIn size={20} className="text-amber-600" />} 
          loading={isStatsLoading} 
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={14} className="text-zinc-400" />
            <select 
              value={dateFilter} 
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 md:w-36 px-2 py-2 border border-zinc-200 rounded-md text-xs bg-white text-zinc-700 uppercase font-bold tracking-wider"
            >
              <option value="all">Joined: All Time</option>
              <option value="today">Joined: Today</option>
              <option value="week">Joined: Last 7 Days</option>
              <option value="month">Joined: Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={loginFilter} 
              onChange={(e) => { setLoginFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 md:w-36 px-2 py-2 border border-zinc-200 rounded-md text-xs bg-white text-zinc-700 uppercase font-bold tracking-wider"
            >
              <option value="all">Login: All Time</option>
              <option value="today">Login: Today</option>
              <option value="week">Login: This Week</option>
              <option value="never">Login: Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Joined</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Last Login</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-zinc-300" />
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-600 whitespace-nowrap">
                      {formatSafeDate(user.joinedAt)}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-600 whitespace-nowrap">
                      {formatSafeDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                        user.status === 'active' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-100 bg-white">
            <div className="text-xs text-zinc-500">
              Showing <span className="font-bold text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-zinc-900">{filteredUsers.length}</span> results
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-zinc-200 text-zinc-600 disabled:opacity-50 hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-zinc-200 text-zinc-600 disabled:opacity-50 hover:bg-zinc-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-zinc-200 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-zinc-100 rounded-md transition-colors text-zinc-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-xl font-black text-zinc-600 border border-zinc-200">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">{selectedUser.name}</h3>
                  <p className="text-sm text-zinc-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Joined Date</div>
                  <div className="text-sm font-medium text-zinc-900">{formatSafeDate(selectedUser.joinedAt).split(',')[0]}</div>
                  <div className="text-xs text-zinc-500">{formatSafeDate(selectedUser.joinedAt).split(',')[1]?.trim() || ''}</div>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Last Login</div>
                  <div className="text-sm font-medium text-zinc-900">{formatSafeDate(selectedUser.lastLoginAt).split(',')[0]}</div>
                  <div className="text-xs text-zinc-500">{formatSafeDate(selectedUser.lastLoginAt).split(',')[1]?.trim() || ''}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Role</span>
                  <span className="text-sm font-bold text-zinc-900">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
                    selectedUser.status === 'active' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">User ID</span>
                  <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]" title={selectedUser.id}>{selectedUser.id}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number, icon: React.ReactNode, loading: boolean }) {
  return (
    <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-between">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{title}</h3>
        {loading ? (
          <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded mt-1"></div>
        ) : (
          <div className="text-2xl font-black text-zinc-900">{value !== undefined ? value.toLocaleString() : "0"}</div>
        )}
      </div>
      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
        {icon}
      </div>
    </div>
  );
}
