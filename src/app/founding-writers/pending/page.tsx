"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, UserPlus, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PendingInvitations() {
  const { isSuperAdmin } = useAuth();
  const [writers, setWriters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWriters = useCallback(async () => {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from("founding_writers")
        .select("*, invited_by_user:operations_users!invited_by(full_name)")
        .in("status", ["Pending", "Invited"])
        .order("created_at", { ascending: false });

      if (error || !data) {
        const fallbackRes = await supabase
          .from("founding_writers")
          .select("*")
          .in("status", ["Pending", "Invited"])
          .order("created_at", { ascending: false });
        data = fallbackRes.data || [];
      }

      setWriters(data || []);
    } catch (err) {
      console.error("Error fetching pending invitations:", err);
      setWriters([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWriters();
  }, [fetchWriters]);

  const filteredWriters = writers.filter(w => {
    const name = (w.full_name || "").toLowerCase();
    const email = (w.email_address || w.email || "").toLowerCase();
    const num = (w.founder_number ?? "").toString();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || num.includes(q);
  });

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-red-600">You do not have permission to view this module.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Pending Invitations</h1>
          <p className="text-sm text-zinc-500 mt-1">View pending founding writer invitations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchWriters}
            disabled={isLoading}
            className="p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/founding-writers/invite"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded transition-colors"
          >
            <UserPlus size={14} />
            Invite Founder
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">No.</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Writer</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Email</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Invited By</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Date Invited</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Loader2 size={20} className="animate-spin mx-auto text-zinc-400" />
                </td>
              </tr>
            ) : filteredWriters.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-zinc-400 text-xs uppercase tracking-widest">
                  {searchQuery ? "No matching invitations found." : "No pending invitations found."}
                </td>
              </tr>
            ) : (
              filteredWriters.map((writer) => (
                <tr key={writer.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-zinc-900">
                    #{String(writer.founder_number).padStart(3, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm text-zinc-900">{writer.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{writer.email_address || writer.email}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{writer.invited_by_user?.full_name || 'System'}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{new Date(writer.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
