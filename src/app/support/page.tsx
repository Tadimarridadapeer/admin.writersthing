"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Clock, CheckCircle2, ChevronRight, XCircle, Mail } from "lucide-react";
import { format } from "date-fns";

export default function SupportPage() {
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [failedWithdrawals, setFailedWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [books, setBooks] = useState<Record<string, any>>({});
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");

  const fetchSupportData = async () => {
    try {
      const res = await fetch("/api/support");
      if (!res.ok) throw new Error("Failed to fetch support data");
      const data = await res.json();

      const userMap: Record<string, any> = {};
      (data.users || []).forEach((u: any) => { userMap[u.id] = u; });

      const bookMap: Record<string, any> = {};
      (data.books || []).forEach((b: any) => { bookMap[b.id] = b; });
      
      const authorMap: Record<string, any> = {};
      (data.authors || []).forEach((a: any) => { authorMap[a.id] = a; });

      setFailedPayments(data.failedPayments || []);
      setFailedWithdrawals(data.failedWithdrawals || []);
      setUsers(userMap);
      setBooks(bookMap);
      setAuthors(authorMap);
    } catch (err: any) {
      console.error("Failed to fetch support data:", err);
      setErrorMsg(err.message || "An unexpected error occurred while fetching support data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();

    // Subscribe to changes in case of real-time support issues
    const channel = supabase
      .channel('operations_support_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchSupportData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchSupportData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">Database Error</h2>
          <p className="text-sm text-zinc-500 mt-1 max-w-md">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Support Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Proactively manage operational issues, failed transactions, and user support needs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Failed / Stuck Payments"
          value={failedPayments.length.toString()}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          description="Requires attention to assist buyers"
        />
        <MetricCard
          title="Failed Withdrawals"
          value={failedWithdrawals.length.toString()}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          description="UPI issues for authors"
        />
        <MetricCard
          title="Total Open Issues"
          value={(failedPayments.length + failedWithdrawals.length).toString()}
          icon={<Clock className="h-5 w-5 text-zinc-500" />}
          description="Total items needing support"
        />
      </div>

      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("payments")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "payments" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Failed / Pending Payments
            {failedPayments.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                {failedPayments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "withdrawals" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Failed Withdrawals
            {failedWithdrawals.length > 0 && (
              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                {failedWithdrawals.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {activeTab === "payments" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Txn ID / Date</th>
                  <th className="px-6 py-4 font-medium">Buyer</th>
                  <th className="px-6 py-4 font-medium">Target Book & Author UPI</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {failedPayments.length > 0 ? (
                  failedPayments.map((payment) => {
                    const user = users[payment.user_id];
                    
                    let bookTitle = 'Unknown / Cart Checkout';
                    let authorEmail = '';
                    let upiId = '';
                    
                    if (payment.project_id) {
                      const book = books[payment.project_id];
                      if (book) {
                        bookTitle = book.title;
                        const authorProfile = authors[book.author_id];
                        const authorUser = authorProfile ? users[authorProfile.user_id] || users[book.author_id] : users[book.author_id];
                        authorEmail = authorUser?.email || '';
                        upiId = book.upi_id || authorProfile?.upi_id || authorUser?.active_upi_id || 'Not Provided';
                      } else {
                        bookTitle = `Project ID: ${payment.project_id}`;
                      }
                    }

                    return (
                      <tr key={payment.id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4">
                          <div className="font-mono text-zinc-900">{payment.id.split('-')[0]}...</div>
                          <div className="text-zinc-500 text-xs mt-1">{format(new Date(payment.created_at), 'PPp')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {user ? (
                            <div>
                              <div className="font-medium text-zinc-900">{user.name}</div>
                              <div className="text-zinc-500 text-xs flex items-center gap-1">
                                {user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">Unknown Buyer</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{bookTitle}</div>
                          {authorEmail && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <span className="text-xs text-zinc-500">{authorEmail}</span>
                              <span className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded w-fit text-zinc-500">UPI: {upiId}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">₹{Number(payment.amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4">
                          {user?.email && (
                            <a href={`mailto:${user.email}?subject=Regarding your recent payment attempt on Writer's Thing`} className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800">
                              <Mail className="h-3 w-3" />
                              Contact User
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No failed or stuck payments found!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Request Date</th>
                  <th className="px-6 py-4 font-medium">Author Affected</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Failure Reason</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {failedWithdrawals.length > 0 ? (
                  failedWithdrawals.map((withdrawal) => {
                    const user = users[withdrawal.author_id];
                    return (
                      <tr key={withdrawal.id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 text-zinc-500">
                          {format(new Date(withdrawal.created_at), 'PPp')}
                        </td>
                        <td className="px-6 py-4">
                          {user ? (
                            <div>
                              <div className="font-medium text-zinc-900">{user.name}</div>
                              <div className="text-zinc-500 text-xs">{user.email}</div>
                              <div className="text-zinc-500 text-xs font-mono mt-1 px-1.5 py-0.5 bg-zinc-100 rounded inline-block">UPI: {withdrawal.upi_id}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">Unknown Author</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          ₹{Number(withdrawal.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 max-w-[250px]">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{withdrawal.failure_reason || "Unknown error occurred during payout."}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                          {user?.email && (
                            <a href={`mailto:${user.email}?subject=Action Required: Payout Failed on Writer's Thing`} className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800">
                              <Mail className="h-3 w-3" />
                              Contact Author
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No failed withdrawal requests found!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Pending: "bg-orange-50 text-orange-700 ring-orange-600/20",
    PENDING: "bg-orange-50 text-orange-700 ring-orange-600/20",
    Failed: "bg-red-50 text-red-700 ring-red-600/10",
    FAILED: "bg-red-50 text-red-700 ring-red-600/10",
    Rejected: "bg-red-50 text-red-700 ring-red-600/10",
  };

  const style = styles[status] || "bg-zinc-50 text-zinc-600 ring-zinc-500/10";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
