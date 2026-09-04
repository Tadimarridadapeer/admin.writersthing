"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [authorEarnings, setAuthorEarnings] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [books, setBooks] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, any>>({});
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const fetchPaymentsData = async () => {
    try {
      const res = await fetch("/api/payments");
      if (!res.ok) throw new Error("Failed to fetch payments data");
      const data = await res.json();

      const userMap: Record<string, any> = {};
      (data.users || []).forEach((u: any) => { userMap[u.id] = u; });

      const bookMap: Record<string, any> = {};
      (data.books || []).forEach((b: any) => { bookMap[b.id] = b; });
      
      const authorMap: Record<string, any> = {};
      (data.authors || []).forEach((a: any) => { authorMap[a.id] = a; });

      setPayments(data.payments || []);
      setPurchases(data.purchases || []);
      setAuthorEarnings(data.authorEarnings || []);
      setWithdrawals(data.withdrawals || []);
      setUsers(userMap);
      setBooks(bookMap);
      setAuthors(authorMap);
    } catch (err: any) {
      console.error("Failed to fetch payments data:", err);
      setErrorMsg(err.message || "An unexpected error occurred while fetching payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();

    const channel = supabase
      .channel('operations_payments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPaymentsData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchPaymentsData();
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

  const totalProcessed = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRevenue = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.commission_amount || 0), 0);
  const totalExpenses = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.writer_amount || 0), 0);
  const successfulPayments = payments.filter(p => p.status === 'SUCCESS').length;
  const failedPayments = payments.filter(p => p.status === 'FAILED').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Payments & Payouts</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage incoming user payments and track expenses for outgoing author withdrawals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Processed"
          value={`₹${totalProcessed.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          description="Gross amount processed"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          description="Platform commissions"
        />
        <MetricCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          description="Author earnings/payouts"
        />
        <MetricCard
          title="Pending Withdrawals"
          value={pendingWithdrawals.toString()}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          description="Author payouts needing action"
        />
        <MetricCard
          title="Failed Payments"
          value={failedPayments.toString()}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          description="Failed or cancelled"
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
            Payments
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "withdrawals" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Withdrawal Requests
            {pendingWithdrawals > 0 && (
              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                {pendingWithdrawals} new
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
                  <th className="px-6 py-4 font-medium">Paid</th>
                  <th className="px-6 py-4 font-medium">Platform Fee</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {payments.length > 0 ? (
                  payments.map((payment) => {
                    const buyer = users[payment.user_id];
                    const paymentPurchases = purchases.filter(p => p.payment_id === payment.id);
                    const isExpanded = expandedPaymentId === payment.id;
                    
                    return (
                      <React.Fragment key={payment.id}>
                        <tr className="hover:bg-zinc-50/50 cursor-pointer" onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}>
                          <td className="px-6 py-4">
                            <div className="font-mono text-zinc-900">{payment.id.split('-')[0]}...</div>
                            <div className="text-zinc-500 text-xs mt-1">{format(new Date(payment.created_at), 'PPp')}</div>
                          </td>
                          <td className="px-6 py-4">
                            {buyer ? (
                              <div>
                                <div className="font-medium text-zinc-900">{buyer.name}</div>
                                <div className="text-zinc-500 text-xs">{buyer.email}</div>
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic">Unknown User</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-zinc-900">₹{Number(payment.amount).toFixed(2)}</td>
                          <td className="px-6 py-4 font-medium text-emerald-600">₹{Number(payment.commission_amount || 0).toFixed(2)}</td>
                          <td className="px-6 py-4"><StatusBadge status={payment.status} /></td>
                          <td className="px-6 py-4 text-right">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400 inline" /> : <ChevronDown className="h-4 w-4 text-zinc-400 inline" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-zinc-50/50 border-t-0">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="text-xs text-zinc-700 bg-white p-4 rounded border border-zinc-200">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div><span className="font-semibold text-zinc-500">Order ID:</span> <span className="font-mono">{payment.order_id}</span></div>
                                  <div><span className="font-semibold text-zinc-500">Gateway Txn ID:</span> <span className="font-mono">{payment.payment_id}</span></div>
                                </div>
                                <h4 className="font-bold mb-2">Purchased Items & Earnings</h4>
                                <table className="w-full border text-left">
                                  <thead className="bg-zinc-100 text-zinc-500">
                                    <tr>
                                      <th className="px-3 py-2 font-medium">Book</th>
                                      <th className="px-3 py-2 font-medium">Author</th>
                                      <th className="px-3 py-2 font-medium">Contact & UPI</th>
                                      <th className="px-3 py-2 font-medium">Gross</th>
                                      <th className="px-3 py-2 font-medium">Author Net</th>
                                      <th className="px-3 py-2 font-medium">Payout Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paymentPurchases.map(purchase => {
                                      const earning = authorEarnings.find(e => e.purchase_id === purchase.id);
                                      const authorUser = earning ? users[earning.author_id] : null;
                                      
                                      const book = books[purchase.book_id];
                                      const bookTitle = book?.title || 'Unknown Book';
                                      
                                      const authorProfile = book ? authors[book.author_id] : null;
                                      const upiId = book?.upi_id || authorProfile?.upi_id || authorUser?.active_upi_id || 'Not Provided';
                                      
                                      return (
                                        <tr key={purchase.id} className="border-t border-zinc-100">
                                          <td className="px-3 py-2">{bookTitle}</td>
                                          <td className="px-3 py-2">{authorUser ? authorUser.name : 'Unknown'}</td>
                                          <td className="px-3 py-2">
                                            {authorUser && (
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-zinc-600">{authorUser.email}</span>
                                                <span className="text-xs font-mono bg-zinc-100 px-1 py-0.5 rounded w-fit text-zinc-500">{upiId}</span>
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-3 py-2">₹{Number(purchase.amount).toFixed(2)}</td>
                                          <td className="px-3 py-2 text-blue-600">₹{earning ? Number(earning.net_amount).toFixed(2) : '0.00'}</td>
                                          <td className="px-3 py-2"><StatusBadge status={payment.payout_status || 'NOT_RELEASED'} /></td>
                                        </tr>
                                      );
                                    })}
                                    {paymentPurchases.length === 0 && (
                                      <tr><td colSpan={6} className="px-3 py-2 text-center text-zinc-400">
                                        {payment.project_id ? `Payment for Project/Book ID: ${payment.project_id}` : 'No items found for this payment.'}
                                      </td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No payments found.</td>
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
                  <th className="px-6 py-4 font-medium">Author</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status & Issues</th>
                  <th className="px-6 py-4 font-medium">UPI ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal) => {
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
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">Unknown Author</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          ₹{Number(withdrawal.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={withdrawal.status} />
                          {withdrawal.failure_reason && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 max-w-[200px]">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{withdrawal.failure_reason}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-600">
                          {withdrawal.upi_id}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No withdrawal requests found.
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
    NOT_RELEASED: "bg-zinc-50 text-zinc-600 ring-zinc-500/10",
    READY: "bg-blue-50 text-blue-700 ring-blue-600/20",
    TRANSFERRED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
  };

  const style = styles[status] || "bg-zinc-50 text-zinc-600 ring-zinc-500/10";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
