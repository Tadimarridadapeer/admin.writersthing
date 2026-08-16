"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Activity, FileText, Clock } from "lucide-react";

const COLORS = ["#0ea5e9", "#f43f5e", "#10b981", "#8b5cf6"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: analyticsData, error } = await supabase.rpc("get_operations_analytics");
        if (error) {
          console.error("Error fetching analytics:", error);
          setErrorMsg(error.message || JSON.stringify(error) || "Failed to fetch analytics from Supabase.");
          return;
        }
        setData(analyticsData);
      } catch (err: any) {
        console.error("Failed to load analytics:", err);
        setErrorMsg(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col h-full min-h-[400px] items-center justify-center space-y-4">
        <div className="rounded-full bg-red-100 p-3 text-red-600">
          <Activity className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">Analytics Error</h2>
          <p className="text-sm text-zinc-500 mt-1 max-w-md">
            {errorMsg}
          </p>
          <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 text-left max-w-lg">
            <p className="font-medium text-zinc-900 mb-2">Did you run the SQL script?</p>
            <p>This dashboard requires the <code>get_operations_analytics</code> RPC function. Please ensure you have executed the <code>supabase_operations_analytics.sql</code> script in your Supabase SQL editor.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-zinc-500">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and view system-wide analytics.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data.totalUsers?.toString() || "0"}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          description="Total registered users"
        />
        <MetricCard
          title="Active Users (30d)"
          value={data.activeUsers30d?.toString() || "0"}
          icon={<Activity className="h-5 w-5 text-emerald-500" />}
          description="Users active in last 30 days"
        />
        <MetricCard
          title="Total Content"
          value={((data.totalContent?.books || 0) + (data.totalContent?.stories || 0) + (data.totalContent?.blogs || 0)).toString()}
          icon={<FileText className="h-5 w-5 text-indigo-500" />}
          description="Books, stories, and blogs"
        />
        <MetricCard
          title="Total Views"
          value={data.contentBreakdown?.reduce((sum: number, item: any) => sum + item.value, 0).toString() || "0"}
          icon={<Clock className="h-5 w-5 text-rose-500" />}
          description="Total views across all content"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Over Time Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Engagement Over Time (30 Days)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyEngagement || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" name="Views" dataKey="views" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Read Completions" dataKey="completions" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Consumption Breakdown */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Content Consumption (Views)</h2>
          <div className="flex h-[300px] w-full items-center justify-center">
            {data.contentBreakdown && data.contentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.contentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {data.contentBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} Views`, ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500">No content consumption data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-900">Top Users by Engagement</h2>
          <p className="mt-1 text-sm text-zinc-500">Users with the highest number of views and read completions.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium text-right">Engagement Score (Events)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.topUsers && data.topUsers.length > 0 ? (
                data.topUsers.map((user: any, index: number) => (
                  <tr key={user.user_id || index} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium">{user.name?.charAt(0) || "U"}</span>
                          )}
                        </div>
                        <span className="font-medium text-zinc-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {user.engagement_score}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                    No top users data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
        <div className="rounded-md bg-zinc-50 p-2">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900">{value}</div>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
