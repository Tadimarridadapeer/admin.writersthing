"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Download, FileText, TrendingUp, Users, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type ReportType = "sales" | "payouts" | "users" | "content";

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch preview data when the tab changes
  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        let query;
        switch (activeReport) {
          case "sales":
            query = supabase.from("orders").select("id, amount, status, created_at, razorpay_order_id").order("created_at", { ascending: false }).limit(10);
            break;
          case "payouts":
            query = supabase.from("withdrawals").select("id, amount, status, upi_id, created_at").order("created_at", { ascending: false }).limit(10);
            break;
          case "users":
            query = supabase.from("users").select("id, name, email, role, created_at").order("created_at", { ascending: false }).limit(10);
            break;
          case "content":
            query = supabase.from("books").select("id, title, status, price, sales_count, created_at").order("created_at", { ascending: false }).limit(10);
            break;
        }

        const { data, error } = await query;
        if (error) throw error;
        setDataPreview(data || []);
      } catch (err: any) {
        console.error(`Error fetching ${activeReport} preview:`, err);
        setErrorMsg(`Failed to load ${activeReport} preview: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [activeReport]);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setErrorMsg(null);
    try {
      // Fetch ALL data for the CSV (no limit)
      let query;
      switch (activeReport) {
        case "sales":
          query = supabase.from("orders").select("id, user_id, book_id, amount, status, razorpay_order_id, created_at").order("created_at", { ascending: false });
          break;
        case "payouts":
          query = supabase.from("withdrawals").select("id, author_id, amount, status, upi_id, failure_reason, created_at").order("created_at", { ascending: false });
          break;
        case "users":
          query = supabase.from("users").select("id, name, email, role, age, created_at").order("created_at", { ascending: false });
          break;
        case "content":
          query = supabase.from("books").select("id, author_id, title, category, price, status, sales_count, created_at").order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No data available to export.");
      }

      // Convert JSON to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [];
      
      // Header row
      csvRows.push(headers.map(header => `"${header}"`).join(","));

      // Data rows
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          // Escape quotes and wrap in quotes
          const strVal = val === null || val === undefined ? "" : String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `writersthing_${activeReport}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err: any) {
      console.error(`Error generating ${activeReport} CSV:`, err);
      setErrorMsg(err.message || "Failed to generate CSV download.");
    } finally {
      setDownloading(false);
    }
  };

  const getReportDetails = (type: ReportType) => {
    switch (type) {
      case "sales": return { title: "Sales & Revenue", icon: <TrendingUp className="h-5 w-5 text-emerald-500" />, desc: "Export all historical order transactions, successful and failed payments." };
      case "payouts": return { title: "Author Payouts", icon: <FileText className="h-5 w-5 text-orange-500" />, desc: "Export all withdrawal requests, including pending, completed, and failed." };
      case "users": return { title: "User Growth", icon: <Users className="h-5 w-5 text-blue-500" />, desc: "Export the full list of registered users and authors on the platform." };
      case "content": return { title: "Content Inventory", icon: <BookOpen className="h-5 w-5 text-indigo-500" />, desc: "Export all published and draft books across the entire platform." };
    }
  };

  const currentReport = getReportDetails(activeReport);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">Generate and export platform data for analysis.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Report Selector */}
        <div className="lg:col-span-1 space-y-2">
          {(["sales", "payouts", "users", "content"] as ReportType[]).map((type) => {
            const details = getReportDetails(type);
            const isActive = activeReport === type;
            return (
              <button
                key={type}
                onClick={() => setActiveReport(type)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isActive 
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-md" 
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className={`rounded-md p-1.5 ${isActive ? 'bg-white/20' : 'bg-zinc-100'}`}>
                  {details.icon}
                </div>
                <span className="font-medium text-sm">{details.title}</span>
              </button>
            );
          })}
        </div>

        {/* Report Main Content Area */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            
            {/* Header / Action Area */}
            <div className="border-b border-zinc-200 p-6 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{currentReport.title} Report</h2>
                <p className="text-sm text-zinc-500 mt-1 max-w-md">{currentReport.desc}</p>
              </div>
              <button
                onClick={handleDownloadCSV}
                disabled={downloading || loading || dataPreview.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-50 transition-all flex-shrink-0"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating CSV...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download CSV
                  </>
                )}
              </button>
            </div>

            {/* Data Preview Area */}
            <div className="flex-1 p-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                </div>
              ) : dataPreview.length > 0 ? (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 text-zinc-500 sticky top-0 border-b border-zinc-200">
                    <tr>
                      {Object.keys(dataPreview[0]).map((key) => (
                        <th key={key} className="px-6 py-3 font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {dataPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="px-6 py-4 text-zinc-600">
                            {val === null || val === undefined 
                              ? <span className="text-zinc-400">-</span> 
                              : String(val).length > 30 ? `${String(val).substring(0, 30)}...` : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900">No data found</h3>
                  <p className="mt-1 text-sm text-zinc-500">There are no records available for this report type yet.</p>
                </div>
              )}
            </div>
            
            {/* Footer Note */}
            {!loading && dataPreview.length > 0 && (
              <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 text-xs text-zinc-500 text-center">
                Showing top 10 preview rows. Download the CSV to view all records.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
