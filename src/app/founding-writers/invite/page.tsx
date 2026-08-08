"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, UserPlus, CheckCircle2 } from "lucide-react";
import { logActivity } from "@/lib/activityLogger";

export default function InviteFounder() {
  const router = useRouter();
  const { user, isSuperAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    
    setError("");
    setIsLoading(true);

    try {
      // 1. Get the next available founder number
      const { data: existingWriters, error: fetchError } = await supabase
        .from("founding_writers")
        .select("founder_number")
        .order("founder_number", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextNumber = existingWriters && existingWriters.length > 0 
        ? existingWriters[0].founder_number + 1 
        : 1;

      if (nextNumber > 100) {
        throw new Error("All 100 founding writer slots have been filled.");
      }

      // 2. Insert the new founder
      const { error: insertError } = await supabase
        .from("founding_writers")
        .insert({
          founder_number: nextNumber,
          full_name: fullName,
          email_address: email,
          status: "Invited",
          invited_by: user?.id
        });

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
          if (insertError.message.includes("founder_number")) {
             throw new Error("Concurrency conflict. Please try inviting again.");
          }
          throw new Error("A founding writer with this email already exists.");
        }
        throw insertError;
      }

      // 3. Log activity
      await logActivity({
        userId: user?.id,
        roleName: user?.role_name,
        action: "Invited Founding Writer",
        module: "Founding Writers",
        details: { newFounderEmail: email, newFounderName: fullName, founderNumber: nextNumber },
      });

      setAssignedNumber(nextNumber);
      setSuccess(true);
      setFullName("");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "An error occurred while sending the invite.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-red-600">You do not have permission to view this module.</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900">Invite Founder</h1>
        <p className="text-sm text-zinc-500 mt-1">Invite a new founding writer and automatically assign the next available slot.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-8">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 mb-2">Invitation Sent</h2>
            <p className="text-sm text-zinc-500 mb-6">
              The invitation has been successfully recorded. They have been permanently assigned:
            </p>
            <div className="inline-block px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-lg mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Founder Number</p>
              <p className="text-4xl font-mono font-bold text-zinc-900">#{String(assignedNumber).padStart(3, '0')}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-3 border border-zinc-200 rounded text-xs font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all"
              >
                Invite Another
              </button>
              <button
                onClick={() => router.push("/founding-writers/pending")}
                className="px-6 py-3 bg-black text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
              >
                View Pending
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="E.g. Jane Doe"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-bold">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-black text-white rounded text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
