"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Book, BookOpen, FileText, CheckCircle, XCircle, Loader2, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

interface ModerationItem {
  id: string;
  title: string;
  description: string;
  type: "Book" | "Story" | "Blog";
  authorName: string;
  submittedAt: string;
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPendingContent = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // We run parallel queries, but catch individual errors so missing tables don't crash the whole page
      const [booksRes, storiesRes, blogsRes] = await Promise.allSettled([
        supabase.from("books").select("id, title, description, updated_at, authors:author_id(users:user_id(name))").eq("status", "Review"),
        supabase.from("stories").select("id, title, description, updated_at, authors:author_id(users:user_id(name))").eq("status", "Review"),
        supabase.from("blogs").select("id, title, description, updated_at, authors:author_id(users:user_id(name))").eq("status", "Review")
      ]);

      const pendingItems: ModerationItem[] = [];

      if (booksRes.status === "fulfilled" && booksRes.value.data) {
        booksRes.value.data.forEach((b: any) => {
          pendingItems.push({
            id: b.id,
            title: b.title,
            description: b.description,
            type: "Book",
            authorName: b.authors?.users?.name || "Unknown",
            submittedAt: b.updated_at
          });
        });
      }

      if (storiesRes.status === "fulfilled" && storiesRes.value.data) {
        storiesRes.value.data.forEach((s: any) => {
          pendingItems.push({
            id: s.id,
            title: s.title,
            description: s.description,
            type: "Story",
            authorName: s.authors?.users?.name || "Unknown",
            submittedAt: s.updated_at
          });
        });
      }

      if (blogsRes.status === "fulfilled" && blogsRes.value.data) {
        blogsRes.value.data.forEach((b: any) => {
          pendingItems.push({
            id: b.id,
            title: b.title,
            description: b.description,
            type: "Blog",
            authorName: b.authors?.users?.name || "Unknown",
            submittedAt: b.updated_at
          });
        });
      }

      // Sort by oldest first (longest in queue)
      pendingItems.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      setItems(pendingItems);
      
    } catch (err: any) {
      console.error("Moderation fetch error:", err);
      setErrorMsg("Failed to load moderation queue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const handleAction = async (id: string, type: "Book" | "Story" | "Blog", newStatus: "Published" | "Draft") => {
    setProcessingId(id);
    try {
      const tableName = type === "Book" ? "books" : type === "Story" ? "stories" : "blogs";
      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
        
      if (error) throw error;
      
      // Remove from list
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error(`Error updating ${type}:`, err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getIcon = (type: "Book" | "Story" | "Blog") => {
    switch (type) {
      case "Book": return <Book className="h-4 w-4 text-indigo-500" />;
      case "Story": return <BookOpen className="h-4 w-4 text-emerald-500" />;
      case "Blog": return <FileText className="h-4 w-4 text-orange-500" />;
    }
  };

  const getBadgeStyle = (type: "Book" | "Story" | "Blog") => {
    switch (type) {
      case "Book": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Story": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Blog": return "bg-orange-50 text-orange-700 border-orange-100";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Moderation Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Review and approve content submitted by authors.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-zinc-200 p-6 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Pending Review</h2>
            <p className="text-sm text-zinc-500 mt-1">
              There are currently {items.length} items waiting for approval.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm">Loading moderation queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <p className="text-base font-medium text-zinc-900">Queue is clear!</p>
            <p className="text-sm text-zinc-500 mt-1">No content is currently pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-zinc-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(item.type)}`}>
                      {getIcon(item.type)}
                      {item.type}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Submitted {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 truncate mb-1">{item.title}</h3>
                  <p className="text-sm font-medium text-zinc-500 mb-2">by {item.authorName}</p>
                  <p className="text-sm text-zinc-600 line-clamp-2 italic">{item.description}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <button 
                    onClick={() => handleAction(item.id, item.type, "Draft")}
                    disabled={processingId === item.id}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, item.type, "Published")}
                    disabled={processingId === item.id}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
