"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, DollarSign, ShieldCheck, CheckCircle2, Search, ExternalLink } from "lucide-react";

export default function AuthorsPage() {
  const { isSuperAdmin } = useAuth();
  const [authors, setAuthors] = useState<any[]>([]);
  const [foundingWriters, setFoundingWriters] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalAuthors: 0,
    verifiedWriters: 0,
    availableForHire: 0,
    totalEarnings: 0
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Fetch Authors extended data and join with Users table
    const { data: authorsData, error: authorsError } = await supabase
      .from("authors")
      .select("*, users!inner(*)")
      .order("created_at", { ascending: false });

    // 2. Fetch Founding Writers to know who has the badge
    const { data: foundingData, error: foundingError } = await supabase
      .from("founding_writers")
      .select("user_id, founder_number")
      .eq("status", "Accepted");

    if (!authorsError && authorsData) {
      setAuthors(authorsData);
      
      let verifiedCount = 0;
      let hireableCount = 0;
      let earningsSum = 0;

      authorsData.forEach((author) => {
        if (author.users.is_verified_writer) verifiedCount++;
        if (author.users.available_for_hire) hireableCount++;
        earningsSum += Number(author.total_earnings) || 0;
      });

      setStats({
        totalAuthors: authorsData.length,
        verifiedWriters: verifiedCount,
        availableForHire: hireableCount,
        totalEarnings: earningsSum
      });
    }

    if (!foundingError && foundingData) {
      const fwMap = new Map();
      foundingData.forEach(f => fwMap.set(f.user_id, f.founder_number));
      setFoundingWriters(fwMap);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = async (userId: string, field: "is_verified_writer" | "available_for_hire", currentValue: boolean) => {
    // Optimistic update
    setAuthors(prev => prev.map(a => {
      if (a.users.id === userId) {
        return {
          ...a,
          users: { ...a.users, [field]: !currentValue }
        };
      }
      return a;
    }));

    try {
      const res = await fetch("/api/authors/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, field, value: !currentValue })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      
      // Update stats based on the toggle
      setStats(prev => ({
        ...prev,
        [field === "is_verified_writer" ? "verifiedWriters" : "availableForHire"]: 
          prev[field === "is_verified_writer" ? "verifiedWriters" : "availableForHire"] + (!currentValue ? 1 : -1)
      }));

    } catch (err) {
      console.error(err);
      // Revert on error
      setAuthors(prev => prev.map(a => {
        if (a.users.id === userId) {
          return {
            ...a,
            users: { ...a.users, [field]: currentValue }
          };
        }
        return a;
      }));
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-red-600">You do not have permission to view this module.</div>;
  }

  const filteredAuthors = authors.filter(author => 
    author.users.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    author.users.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Authors Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and view all registered authors on the platform.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Authors" value={stats.totalAuthors} icon={<Users size={20} />} />
            <StatCard label="Verified Writers" value={stats.verifiedWriters} icon={<ShieldCheck size={20} />} textColor="text-blue-600" />
            <StatCard label="Available for Hire" value={stats.availableForHire} icon={<CheckCircle2 size={20} />} textColor="text-emerald-600" />
            <StatCard label="Total Earnings (₹)" value={`₹${stats.totalEarnings.toLocaleString()}`} icon={<DollarSign size={20} />} textColor="text-amber-600" />
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">Author Directory</h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  placeholder="Search authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded text-xs focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Author</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredAuthors.map((author) => (
                    <tr key={author.users.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center font-bold text-zinc-400 border border-zinc-200 shrink-0">
                            {author.users.avatar_url ? (
                              <img src={author.users.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              author.users.name?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{author.users.name}</p>
                            <p className="text-xs text-zinc-500">{author.users.email}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Joined {new Date(author.users.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {foundingWriters.has(author.users.id) && (
                            <span className="inline-flex w-fit px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded">
                              Founding Writer #{String(foundingWriters.get(author.users.id)).padStart(5, '0')}
                            </span>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer w-fit group">
                            <input 
                              type="checkbox" 
                              checked={author.users.is_verified_writer || false}
                              onChange={() => toggleStatus(author.users.id, "is_verified_writer", author.users.is_verified_writer)}
                              className="accent-blue-600"
                            />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${author.users.is_verified_writer ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"}`}>
                              Verified Writer
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer w-fit group">
                            <input 
                              type="checkbox" 
                              checked={author.users.available_for_hire || false}
                              onChange={() => toggleStatus(author.users.id, "available_for_hire", author.users.available_for_hire)}
                              className="accent-emerald-600"
                            />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${author.users.available_for_hire ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600"}`}>
                              Available for Hire
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-900">₹{Number(author.total_earnings || 0).toLocaleString()}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Earnings</p>
                          <div className="h-1" />
                          <p className="text-xs font-bold text-zinc-900">{author.followers_count || 0}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Followers</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {/* We link to localhost:3000/authors/[id] essentially, but since this is operations (port 3001) 
                            we need an absolute url or assume they know it. I will just render a text link. 
                            Wait, operations usually runs on 3001, frontend on 3000. 
                            We can use NEXT_PUBLIC_FRONTEND_URL or just an absolute link based on window location.
                        */}
                        <a 
                          href={`http://localhost:3000/authors/${author.users.id}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          <ExternalLink size={12} />
                          View Profile
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredAuthors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                        No authors found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, textColor = "text-zinc-900" }: any) {
  return (
    <div className="p-6 border border-zinc-200 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
        <span className="text-zinc-400">{icon}</span>
      </div>
      <span className={`text-3xl font-black ${textColor}`}>{value}</span>
    </div>
  );
}
