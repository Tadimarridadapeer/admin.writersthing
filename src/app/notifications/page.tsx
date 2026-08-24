"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  const [emailInput, setEmailInput] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session found. Please log in again.");

      let emails: string[] = [];
      if (targetType === "selected") {
        emails = emailInput.split(",").map(e => e.trim()).filter(e => e.length > 0);
        if (emails.length === 0) {
          throw new Error("Please enter at least one valid email address.");
        }
      }

      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ 
          type: targetType, 
          emails, 
          message: message.trim() 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      setStatus({ 
        type: "success", 
        text: "Successfully sent message to " + data.broadcastCount + " user(s)!"
      });
      setMessage("");
      if (targetType === "selected") setEmailInput("");
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notifications</h1>
        <p className="text-sm text-zinc-500 mt-1">Send system messages and broadcasts to users.</p>
      </div>
      
      <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm max-w-3xl">
        
        {status && (
          <div className={"flex items-center p-4 rounded-lg mb-6 text-sm font-medium " + (
            status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
          )}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-900">Target Audience</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="targetType" 
                  value="all"
                  checked={targetType === "all"}
                  onChange={() => setTargetType("all")}
                  className="accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">All Users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="targetType" 
                  value="selected"
                  checked={targetType === "selected"}
                  onChange={() => setTargetType("selected")}
                  className="accent-zinc-900"
                />
                <span className="text-sm text-zinc-700">Specific Users (by Email)</span>
              </label>
            </div>
          </div>

          {targetType === "selected" && (
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">User Emails</label>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user1@example.com, user2@example.com..."
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-md focus:border-zinc-900 outline-none transition-colors text-sm"
                rows={2}
                required
              />
              <p className="text-xs text-zinc-500 mt-1">Separate multiple emails with commas.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">Message Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your broadcast message here..."
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-md focus:border-zinc-900 outline-none transition-colors text-sm"
              rows={4}
              required
            />
            <p className="text-xs text-zinc-500 mt-1">This message will appear in the user's notification dropdown.</p>
          </div>

          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send Notification"}
          </button>
        </form>

      </div>
    </div>
  );
}
