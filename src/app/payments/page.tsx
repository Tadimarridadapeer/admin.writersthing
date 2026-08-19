"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function PaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "withdrawals">("orders");

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        // Fetch all data in parallel
        const [ordersRes, withdrawalsRes, usersRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
          supabase.from("users").select("id, name, email")
        ]);

        if (ordersRes.error) throw new Error(`Orders Error: ${ordersRes.error.message || JSON.stringify(ordersRes.error)}`);
        if (withdrawalsRes.error) throw new Error(`Withdrawals Error: ${withdrawalsRes.error.message || JSON.stringify(withdrawalsRes.error)}`);
        if (usersRes.error) throw new Error(`Users Error: ${usersRes.error.message || JSON.stringify(usersRes.error)}`);

        // Map users for easy lookup
        const userMap: Record<string, any> = {};
        usersRes.data?.forEach((u: any) => {
          userMap[u.id] = u;
        });

        setOrders(ordersRes.data || []);
        setWithdrawals(withdrawalsRes.data || []);
        setUsers(userMap);
      } catch (err: any) {
        console.error("Failed to fetch payments data:", err);
        setErrorMsg(err.message || "An unexpected error occurred while fetching payments.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsData();
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
          <p className="text-sm text-zinc-500 mt-1 max-w-md">
            {errorMsg}
          </p>
          <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 text-left max-w-lg">
            <p className="font-medium text-zinc-900 mb-2">Missing Tables?</p>
            <p>If the error mentions that a relation (like <code>withdrawals</code> or <code>orders</code>) does not exist, it means the corresponding SQL schema script hasn't been executed in your Supabase SQL editor yet. Please locate and run <code>supabase_withdrawals.sql</code> or similar scripts.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalRevenue = orders.filter(o => o.status === 'Success').reduce((sum, o) => sum + Number(o.amount), 0);
  const successfulPayments = orders.filter(o => o.status === 'Success').length;
  const failedPayments = orders.filter(o => o.status === 'Failed').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Payments & Payouts</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage incoming user payments and outgoing author withdrawals.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          description="From successful orders"
        />
        <MetricCard
          title="Successful Payments"
          value={successfulPayments.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
          description="Completed orders"
        />
        <MetricCard
          title="Failed Payments"
          value={failedPayments.toString()}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          description="Failed or cancelled orders"
        />
        <MetricCard
          title="Pending Withdrawals"
          value={pendingWithdrawals.toString()}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          description="Author payouts needing action"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "orders"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Incoming Orders
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "withdrawals"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
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

      {/* Tables Content */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {activeTab === "orders" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID / Date</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Gateway ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const user = users[order.user_id];
                    return (
                      <tr key={order.id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{order.id.split('-')[0]}...</div>
                          <div className="text-zinc-500 text-xs mt-1">{format(new Date(order.created_at), 'PPp')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {user ? (
                            <div>
                              <div className="font-medium text-zinc-900">{user.name}</div>
                              <div className="text-zinc-500 text-xs">{user.email}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">Unknown User</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          ₹{Number(order.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                          {order.razorpay_order_id}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No incoming orders found.
                    </td>
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
    Success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Pending: "bg-orange-50 text-orange-700 ring-orange-600/20",
    Failed: "bg-red-50 text-red-700 ring-red-600/10",
    Rejected: "bg-red-50 text-red-700 ring-red-600/10",
  };

  const style = styles[status] || "bg-zinc-50 text-zinc-600 ring-zinc-500/10";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
