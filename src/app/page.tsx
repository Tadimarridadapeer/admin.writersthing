"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  DollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalRevenue: 0,
    pendingBooks: 0,
  });
  const [reviewBooks, setReviewBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Real-time Reports ────────────────────────────────────────
  const [recentReports, setRecentReports] = useState<any[]>([]);
  
  // Fetch real reports from Supabase (if a 'reports' table exists)
  const fetchReports = async () => {
    const { data, error } = await supabase.from("reports").select("*, reported_by(email)");
    if (!error && data) setRecentReports(data);
    else setRecentReports([]); // fallback to empty list
  };

  useEffect(() => {
    if (user) {
      fetchGlobalData();
      fetchReports();
    }
  }, [user]);

  const fetchGlobalData = async () => {
    try {
      // 1. Fetch Stats
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: bookCount } = await supabase.from("books").select("*", { count: "exact", head: true });
      const { data: orders } = await supabase.from("orders").select("amount").eq("status", "Success");
      
      const totalRevenue = orders?.reduce((acc: number, order: any) => acc + Number(order.amount), 0) || 0;

      // 2. Fetch Books for Review
      const { data: pending, count: pendingCount } = await supabase
        .from("books")
        .select("*, authors:author_id(name)")
        .eq("status", "Review");

      setStats({
        totalUsers: userCount || 0,
        totalBooks: bookCount || 0,
        totalRevenue,
        pendingBooks: pendingCount || 0,
      });

      setReviewBooks(pending || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (bookId: string) => {
    const { error } = await supabase
      .from("books")
      .update({ status: "Published" })
      .eq("id", bookId);
    
    if (!error) fetchGlobalData();
  };

  const handleReject = async (bookId: string) => {
    const { error } = await supabase
      .from("books")
      .update({ status: "Draft" })
      .eq("id", bookId);
    
    if (!error) fetchGlobalData();
  };

  if (!user || isLoading) return <div className="h-full flex items-center justify-center text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</div>;

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight uppercase mb-4 text-zinc-900">Central Control</h1>
          <p className="text-zinc-500 font-medium">
            Platform Overview • Moderation, User Management, and Global Analytics.
          </p>
        </div>
        
        <div className="flex gap-12">
          <div className="text-right">
            <p className="text-4xl font-black tracking-tighter text-zinc-900">{(stats.totalUsers / 1000).toFixed(1)}K</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Users</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tracking-tighter text-zinc-900">₹{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Sales</p>
          </div>
        </div>
      </header>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricCard label="Total Users" value={stats.totalUsers.toLocaleString()} change="+12%" icon={<Users size={16} />} />
        <AdminMetricCard label="Published Books" value={stats.totalBooks.toLocaleString()} change="+5%" icon={<BookOpen size={16} />} />
        <AdminMetricCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="+24%" icon={<DollarSign size={16} />} />
        <AdminMetricCard label="Pending Review" value={stats.pendingBooks.toString()} alert icon={<ShieldCheck size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Approvals */}
        <section className="bg-white border border-zinc-200 rounded-lg shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-800">Manuscript Approvals</h2>
            <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-1 rounded uppercase tracking-widest">{stats.pendingBooks} Pending</span>
          </div>
          <div className="space-y-4">
            {reviewBooks.length > 0 ? reviewBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded group hover:border-zinc-300 transition-all">
                <div>
                  <h3 className="font-bold text-sm mb-1 text-zinc-900">{book.title}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">by {book.authors?.name || "Unknown Author"} • {book.category}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(book.id)}
                    className="p-2 bg-white border border-zinc-200 text-green-600 hover:bg-green-50 hover:border-green-200 transition-all rounded shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleReject(book.id)}
                    className="p-2 bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all rounded shadow-sm"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">All manuscripts have been moderated.</p>
            )}
          </div>
        </section>

        {/* Reports / Moderation */}
        <section className="bg-white border border-zinc-200 rounded-lg shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-800">Content Moderation</h2>
            <AlertCircle size={16} className="text-zinc-400" />
          </div>
          <div className="space-y-4">
            {recentReports.length > 0 ? (
            recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded group hover:border-zinc-300 transition-all">
                <div>
                  <h3 className="font-bold text-sm mb-1 text-zinc-900">{report.title}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Report: {report.reason}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${report.status === "Pending" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-500"}`}
                  >
                    {report.status}
                  </span>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-2">By {report.reportedBy?.email || report.reportedBy}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">No reports available.</p>
          )}
          </div>
        </section>
      </div>

      {/* Global Sales Graph Mockup */}
      <section className="bg-white border border-zinc-200 rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-800 mb-1">Network Growth</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">New users and acquisitions per day</p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-all border-b border-transparent hover:border-zinc-900 pb-0.5">
            Export CSV <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="flex items-end justify-between h-48 gap-2 px-2">
          {/* Real-time graph data could be fetched here. Currently showing placeholder empty state. */}
        {/** Uncomment and implement fetchMetrics if you have a metrics table **/}
        {/*
        {metrics.map((point, i) => (
          <div key={i} className="flex-grow flex flex-col items-center group">
            <div
              className={`w-full transition-all duration-500 rounded-t-sm ${i === metrics.length - 1 ? "bg-zinc-900" : "bg-zinc-100 group-hover:bg-zinc-200"}`}
              style={{ height: `${point.value}%` }}
            />
          </div>
        ))}
        */}
        <p className="text-center text-zinc-500 text-sm mt-4">No graph data available.</p>
        </div>
      </section>

    </div>
  );
}

function AdminMetricCard({ label, value, change, icon, alert }: any) {
  return (
    <div className={`p-6 rounded-lg shadow-sm transition-all border ${alert ? "bg-red-50/50 border-red-100" : "bg-white border-zinc-200"}`}>
      <div className="flex justify-between items-center mb-4">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${alert ? "text-red-600" : "text-zinc-500"}`}>{label}</p>
        <div className={alert ? "text-red-500" : "text-zinc-400"}>{icon}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={`text-3xl font-black tracking-tight ${alert ? "text-red-700" : "text-zinc-900"}`}>{value}</span>
        {change && <span className="text-[10px] font-bold text-emerald-600">{change}</span>}
      </div>
    </div>
  );
}
