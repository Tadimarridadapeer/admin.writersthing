"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function FoundingWritersDashboard() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalSlots: 100,
    accepted: 0,
    pending: 0,
    remaining: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    // Fetch all founding writers to calculate stats
    const { data, error } = await supabase
      .from("founding_writers")
      .select("status");

    if (!error && data) {
      const accepted = data.filter((w: any) => w.status === "Accepted").length;
      const totalTaken = data.length;
      setStats({
        totalSlots: 100,
        accepted,
        pending: 0,
        remaining: 100 - totalTaken,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to view this module.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Founding Writers Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage the exclusive list of 100 founding writers.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Slots" value={stats.totalSlots} icon={<Users size={20} />} />
            <StatCard label="Accepted Founders" value={stats.accepted} icon={<CheckCircle2 size={20} />} textColor="text-emerald-600" />
            <StatCard label="Available Slots" value={stats.remaining} icon={<Users size={20} />} alert={stats.remaining < 10} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <ActionCard title="Invite Founder" desc="Invite a new founding writer to the platform." href="/founding-writers/invite" />
            <ActionCard title="Founder List" desc="View the complete list of founding writers." href="/founding-writers/list" />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, textColor = "text-zinc-900", alert = false }: any) {
  return (
    <div className={`p-6 border rounded-lg shadow-sm transition-all ${alert ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
      <div className="flex justify-between items-center mb-4">
        <p className={`text-[10px] font-black uppercase tracking-widest ${alert ? "text-red-500" : "text-zinc-500"}`}>{label}</p>
        <span className={alert ? "text-red-400" : "text-zinc-400"}>{icon}</span>
      </div>
      <span className={`text-4xl font-black ${textColor}`}>{value}</span>
    </div>
  );
}

function ActionCard({ title, desc, href }: { title: string, desc: string, href: string }) {
  return (
    <Link href={href} className="block p-6 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition-all group">
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 group-hover:text-black mb-2">{title}</h3>
      <p className="text-xs text-zinc-500">{desc}</p>
    </Link>
  );
}
